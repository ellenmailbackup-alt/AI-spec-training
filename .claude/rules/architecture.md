---
paths:
  - "server/**/*.ts"
---

# Architecture Rules for Server Code

## 3-Layer Pattern (MANDATORY)
Every server feature MUST follow the pattern demonstrated in `server/roastService.ts`:

1. **Routes** (`server/routes.ts`): HTTP concerns ONLY
   - Parse and validate request (Zod)
   - Check auth (`requireAuth` middleware)
   - Call service method
   - Format and send response
   - NEVER: business logic, transactions, complex queries

2. **Services** (`server/*Service.ts`): Business logic
   - Orchestrate operations
   - Handle `db.transaction()` calls
   - Apply business rules
   - Call storage methods
   - NEVER: HTTP concerns, `req`/`res` objects

3. **Storage** (`server/storage.ts`): Data access
   - CRUD operations
   - SQL queries via Drizzle ORM
   - NEVER: business logic, in-memory filtering, transactions

## Known Issues to Fix
Reference: `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md`
- 19 architectural violations identified (7 HIGH, 8 MEDIUM, 4 LOW)
- routes.ts has 175 try-catch blocks with business logic
- storage.ts has N+1 queries (product stats: 4→1, customer stats: 6→2)
- 13 dynamic imports that should be static
- 182 generic "Failed to..." error messages

## Error Handling Pattern
```typescript
// CORRECT
app.get("/api/resource/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid resource ID", code: "INVALID_ID" });
  const result = await resourceService.getById(id);
  if (!result) return res.status(404).json({ error: "Resource not found", code: "NOT_FOUND" });
  res.json(result);
});

// WRONG — never do this
app.get("/api/resource/:id", async (req, res) => {
  try {
    // 50 lines of business logic...
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resource" }); // too generic
  }
});
```
