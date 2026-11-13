# Known Offenders

These files have the highest concentration of violations — always check them:

| File | Lines | Key Issues |
|------|-------|------------|
| `server/routes.ts` | ~3,769 | 175 try-catch with logic, 182 generic errors, 13 dynamic imports |
| `server/storage.ts` | ~2,198 | N+1 queries, in-memory filtering |
| `client/src/pages/admin/Settings.tsx` | ~2,960 | 55 useState, 10+ duplicated CRUD patterns |
| `client/src/pages/admin/ProductDetail.tsx` | ~1,949 | God component, needs splitting |
| `client/src/pages/admin/Customers.tsx` | ~1,285 | Large file, mixed concerns |
