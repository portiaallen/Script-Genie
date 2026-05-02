import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, scriptsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq, desc, and, gte, count, sql } from "drizzle-orm";
import {
  ListScriptsQueryParams,
  GenerateScriptBody,
  GetScriptParams,
  DeleteScriptParams,
} from "@workspace/api-zod";

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
      .select({
        platform: scriptsTable.platform,
        count: count(),
      })
      .from(scriptsTable)
      .where(eq(scriptsTable.userId, userId))
      .groupBy(scriptsTable.platform);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const thisWeekResult = await db
      .select({ count: count() })
      .from(scriptsTable)
      .where(
        and(
          eq(scriptsTable.userId, userId),
          gte(scriptsTable.createdAt, weekAgo),
        ),
      );

    const byPlatform: Record<string, number> = {
      TikTok: 0,
      Instagram: 0,
      YouTube: 0,
    };

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
    if (platform) {
      conditions.push(eq(scriptsTable.platform, platform));
    }

    const [scripts, totalResult] = await Promise.all([
      db
        .select()
        .from(scriptsTable)
        .where(and(...conditions))
        .orderBy(desc(scriptsTable.createdAt))
        .limit(limit ?? 20)
        .offset(offset ?? 0),
      db
        .select({ count: count() })
        .from(scriptsTable)
        .where(and(...conditions)),
    ]);

    res.json({
      scripts: scripts.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
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

    const platformGuides: Record<string, string> = {
      TikTok:
        "short-form (60-90 seconds), hook-first, trendy, casual language, high energy, quick cuts",
      Instagram:
        "polished, aspirational, engaging captions, Reels-friendly (30-60 seconds), lifestyle-focused",
      YouTube:
        "long-form friendly, SEO-optimized title, educational or entertaining, strong intro and outro, 5-10 minutes",
    };

    const guide = platformGuides[platform] ?? "general video";

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are an expert viral video script writer who specializes in ${platform} content. You know exactly what makes content go viral and get high retention rates. Create scripts that are engaging, authentic, and optimized for the platform.`,
        },
        {
          role: "user",
          content: `Create a viral video script for ${platform} about: "${topic}"

Platform style: ${guide}

Respond in this EXACT JSON format (no extra text):
{
  "title": "A click-worthy, compelling title (max 80 chars)",
  "script": "The full video script with clear sections, stage directions in [brackets], and natural dialogue/narration",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8", "hashtag9", "hashtag10"]
}

Make the script high-retention with a strong hook in the first 3 seconds. The hashtags should be SEO-optimized (mix of trending and niche tags, NO # prefix).`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    let parsed_content: { title?: string; script?: string; hashtags?: string[] };

    try {
      parsed_content = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed_content = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }

    const title = parsed_content.title ?? `${platform} Script: ${topic}`;
    const script =
      parsed_content.script ?? "Script generation failed. Please try again.";
    const hashtags = parsed_content.hashtags ?? [];

    const [inserted] = await db
      .insert(scriptsTable)
      .values({
        userId,
        topic,
        platform,
        title,
        script,
        hashtags,
      })
      .returning();

    res.status(201).json({
      ...inserted,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate script");
    res.status(500).json({ error: "Failed to generate script" });
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

    if (!script) {
      return res.status(404).json({ error: "Script not found" });
    }

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

    if (deleted.length === 0) {
      return res.status(404).json({ error: "Script not found" });
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete script");
    res.status(500).json({ error: "Failed to delete script" });
  }
});

export default router;
