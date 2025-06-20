import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalPath: text("original_path").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
});

export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").references(() => images.id).notNull(),
  filename: text("filename").notNull(),
  savedPath: text("saved_path").notNull(),
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
}).extend({
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

export const insertAnnotationSchema = createInsertSchema(annotations).omit({
  id: true,
});

export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
export type Annotation = typeof annotations.$inferSelect;

// User schema kept for compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
