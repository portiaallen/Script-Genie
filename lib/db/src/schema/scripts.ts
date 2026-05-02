import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const platformEnum = ["TikTok", "Instagram", "YouTube"] as const;
export const toneEnum = ["Funny", "Professional", "Aggressive", "Hype", "Inspirational", "Educational", "Storytelling"] as const;

export const scriptsTable = pgTable("scripts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  targetAudience: text("target_audience").notNull().default(""),
  tone: text("tone", { enum: toneEnum }).notNull().default("Hype"),
  platform: text("platform", { enum: platformEnum }).notNull(),
  title: text("title").notNull(),
  hook: text("hook").notNull().default(""),
  body: text("body").notNull().default(""),
  callToAction: text("call_to_action").notNull().default(""),
  script: text("script").notNull(),
  hookLab: text("hook_lab").array().notNull().default([]),
  aiReasoning: text("ai_reasoning").notNull().default(""),
  hashtags: text("hashtags").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScriptSchema = createInsertSchema(scriptsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scriptsTable.$inferSelect;
