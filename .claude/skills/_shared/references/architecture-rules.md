# Architecture Rules (ENFORCED)

- **3-layer separation**: Routes (HTTP only) → Services (business logic, transactions) → Storage (CRUD, queries)
- **Reference implementation**: `server/roastService.ts` — follow this pattern for ALL new services
- **No business logic in routes.ts** — only validation, auth check, call service, format response
- **All `db.transaction()` calls MUST be in `*Service.ts`** — never in routes or storage
- **No dynamic imports in routes** — all `import()` calls must be static top-level imports
- **No in-memory filtering in storage.ts** — use SQL WHERE clauses

## Key Architecture Docs
- `docs/architecture/CLEAN_ARCHITECTURE_SHOWCASE.md` — patterns and examples
- `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md` — known issues and priorities
