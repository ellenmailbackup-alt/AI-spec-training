# Query Optimization Techniques

## Issue Identification Checklist
- **N+1 queries** — multiple sequential queries that could be one
- **In-memory filtering** — `.filter()`, `.map()`, `.reduce()` on query results instead of SQL WHERE
- **Missing indexes** — frequently queried columns without indexes
- **Sequential queries** — queries that could use JOINs or subqueries
- **Repeated queries** — same data fetched multiple times

## Technique 1: Conditional Aggregation (Replace N Queries with 1)

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

## Technique 2: CASE WHEN for Year-Based Aggregation

```typescript
const [result] = await db.select({
  currentYear: sql`SUM(CASE WHEN EXTRACT(YEAR FROM ${table.date}) = ${year} THEN ${table.quantity} ELSE 0 END)`,
  previousYear: sql`SUM(CASE WHEN EXTRACT(YEAR FROM ${table.date}) = ${year - 1} THEN ${table.quantity} ELSE 0 END)`,
  allTime: sql`SUM(${table.quantity})`,
}).from(table).where(eq(table.productId, id));
```

## Technique 3: SQL WHERE Instead of JavaScript Filter

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

## Technique 4: Parallel Queries with Promise.all

```typescript
// When queries are independent but can't be combined
const [salesStats, stockStats, monthlyStats] = await Promise.all([
  db.select({...}).from(sales).where(...),
  db.select({...}).from(stockMovements).where(...),
  db.execute(sql`SELECT ... GROUP BY month`),
]);
```
