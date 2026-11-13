---
name: optimize-query
description: Optimize a database query or storage method. Consolidates N+1 queries, moves filtering to SQL.
user-invocable: true
argument-hint: "[method-name or file:line]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
agent: sql-drizzle
---

Optimize the database query or storage method specified by `$ARGUMENTS`.

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/available-mcps.md`

### Step 1: Read the current implementation
Read the target method and understand what data it fetches and returns.

### Step 2: Identify issues
- **N+1 queries** — multiple sequential queries that could be one
- **In-memory filtering** — `.filter()`, `.map()`, `.reduce()` on query results instead of SQL WHERE
- **Missing indexes** — frequently queried columns without indexes
- **Sequential queries** — queries that could use JOINs or subqueries
- **Repeated queries** — same data fetched multiple times

### Step 3: Read known issues
Read `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md` for documented query problems.

### Step 4: Rewrite the query

**Technique 1: Conditional aggregation (replace N queries with 1)**
```typescript
// BEFORE: 4 separate queries
const totalSales = await db.select({ count: count() }).from(sales).where(eq(sales.productId, id));
const totalRevenue = await db.select({ sum: sum(saleLines.total) }).from(saleLines).where(...);
const avgOrder = await db.select({ avg: avg(saleLines.total) }).from(saleLines).where(...);
const lastSale = await db.select({ max: max(sales.date) }).from(sales).where(...);

// AFTER: 1 query with conditional aggregation
const [stats] = await db.select({
  totalSales: count(),
  totalRevenue: sum(saleLines.total),
  avgOrderValue: avg(saleLines.total),
  lastSaleDate: max(sales.date),
}).from(sales)
  .innerJoin(saleLines, eq(sales.id, saleLines.saleId))
  .where(eq(saleLines.productId, id));
```

**Technique 2: CASE WHEN for year-based aggregation**
```typescript
const [result] = await db.select({
  currentYear: sql`SUM(CASE WHEN EXTRACT(YEAR FROM ${table.date}) = ${year} THEN ${table.quantity} ELSE 0 END)`,
  previousYear: sql`SUM(CASE WHEN EXTRACT(YEAR FROM ${table.date}) = ${year - 1} THEN ${table.quantity} ELSE 0 END)`,
  allTime: sql`SUM(${table.quantity})`,
}).from(table).where(eq(table.productId, id));
```

**Technique 3: SQL WHERE instead of JavaScript filter**
```typescript
// BEFORE: in-memory filtering
const all = await db.select().from(movements).where(eq(movements.productId, id));
const filtered = all.filter(m => m.reason === 2 && new Date(m.date) >= startDate);

// AFTER: SQL WHERE
const filtered = await db.select().from(movements).where(
  and(
    eq(movements.productId, id),
    eq(movements.reason, 2),
    gte(movements.date, startDate),
  )
);
```

**Technique 4: Parallel queries with Promise.all**
```typescript
// When queries are independent but can't be combined
const [salesStats, stockStats, monthlyStats] = await Promise.all([
  db.select({...}).from(sales).where(...),
  db.select({...}).from(stockMovements).where(...),
  db.execute(sql`SELECT ... GROUP BY month`),
]);
```

### Step 5: Verify correctness
Ensure the optimized query returns the same results as the original.

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
