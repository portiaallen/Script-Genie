import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const secret = req.headers["x-admin-secret"] || req.body?.secret;
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || secret !== adminSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

router.post("/admin/upgrade", requireAdmin, async (req: any, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .limit(1);

    if (!users[0]) {
      return res.status(404).json({ error: `No user found with email: ${email}` });
    }

    await db
      .update(usersTable)
      .set({ isPro: true, scriptsRemaining: 999999 })
      .where(eq(usersTable.id, users[0].id));

    req.log.info({ email, userId: users[0].id }, "Admin upgraded user to Pro");
    res.json({ success: true, message: `${email} upgraded to Pro`, userId: users[0].id });
  } catch (err) {
    req.log.error({ err }, "Admin upgrade failed");
    res.status(500).json({ error: "Upgrade failed" });
  }
});

router.post("/admin/downgrade", requireAdmin, async (req: any, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });

  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .limit(1);

    if (!users[0]) {
      return res.status(404).json({ error: `No user found with email: ${email}` });
    }

    await db
      .update(usersTable)
      .set({ isPro: false, scriptsRemaining: 3 })
      .where(eq(usersTable.id, users[0].id));

    req.log.info({ email, userId: users[0].id }, "Admin downgraded user to Free");
    res.json({ success: true, message: `${email} downgraded to Free`, userId: users[0].id });
  } catch (err) {
    req.log.error({ err }, "Admin downgrade failed");
    res.status(500).json({ error: "Downgrade failed" });
  }
});

router.get("/admin/users", requireAdmin, async (req: any, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        isPro: usersTable.isPro,
        scriptsRemaining: usersTable.scriptsRemaining,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.id))
      .limit(100);

    res.json({ users });
  } catch (err) {
    req.log.error({ err }, "Admin list users failed");
    res.status(500).json({ error: "Failed to list users" });
  }
});

export default router;
