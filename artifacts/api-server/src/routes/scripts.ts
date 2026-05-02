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
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/scripts/stats", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const totalResult = await db.select({ count: count() }).from(scriptsTable).where(eq(scriptsTable.userId, userId));
    const byPlatformResult = await db
      .select({ platform: scriptsTable.platform, count: count() })
      .from(scriptsTable).where(eq(scriptsTable.userId, userId)).groupBy(scriptsTable.platform);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekResult = await db.select({ count: count() }).from(scriptsTable)
      .where(and(eq(scriptsTable.userId, userId), gte(scriptsTable.createdAt, weekAgo)));

    const byPlatform: Record<string, number> = { TikTok: 0, Instagram: 0, YouTube: 0 };
    for (const row of byPlatformResult) byPlatform[row.platform] = Number(row.count);

    res.json({ total: Number(totalResult[0]?.count ?? 0), byPlatform, thisWeek: Number(thisWeekResult[0]?.count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/scripts", requireAuth, async (req: any, res) => {
  try {
    const parsed = ListScriptsQueryParams.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const { platform, limit, offset } = parsed.data;
    const userId = req.userId;
    const conditions = [eq(scriptsTable.userId, userId)];
    if (platform) conditions.push(eq(scriptsTable.platform, platform));

    const [scripts, totalResult] = await Promise.all([
      db.select().from(scriptsTable).where(and(...conditions)).orderBy(desc(scriptsTable.createdAt)).limit(limit ?? 20).offset(offset ?? 0),
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
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const { topic, platform, targetAudience, tone } = parsed.data;
    const userId = req.userId;

    const user = await getOrCreateUser(userId);
    if (!user.isPro && user.scriptsRemaining <= 0) {
      return res.status(402).json({ error: "You've used all 3 free scripts. Upgrade to Pro for unlimited scripts.", code: "LIMIT_REACHED", scriptsRemaining: 0 });
    }

    const platformGuides: Record<string, string> = {
      TikTok: "short-form (60-90 seconds), hook-first, trendy, casual language, high energy, pattern interrupts every 5-7 seconds",
      Instagram: "polished, aspirational, Reels-friendly (30-60 seconds), lifestyle-focused, visually descriptive",
      YouTube: "long-form friendly, SEO-optimized, educational or entertaining, 5-10 minutes, strong retention loops",
    };

    const toneGuides: Record<string, string> = {
      Funny: "comedic timing, self-deprecating humor, relatable fails, unexpected punchlines",
      Professional: "authoritative, data-driven, credibility-first, polished delivery",
      Aggressive: "bold claims, challenger mindset, calling out myths, high urgency language",
      Hype: "maximum energy, exclamation-forward, trending slang, hype-building momentum",
      Inspirational: "emotional storytelling, overcome-the-odds narrative, hope and transformation",
      Educational: "clear explanations, teach-don't-tell style, step-by-step breakdowns, value-dense",
      Storytelling: "narrative arc, character journey, conflict and resolution, cinematic descriptions",
    };

    const audience = targetAudience || "general viewers";
    const selectedTone = tone || "Hype";
    const guide = platformGuides[platform] ?? "general video";
    const toneGuide = toneGuides[selectedTone] ?? "engaging";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 3000,
      messages: [
        {
          role: "system",
          content:
            `You are a world-class viral content strategist and ${platform} script writer. ` +
            `You specialize in creating content that stops the scroll, holds attention, and drives action. ` +
            `You understand platform algorithms, audience psychology, and what makes content spread. ` +
            `You write for real humans, not AI detectors.`,
        },
        {
          role: "user",
          content: `Create a viral ${platform} script with the following brief:

Topic: "${topic}"
Target Audience: ${audience}
Tone: ${selectedTone} (${toneGuide})
Platform style: ${guide}

Respond ONLY in this exact JSON format (no extra text, no markdown code blocks):
{
  "title": "A click-worthy, compelling title (max 80 chars)",
  "hook": "The opening 3-5 seconds — a single punchy line that stops the scroll cold",
  "body": "The main content with stage directions in [brackets]. Include emotional beats, specific examples, pattern interrupts, and storytelling. Written in the exact tone requested.",
  "callToAction": "The closing 5-10 seconds — a specific, compelling CTA that creates urgency",
  "hookLab": [
    "Alternate hook option 1 — different angle",
    "Alternate hook option 2 — question format",
    "Alternate hook option 3 — bold claim",
    "Alternate hook option 4 — story opener",
    "Alternate hook option 5 — controversial take"
  ],
  "aiReasoning": "2-3 sentences explaining WHY this script will perform well: the psychological trigger used, the retention mechanism, and the virality factor for this specific audience and platform.",
  "hashtags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"]
}

Rules:
- Hook must stop the scroll in under 3 seconds
- Body maintains retention with the exact requested tone
- hookLab gives 5 completely different approaches to the opening
- aiReasoning explains the strategy, not just describes the script
- Hashtags: mix trending + niche, NO # prefix, exactly 10`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed_content: any;
    try {
      parsed_content = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      try { parsed_content = jsonMatch ? JSON.parse(jsonMatch[0]) : {}; } catch { parsed_content = {}; }
    }

    const title = parsed_content.title ?? `${platform} Script: ${topic}`;
    const hook = parsed_content.hook ?? "";
    const body = parsed_content.body ?? "";
    const callToAction = parsed_content.callToAction ?? "";
    const hookLab: string[] = Array.isArray(parsed_content.hookLab) ? parsed_content.hookLab.slice(0, 5) : [];
    const aiReasoning: string = parsed_content.aiReasoning ?? "";
    const hashtags: string[] = Array.isArray(parsed_content.hashtags) ? parsed_content.hashtags : [];
    const script = [
      hook ? `[HOOK]\n${hook}` : "",
      body ? `[BODY]\n${body}` : "",
      callToAction ? `[CALL TO ACTION]\n${callToAction}` : "",
    ].filter(Boolean).join("\n\n");

    const [inserted] = await db
      .insert(scriptsTable)
      .values({
        userId, topic,
        targetAudience: targetAudience ?? "",
        tone: (selectedTone as any),
        platform, title, hook, body, callToAction, script, hookLab, aiReasoning, hashtags,
      })
      .returning();

    if (!user.isPro) {
      await db.update(usersTable).set({ scriptsRemaining: Math.max(0, user.scriptsRemaining - 1) }).where(eq(usersTable.id, userId));
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
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const { id } = parsed.data;
    const [script] = await db.select().from(scriptsTable).where(and(eq(scriptsTable.id, id), eq(scriptsTable.userId, req.userId)));
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
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    const { id } = parsed.data;
    const deleted = await db.delete(scriptsTable).where(and(eq(scriptsTable.id, id), eq(scriptsTable.userId, req.userId))).returning();
    if (deleted.length === 0) return res.status(404).json({ error: "Script not found" });
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete script");
    res.status(500).json({ error: "Failed to delete script" });
  }
});

export default router;
