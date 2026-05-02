import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const platformEnum = ["TikTok", "Instagram", "YouTube"] as const;

export const scriptsTable = pgTable("scripts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  platform: text("platform", { enum: platformEnum }).notNull(),
  title: text("title").notNull(),
  script: text("script").notNull(),
  hashtags: text("hashtags").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScriptSchema = createInsertSchema(scriptsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scriptsTable.$inferSelect;
