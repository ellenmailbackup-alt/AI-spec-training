# Schema Conventions

All rules are mandatory when adding tables to `shared/schema.ts`.

## Primary Keys
- Always UUID: `id: uuid().defaultRandom().primaryKey()`

## Column Types
- **Text fields**: `text().notNull()` for required, `text()` for optional
- **Money fields**: Always `decimal({ precision: 10, scale: 2 }).notNull()`
- **Foreign keys**: UUID referencing parent: `uuid().references(() => parent.id)`
- **Numeric fields**: `integer().default(0)`
- **Boolean fields**: `boolean().default(true)` or `boolean().default(false)`
- **Timestamps**: `timestamp().defaultNow()`

## Relations
If the table has foreign keys, add a relations definition using `relations()` from `drizzle-orm`.

## Type Exports
Always export BOTH:
- `InferSelectModel<typeof tableName>` — for reading
- `InferInsertModel<typeof tableName>` — for writing

## Zod Schema
Always export `createInsertSchema(tableName)` from `drizzle-zod` for form validation.

## Imports
```typescript
import { pgTable, uuid, text, decimal, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { relations, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
```
