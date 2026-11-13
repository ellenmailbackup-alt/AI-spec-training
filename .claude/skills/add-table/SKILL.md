---
name: add-table
description: Add a new database table with relations, type exports, Zod schema, and migration.
user-invocable: true
argument-hint: "[table-name]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
agent: sql-drizzle
---

Add a new database table for `$ARGUMENTS` to `shared/schema.ts`.

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/available-mcps.md`

### Step 1: Read existing schema
Read `shared/schema.ts` to understand conventions and find related tables.

### Step 2: Clarify the table structure
Ask the user (if not already clear):
- What columns does this table need?
- Does it relate to existing tables? (foreign keys)
- Are there any unique constraints?
- Is soft delete needed (`isDeleted` column)?

### Step 3: Add the table definition
Add to `shared/schema.ts` following the conventions below.

### Step 4: Add relations
If the table has foreign keys, add a relations definition.

### Step 5: Export types
Export `InferSelectModel` and `InferInsertModel` types.

### Step 6: Create Zod schema
Export `createInsertSchema(table)` for form validation.

### Step 7: Generate migration
Run `npx drizzle-kit generate` and review the generated SQL.

## Schema Conventions (MANDATORY)

```typescript
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
```

## Checklist Before Generating Migration
- [ ] Primary key is `uuid().defaultRandom().primaryKey()`
- [ ] Money fields use `decimal({ precision: 10, scale: 2 })`
- [ ] Foreign keys reference the correct parent table
- [ ] `.notNull()` on required fields
- [ ] Sensible defaults (`.default(false)`, `.default(0)`, `.defaultNow()`)
- [ ] Relations defined if foreign keys exist
- [ ] Both `InferSelectModel` and `InferInsertModel` types exported
- [ ] `createInsertSchema` exported for Zod validation

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
