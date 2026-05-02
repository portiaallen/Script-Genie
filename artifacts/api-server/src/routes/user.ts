import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function getOrCreateUser(userId: string, email?: string) {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(usersTable)
    .values({ id: userId, email: email ?? null, isPro: false, scriptsRemaining: 3 })
    .returning();
  return created;
}

router.get("/profile", requireAuth, async (req: any, res) => {
  try {
    const user = await getOrCreateUser(req.userId);
    res.json({
      id: user.id,
      isPro: user.isPro,
      scriptsRemaining: user.scriptsRemaining,
      stripeCustomerId: user.stripeCustomerId ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get user profile");
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

router.post("/checkout", requireAuth, async (req: any, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: "Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID to enable payments.",
      code: "STRIPE_NOT_CONFIGURED",
    });
  }

  try {
    const user = await getOrCreateUser(req.userId);
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return res.status(503).json({ error: "Stripe price not configured", code: "STRIPE_NOT_CONFIGURED" });
    }

    const baseUrl = process.env.APP_BASE_URL || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : (user.email ?? undefined),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?upgraded=1`,
      cancel_url: `${baseUrl}/dashboard?upgraded=0`,
      metadata: { userId: req.userId },
      subscription_data: { metadata: { userId: req.userId } },
    });

    if (!user.stripeCustomerId && session.customer) {
      await db
        .update(usersTable)
        .set({ stripeCustomerId: session.customer as string })
        .where(eq(usersTable.id, req.userId));
    }

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/stripe-webhook", async (req: any, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(200).json({ received: true });

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.rawBody ?? req.body, sig, webhookSecret);
    } else {
      event = req.body as Stripe.Event;
    }
  } catch (err) {
    req.log.error({ err }, "Stripe webhook signature failed");
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await db
          .update(usersTable)
          .set({
            isPro: true,
            scriptsRemaining: 999999,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          })
          .where(eq(usersTable.id, userId));
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await db
          .update(usersTable)
          .set({ isPro: false, scriptsRemaining: 3 })
          .where(eq(usersTable.id, userId));
      }
    }
  } catch (err) {
    req.log.error({ err }, "Stripe webhook handler error");
  }

  res.json({ received: true });
});

export default router;
