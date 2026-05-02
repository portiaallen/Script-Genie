import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, scriptsTable, usersTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq, desc, and, gte, count } from "drizzle-orm";
import {
  ListScriptsQueryParams,
  GenerateScriptBody,
  GetScriptParams,
  DeleteScriptParams,
} from "@workspace/api-zod";
import { getOrCreateUser } from "./user";

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

router.get("/scripts/stats", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;

    const totalResult = await db
      .select({ count: count() })
      .from(scriptsTable)
      .where(eq(scriptsTable.userId, userId));

    const byPlatformResult = await db
      .select({ platform: scriptsTable.platform, count: count() })
      .from(scriptsTable)
      .where(eq(scriptsTable.userId, userId))
      .groupBy(scriptsTable.platform);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const thisWeekResult = await db
      .select({ count: count() })
      .from(scriptsTable)
      .where(and(eq(scriptsTable.userId, userId), gte(scriptsTable.createdAt, weekAgo)));

    const byPlatform: Record<string, number> = { TikTok: 0, Instagram: 0, YouTube: 0 };
    for (const row of byPlatformResult) {
      byPlatform[row.platform] = Number(row.count);
    }

    res.json({
      total: Number(totalResult[0]?.count ?? 0),
      byPlatform,
      thisWeek: Number(thisWeekResult[0]?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/scripts", requireAuth, async (req: any, res) => {
  try {
    const parsed = ListScriptsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { platform, limit, offset } = parsed.data;
    const userId = req.userId;

    const conditions = [eq(scriptsTable.userId, userId)];
    if (platform) conditions.push(eq(scriptsTable.platform, platform));

    const [scripts, totalResult] = await Promise.all([
      db
        .select()
        .from(scriptsTable)
        .where(and(...conditions))
        .orderBy(desc(scriptsTable.createdAt))
        .limit(limit ?? 20)
        .offset(offset ?? 0),
      db.select({ count: count() }).from(scriptsTable).where(and(...conditions)),
    ]);

    res.json({
      scripts: scripts.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
      total: Number(totalResult[0]?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list scripts");
    res.status(500).json({ error: "Failed to list scripts" });
  }
});

router.post("/scripts", requireAuth, async (req: any, res) => {
  try {
    const parsed = GenerateScriptBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { topic, platform } = parsed.data;
    const userId = req.userId;

    // Check user quota
    const user = await getOrCreateUser(userId);
    if (!user.isPro && user.scriptsRemaining <= 0) {
      return res.status(402).json({
        error: "You've used all 3 free scripts. Upgrade to Pro for unlimited scripts.",
        code: "LIMIT_REACHED",
        scriptsRemaining: 0,
      });
    }

    const platformGuides: Record<string, string> = {
      TikTok: "short-form (60-90 seconds), hook-first, trendy, casual language, high energy",
      Instagram: "polished, aspirational, Reels-friendly (30-60 seconds), lifestyle-focused",
      YouTube: "long-form friendly, SEO-optimized, educational or entertaining, 5-10 minutes",
    };
    const guide = platformGuides[platform] ?? "general video";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 2000,
      messages: [
        {
          role: "system",
          content:
            `You are a viral content strategist and expert ${platform} script writer. ` +
            `You understand exactly what makes content go viral: attention-grabbing hooks, ` +
            `tight storytelling, emotional engagement, and clear calls to action. ` +
            `You optimize every script for maximum retention and shareability on ${platform}.`,
        },
        {
          role: "user",
          content: `Create a viral ${platform} video script about: "${topic}"

Platform style: ${guide}

Respond ONLY in this exact JSON format (no extra text, no markdown):
{
  "title": "A click-worthy, compelling title (max 80 chars)",
  "hook": "The opening 3-5 seconds — a single punchy line or question that stops the scroll",
  "body": "The main content — clear sections, stage directions in [brackets], natural dialogue/narration. Include specific examples, storytelling beats, and emotional moments.",
  "callToAction": "The closing 5-10 seconds — a specific, compelling CTA that drives follows, likes, comments, or clicks",
  "hashtags": ["hashtag1","hashtag2","hashtag3","hashtag4","hashtag5","hashtag6","hashtag7","hashtag8","hashtag9","hashtag10"]
}

Rules:
- Hook must stop the scroll in under 3 seconds
- Body must maintain retention with pattern interrupts and value
- CTA must be specific, not generic ("follow for more" is too generic)
- Hashtags: mix trending + niche tags, NO # prefix, 10 exactly`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed_content: {
      title?: string;
      hook?: string;
      body?: string;
      callToAction?: string;
      hashtags?: string[];
    };

    try {
      parsed_content = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      try {
        parsed_content = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        parsed_content = {};
      }
    }

    const title = parsed_content.title ?? `${platform} Script: ${topic}`;
    const hook = parsed_content.hook ?? "";
    const body = parsed_content.body ?? "";
    const callToAction = parsed_content.callToAction ?? "";
    const hashtags = parsed_content.hashtags ?? [];
    // Full script for backward compat / copy-all
    const script = [
      hook ? `[HOOK]\n${hook}` : "",
      body ? `[BODY]\n${body}` : "",
      callToAction ? `[CALL TO ACTION]\n${callToAction}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const [inserted] = await db
      .insert(scriptsTable)
      .values({ userId, topic, platform, title, hook, body, callToAction, script, hashtags })
      .returning();

    // Deduct from free quota
    if (!user.isPro) {
      await db
        .update(usersTable)
        .set({ scriptsRemaining: Math.max(0, user.scriptsRemaining - 1) })
        .where(eq(usersTable.id, userId));
    }

    res.status(201).json({ ...inserted, createdAt: inserted.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to generate script");
    res.status(500).json({ error: "Failed to generate script. Please try again." });
  }
});

router.get("/scripts/:id", requireAuth, async (req: any, res) => {
  try {
    const parsed = GetScriptParams.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { id } = parsed.data;
    const userId = req.userId;

    const [script] = await db
      .select()
      .from(scriptsTable)
      .where(and(eq(scriptsTable.id, id), eq(scriptsTable.userId, userId)));

    if (!script) return res.status(404).json({ error: "Script not found" });

    res.json({ ...script, createdAt: script.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get script");
    res.status(500).json({ error: "Failed to get script" });
  }
});

router.delete("/scripts/:id", requireAuth, async (req: any, res) => {
  try {
    const parsed = DeleteScriptParams.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues });
    }

    const { id } = parsed.data;
    const userId = req.userId;

    const deleted = await db
      .delete(scriptsTable)
      .where(and(eq(scriptsTable.id, id), eq(scriptsTable.userId, userId)))
      .returning();

    if (deleted.length === 0) return res.status(404).json({ error: "Script not found" });

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete script");
    res.status(500).json({ error: "Failed to delete script" });
  }
});

export default router;
