---
paths:
  - "shared/schema.ts"
  - "server/storage.ts"
  - "server/db.ts"
  - "db/**/*"
---

# Database Rules

## Drizzle ORM Patterns
- UUID primary keys: `uuid().defaultRandom().primaryKey()`
- Decimal precision for money: `decimal({ precision: 10, scale: 2 })`
- Timestamps: `timestamp().defaultNow()`
- Enums: `pgEnum()` for constrained values
- Relations: `relations()` function
- Zod schemas: `createInsertSchema()` from `drizzle-zod`

## Type Exports
- Select types: `InferSelectModel<typeof table>`
- Insert types: `InferInsertModel<typeof table>`
- Always export both for each table

## Query Optimization
- NEVER use in-memory filtering — always SQL WHERE clauses
- Consolidate N+1 queries into single queries with JOINs or subqueries
- Use conditional aggregation instead of sequential queries
- Add indexes on frequently queried columns

## Migrations
- Generate with `npx drizzle-kit generate`
- Always review generated SQL before applying
- Never modify existing migration files
- Test migrations on staging before production

## Connection
- Neon serverless PostgreSQL with connection pooling
- Configure in `drizzle.config.ts`
