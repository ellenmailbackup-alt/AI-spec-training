import { pgTable, uuid, text, decimal, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { relations, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Table definition
export const tableName = pgTable("table_name", {
  // Primary key — always UUID
  id: uuid().defaultRandom().primaryKey(),

  // Text fields
  name: text().notNull(),
  description: text(),

  // Money fields — always decimal(10,2)
  price: decimal({ precision: 10, scale: 2 }).notNull(),

  // Foreign keys — UUID referencing parent
  categoryId: uuid().references(() => categories.id),

  // Numeric fields
  quantity: integer().default(0),

  // Boolean fields
  isActive: boolean().default(true),
  isDeleted: boolean().default(false),

  // Timestamps
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

// Relations
export const tableNameRelations = relations(tableName, ({ one, many }) => ({
  category: one(categories, {
    fields: [tableName.categoryId],
    references: [categories.id],
  }),
  lineItems: many(orderLines),
}));

// Type exports — ALWAYS export both
export type TableName = InferSelectModel<typeof tableName>;
export type InsertTableName = InferInsertModel<typeof tableName>;

// Zod insert schema for validation
export const insertTableNameSchema = createInsertSchema(tableName);
