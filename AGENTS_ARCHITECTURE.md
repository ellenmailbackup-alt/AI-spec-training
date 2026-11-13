# KruzeApp — Development Agents Architecture

**Date:** March 10, 2026
**Project:** KRUZE Coffee & Tea Omnichannel Management System
**Purpose:** Define development-focused AI agents that help build, test, secure, deploy, and maintain the KruzeApp codebase

---

## 1. Architecture Overview

### 1.1 Agent Tiers

```
┌──────────────────────────────────────────────────────────────────────┐
│                      DEV ORCHESTRATOR AGENT                          │
│          (Routes developer requests to specialized agents)           │
└──┬─────────────┬─────────────┬─────────────┬────────────────────────┘
   │             │             │             │
   ▼             ▼             ▼             ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ANALYSIS │ │  IMPL    │ │ QUALITY  │ │INFRASTRUCTURE│
│  TIER   │ │  TIER    │ │  TIER    │ │    TIER      │
│         │ │          │ │          │ │              │
│Analyst  │ │TypeScript│ │Testing   │ │Documentation │
│Requirem.│ │React     │ │Security  │ │DevOps/Deploy │
│Spec     │ │Express   │ │Code Qual.│ │              │
│         │ │SQL/Drizz.│ │PR Review │ │              │
└─────────┘ └──────────┘ └──────────┘ └──────────────┘
```

### 1.2 Design Principles

1. **Spec-driven**: Every change traces back to a use case → story → spec → task
2. **Language-aware**: Agents have deep expertise in the specific tech stack (TypeScript, React, Express, Drizzle/PostgreSQL)
3. **Pattern-enforcing**: Agents enforce existing codebase patterns (reference: `server/roastService.ts` for 3-layer architecture)
4. **Guideline-bound**: All agents consume and enforce the project's established guidelines:
   - Design: `docs/design/design_guidelines.md` (KRUZE brand colors, typography, component specs)
   - Security: `.claude/skills/_shared/references/security-rules.md` (OWASP, JWT auth, rate limiting, Helmet, CORS)
   - Architecture: `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md` (19 identified flaws, refactoring patterns)
   - Clean Architecture: `docs/architecture/CLEAN_ARCHITECTURE_SHOWCASE.md` (routes→services→storage separation)
   - Auth Decision: `.claude/skills/_shared/references/security-rules.md` (JWT over CSRF, Supabase auth)
5. **Composable**: Agents delegate to sub-agents and share cross-cutting skills
6. **Human-in-the-loop**: Destructive operations (migrations, deployments, deletions) always require confirmation
7. **Incremental**: Each agent is independently useful; adopt one at a time

### 1.3 Documentation Directory Structure

All project documentation lives in organized subdirectories under `docs/`:

```
docs/
├── use-cases/              ← Analyst Agent output (permanent documentation)
│   ├── UC-001-pos-sale.md
│   ├── UC-002-b2b-order.md
│   └── ...
├── specs/                  ← Spec Agent output (technical specifications)
│   ├── SPEC-001-service-extraction.md
│   └── ...
├── architecture/           ← ADRs, architecture analysis, refactoring docs
│   ├── ARCHITECTURAL_ANALYSIS_REPORT.md
│   ├── ARCHITECTURAL_ISSUES_BY_LINE.md
│   ├── ARCHITECTURAL_ISSUES_SUMMARY.md
│   ├── ARCHITECTURE_ANALYSIS_INDEX.md
│   ├── ARCHITECTURE_BEFORE_AFTER.md
│   ├── CLEAN_ARCHITECTURE_SHOWCASE.md
│   └── REFACTORING_SUMMARY.md
├── security/               ← Security guidelines, auth decisions, migration docs
│   ├── SECURITY.md
│   ├── ARCHITECTURE_DECISION_JWT_AUTH.md
│   ├── SUPABASE_AUTH_MIGRATION.md
│   └── SUPABASE_MIGRATION.md
├── design/                 ← UI/UX design system, brand guidelines
│   └── design_guidelines.md
├── product/                ← Backlog, features, epics, roadmap
│   ├── BACKLOG.md
│   ├── FUTURE_FEATURES.md
│   ├── EPIC_1_PROGRESS.md
│   ├── DASHBOARD_IMPLEMENTATION_REVIEW.md
├── api/                    ← API documentation, OpenAPI specs
│   └── endpoints.md
├── reviews/                ← PR review records, code review notes
│   └── ...
├── investigations/         ← Bug investigations, root cause analyses
│   ├── ROAST_IMPLEMENTATION_ANALYSIS.md
│   ├── ROAST_STOCK_MOVEMENT_INVESTIGATION.md
│   └── REACT_DUPLICATE_INSTANCE_FIX.md
└── guides/                 ← Developer guides, setup, deployment
    ├── PRINTER_SETUP.md
    └── PATTERNS.md
```

### 1.4 Work Hierarchy

Use cases are the permanent source of truth. Everything else flows from them:

```
Use Cases (permanent, owned by Analyst Agent)
  │   Structured documentation of what the system does and why.
  │   Lives in docs/use-cases/
  ↓
User Stories (backlog, owned by Requirements Agent)
  │   INVEST-format stories sliced from use cases.
  │   Lives in docs/product/BACKLOG.md
  ↓
Technical Specs (per-story, owned by Spec Agent)
  │   File-level implementation plans with acceptance criteria.
  │   Lives in docs/specs/
  ↓
Tasks (ephemeral, picked up by Implementation Agents)
  │   TypeScript, React, Express, SQL/Drizzle agents execute tasks.
  ↓
Acceptance Tests (permanent, owned by Testing Agent)
  │   Validate that acceptance criteria are met.
  │   Live in server/__tests__/ and client/src/__tests__/
  ↓
Reviews (per-PR, owned by PR Review Agent)
      Code review records and decisions.
      Live in docs/reviews/
```

---

## 2. Analysis Tier

### 2.1 Analyst Agent (Use Case Documentation)

**Purpose:** Create and maintain use case documentation — the permanent, authoritative record of what the system does and why. Use cases are the source of truth from which everything else (stories, specs, tasks) derives.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Domain Modeler** | Produce entity-relationship diagrams from `shared/schema.ts`, identify bounded contexts | On-demand, when planning new features |
| **Use Case Writer** | Author structured use case documents with actors, flows, rules | When new functionality is designed or discovered |
| **Process Mapper** | Map business processes across multiple use cases | When understanding cross-cutting workflows |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `create-use-case` | Write a structured use case: actors, preconditions, main flow, alternative flows, exception flows, postconditions, business rules. Output to `docs/use-cases/UC-NNN-*.md` |
| `update-use-case` | Revise an existing use case when requirements change, preserving change history |
| `map-domain-model` | Produce Mermaid ER diagram from `shared/schema.ts` (50+ tables, UUID PKs, Drizzle ORM) |
| `trace-use-case-to-code` | Map a use case to the routes, services, components, and storage methods that implement it |
| `identify-gaps` | Compare existing use cases against codebase features to find undocumented functionality |
| `generate-use-case-diagram` | Produce UML-style use case diagram in Mermaid syntax |

**Operates on:** `docs/use-cases/`, `shared/schema.ts`, `server/routes.ts`, `client/src/pages/`

**Guidelines consumed:**
- `docs/architecture/CLEAN_ARCHITECTURE_SHOWCASE.md` — understanding of current service boundaries
- `docs/product/BACKLOG.md` — existing stories that need use case backing
- `replit.md` — system overview, business context

**Use case template:**
```markdown
# UC-NNN: [Title]

## Metadata
- **Domain:** [Sales | Inventory | Finance | Customer | Product | Operations]
- **Actors:** [Primary actor, secondary actors]
- **Priority:** [Must | Should | Could]
- **Status:** [Draft | Reviewed | Approved]

## Preconditions
- [What must be true before this use case starts]

## Main Flow
1. [Step 1]
2. [Step 2]
...

## Alternative Flows
- **AF-1:** [Variant description]

## Exception Flows
- **EF-1:** [Error/edge case handling]

## Postconditions
- [What is true after successful completion]

## Business Rules
- **BR-1:** [Rule description]

## Implemented By
- Routes: [endpoint paths]
- Services: [service files]
- Components: [React components]
- Storage: [storage methods]
```

---

### 2.2 Requirements / Backlog Agent

**Purpose:** Slice use cases into INVEST-format user stories, manage the product backlog, and prioritize work. Stories must trace back to a use case.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Story Analyzer** | Parse natural language feature requests into structured stories | User describes a need |
| **Backlog Manager** | Maintain and organize `docs/product/BACKLOG.md` | Sprint planning, backlog grooming |
| **Priority Scorer** | Apply MoSCoW or WSJF prioritization | When re-prioritizing work |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `slice-use-case` | From a use case, extract INVEST-format user stories with acceptance criteria. Each story references its parent use case ID |
| `parse-story` | Take a natural language request → structured story (As a / I want / So that) with acceptance criteria |
| `decompose-epic` | Break a large feature into small, independently deliverable stories |
| `estimate-effort` | Analyze complexity based on similar past changes in the codebase |
| `update-backlog` | Add/update stories in `docs/product/BACKLOG.md` following the existing INVEST-format pattern |
| `prioritize` | Apply MoSCoW or WSJF prioritization to backlog items |

**Operates on:** `docs/use-cases/`, `docs/product/BACKLOG.md`, `docs/product/FUTURE_FEATURES.md`

**Guidelines consumed:**
- `docs/product/BACKLOG.md` — existing 146KB of INVEST-format stories with epics, acceptance criteria, SQL implementation guidance. **Must follow this exact format.**
- `docs/product/FUTURE_FEATURES.md` — planned features and roadmap
- `docs/product/EPIC_1_PROGRESS.md` — progress tracking pattern

**Story format** (must match existing BACKLOG.md style):
```markdown
### Story X.Y.Z: [Title]
**As a** [actor]
**I want** [capability]
**So that** [benefit]

**References:** UC-NNN

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**Technical Implementation:**
- Backend: [endpoints, services]
- Frontend: [components, pages]
- Database: [schema changes]

**Dependencies:** [Story X.Y.A, Story X.Y.B]
```

---

### 2.3 Spec Agent

**Purpose:** Turn user stories into technical specifications with file-level implementation plans. A spec is the bridge between "what" (story) and "how" (code).

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Spec Writer** | Produce detailed technical specification from a story | Before implementation |
| **Impact Analyzer** | Determine which existing files and functions will be affected | When scoping a change |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `generate-spec` | From a story → technical spec: affected files, schema changes (Drizzle), new endpoints (Express), UI components (React/shadcn), test cases (Vitest), migration steps |
| `trace-requirement` | Produce traceability matrix: requirement → files → functions → tests |
| `impact-analysis` | Analyze what existing code will be affected by this change, including ripple effects |
| `dependency-check` | Identify which stories/specs must be completed first |

**Operates on:** `docs/specs/`, `docs/product/BACKLOG.md`, full codebase

**Guidelines consumed:**
- `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md` — known issues to avoid amplifying
- `docs/architecture/ARCHITECTURE_BEFORE_AFTER.md` — correct refactoring patterns
- `docs/architecture/CLEAN_ARCHITECTURE_SHOWCASE.md` — 3-layer architecture rules
- `.claude/skills/_shared/references/security-rules.md` — security requirements to include in every spec

**Spec template:**
```markdown
# SPEC-NNN: [Title]

## References
- **Story:** [Story ID from BACKLOG.md]
- **Use Case:** [UC-NNN]

## Scope
[What this spec covers and what it explicitly does NOT cover]

## Schema Changes
- [ ] New tables / columns in shared/schema.ts
- [ ] Migration file via drizzle-kit generate

## Backend Changes
- [ ] Storage methods in server/storage.ts
- [ ] Service file: server/[name]Service.ts (follow roastService.ts pattern)
- [ ] Route handlers in server/routes.ts (thin HTTP layer only)
- [ ] Validation: Zod schemas for request body/params

## Frontend Changes
- [ ] Components in client/src/components/
- [ ] Pages in client/src/pages/admin/ (or /pos/ or /storefront/)
- [ ] Hooks in client/src/hooks/
- [ ] Follows design_guidelines.md: [specific guidelines referenced]

## Security Considerations
- [ ] Auth required? Which roles?
- [ ] Input validation (Zod)
- [ ] Rate limiting needed?
- [ ] References: .claude/skills/_shared/references/security-rules.md

## Test Cases
- [ ] Service unit tests (Vitest)
- [ ] Route integration tests
- [ ] Component tests (React Testing Library)

## Acceptance Criteria Validation
- [ ] [Criterion 1] → validated by [test/manual check]
- [ ] [Criterion 2] → validated by [test/manual check]
```

---

## 3. Implementation Tier

### 3.1 TypeScript Agent

**Purpose:** Language-specific expertise for TypeScript — type safety, generics, utility types, strict mode compliance. Ensures type correctness across the full stack.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Type Inference Analyzer** | Find implicit `any`, missing return types, unchecked nulls | On-demand, during code review |
| **Generic Pattern Builder** | Create reusable generic types for common patterns | When extracting shared types |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `fix-type-errors` | Resolve `tsc --noEmit` errors with proper typing — never `any` casts |
| `add-type-guards` | Create runtime type narrowing for union types and API responses |
| `generate-zod-schema` | From a TypeScript interface → matching Zod schema (or vice versa). Uses existing pattern: `createInsertSchema()` from `shared/schema.ts` |
| `optimize-types` | Replace verbose type definitions with utility types (`Pick`, `Omit`, `Partial`, `Record`) |
| `check-strict-mode` | Find implicit `any`, missing return types, unchecked nulls across codebase |
| `migrate-js-to-ts` | Convert JavaScript files to TypeScript with proper typing |

**Operates on:** All `.ts` and `.tsx` files, `tsconfig.json`, `shared/schema.ts`

**Codebase-specific patterns this agent enforces:**
- Drizzle `InferSelectModel<typeof table>` / `InferInsertModel<typeof table>` for DB types
- Zod `z.infer<typeof schema>` for runtime-validated types
- `createInsertSchema()` from `drizzle-zod` for form validation
- UUID primary keys (`uuid().defaultRandom().primaryKey()`)
- Decimal precision for monetary values (`decimal({ precision: 10, scale: 2 })`)
- Enum types for constrained values (`pgEnum`)

**Guidelines consumed:**
- `shared/schema.ts` (993 lines) — all table definitions, Zod schemas, type exports
- `tsconfig.json` — compiler strictness settings

---

### 3.2 React Agent

**Purpose:** React-specific expertise — component patterns, hooks, state management, rendering optimization. Builds UI following the KRUZE design system.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Component Builder** | Scaffold new components using shadcn/ui + Radix primitives | When building new UI |
| **Hook Extractor** | Extract repeated `useState`/`useQuery` patterns into custom hooks | During refactoring |
| **Performance Profiler** | Find unnecessary re-renders, missing memoization | On-demand |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `scaffold-admin-page` | Generate new admin page following existing patterns: Tabs layout (like Settings.tsx), DataTable with sort/filter, CRUD dialogs |
| `scaffold-dialog` | Generate dialog component following EditSaleDialog/StockMovementDialog patterns with form validation |
| `extract-hook` | Extract repeated useState/useQuery patterns into custom hooks. Priority targets: `useCRUDTable` (sort/filter state repeated 10+ times in Settings.tsx), `useCRUDDialog` (edit/delete dialog state) |
| `add-query-hook` | Generate TanStack Query hook with proper `queryKey`, `queryFn`, cache invalidation via `queryClient.invalidateQueries` |
| `optimize-renders` | Find unnecessary re-renders, add `useMemo`/`useCallback` where needed |
| `split-component` | Break large components into smaller focused ones. Targets: Settings.tsx (2,960 lines → extracted tabs), ProductDetail.tsx (1,949 lines) |
| `add-error-boundary` | Wrap components with proper error boundaries (existing: `ErrorBoundary.tsx`) |

**Operates on:** `client/src/pages/`, `client/src/components/`, `client/src/hooks/`

**Existing hooks this agent extends:**
- `useAuth.ts` — Supabase authentication context
- `useAdminTheme.ts` — admin panel theme management
- `usePOSTheme.ts` — POS interface theme
- `useStorefrontTheme.ts` — storefront theme
- `useAdminLTE.ts` — AdminLTE integration
- `use-toast.ts` — toast notifications
- `use-mobile.tsx` — mobile detection

**Guidelines consumed:**
- `docs/design/design_guidelines.md` — **CRITICAL**: Brand colors (#8A6959, #E8BF9C, #CCA693, #F1F2ED), typography (Inter, Playfair Display, JetBrains Mono), component specs, spacing, three-interface design (Admin/Storefront/POS)
- `replit.md` — nl-BE number formatting, euro currency display (`€ 26,40`), delete confirmation dialog pattern with AlertDialog, action button styling (Edit=yellow, Delete=destructive)

**Codebase-specific patterns this agent enforces:**
- shadcn/ui components with Radix UI primitives
- AdminLTE layout for admin interface
- Wouter for routing (not React Router)
- TanStack Query for server state (`useQuery`, `useMutation`, `queryClient`)
- React Hook Form + Zod for form validation
- Three separate SPAs: Admin, Storefront, POS

---

### 3.3 Express/Node Agent

**Purpose:** Express.js-specific expertise — middleware, routing, error handling, API design. Enforces the 3-layer clean architecture.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Service Scaffolder** | Generate service classes following `roastService.ts` reference pattern | When adding features |
| **Route Extractor** | Move business logic from `routes.ts` to service layer | During refactoring |
| **Error Handler** | Standardize error responses across all endpoints | During code quality sweeps |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `scaffold-service` | Generate a service class following `server/roastService.ts` (294 lines) as reference implementation. Three-layer pattern: Routes (HTTP handling, validation, response) → Services (business logic, transactions, orchestration) → Storage (CRUD, queries) |
| `extract-route-logic` | Move business logic from `routes.ts` (3,769 lines) to a service file. Target: reduce routes.ts to ~1,100 lines of thin HTTP handlers |
| `add-endpoint` | Create RESTful endpoint with: Zod validation, auth middleware, proper error handling, response formatting |
| `add-middleware` | Create Express middleware (auth, validation, logging, rate limiting) |
| `standardize-errors` | Replace 182 generic "Failed to..." error messages with descriptive error responses including error codes, context, and appropriate HTTP status codes |
| `add-validation-middleware` | Create Zod validation middleware for request body/params/query. Replace 22 scattered `.parse()` calls and 13 dynamic `await import()` calls with static top-level imports |

**Operates on:** `server/routes.ts`, `server/*Service.ts` (17 services), `server/storage.ts`, `server/index.ts`, `server/security.ts`

**Existing services this agent extends:**
```
accountingReportService.ts (495 lines)    posService.ts (873 lines)
boerenImportService.ts (762 lines)        productService.ts
checkoutService.ts (643 lines)            roastService.ts (294 lines) ← REFERENCE
countingSessionService.ts (762 lines)     salesAnalyticsService.ts
customerService.ts                        salesService.ts (577 lines)
dashboardService.ts (467 lines)           shippingService.ts
inventoryService.ts                       stockMovementService.ts
invoiceService.ts
parameterService.ts
pdfInvoiceService.ts (507 lines)
```

**Guidelines consumed:**
- `docs/architecture/CLEAN_ARCHITECTURE_SHOWCASE.md` — **CRITICAL**: 3-layer separation rules, refactoring examples
- `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md` — 19 issues with severity and line numbers
- `docs/architecture/ARCHITECTURE_BEFORE_AFTER.md` — before/after code comparisons for refactoring
- `.claude/skills/_shared/references/security-rules.md` — Helmet, CORS, rate limiting, JWT validation, input sanitization
- `.claude/skills/_shared/references/security-rules.md` — JWT-based auth, no CSRF tokens, Supabase auth flow

**Codebase-specific rules this agent enforces:**
1. **No business logic in routes.ts** — only HTTP concerns (validate request, call service, format response)
2. **All transactions in *Service.ts** — never in routes or storage (`db.transaction()` in 15 places across 8 files)
3. **No in-memory filtering in storage.ts** — use SQL WHERE clauses (current: stock movements filtered in JS, 10-100x slower)
4. **Static imports only** — no `await import("@shared/schema")` in route handlers (13 violations)
5. **Descriptive error messages** — not "Failed to fetch X" (182 violations)
6. **Consistent error handling pattern:**
```typescript
// CORRECT (thin route handler)
app.get("/api/products/:id/stats", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid product ID" });
  const stats = await productService.getStatistics(id);
  res.json(stats);
});

// WRONG (business logic in route — 175 try-catch blocks like this)
app.get("/api/products/:id/stats", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // 50+ lines of query construction, calculation, formatting...
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch product stats" });
  }
});
```

---

### 3.4 SQL/Drizzle Agent

**Purpose:** Database-specific expertise — Drizzle ORM, PostgreSQL on Neon, query optimization, migrations, schema design.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Migration Generator** | Create safe schema migrations via Drizzle Kit | When modifying data model |
| **Query Optimizer** | Consolidate N+1 queries, move filtering to SQL | During performance improvement |
| **Schema Validator** | Check FK constraints, indexes, data integrity | Before migrations |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `add-table` | Create Drizzle table definition in `shared/schema.ts` + Zod insert schema via `createInsertSchema()` + generate migration via `drizzle-kit generate` |
| `add-column` | Add column to existing table with migration, update affected Zod schemas and type exports |
| `optimize-query` | Consolidate N+1 queries into single optimized queries. Known targets: product stats (4 queries → 1 with conditional aggregation), customer stats (6 queries → 2), stock calculations (4 sequential → 1 with window functions) |
| `generate-migration` | Run `drizzle-kit generate` and validate output, check for data loss risks |
| `validate-schema` | Check FK constraints, missing indexes on frequently queried columns, relation consistency |
| `profile-query` | Identify slow queries via EXPLAIN ANALYZE, suggest indexes |
| `seed-data` | Generate seed data matching schema constraints (FK references, enum values, decimal precision) |

**Operates on:** `shared/schema.ts` (993 lines, 50+ tables), `db/migrations/` (14 migration files), `server/storage.ts` (2,198 lines), `server/db.ts`, `drizzle.config.ts`

**Guidelines consumed:**
- `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md` — N+1 query issues with specific line numbers
- `docs/architecture/ARCHITECTURE_BEFORE_AFTER.md` — query optimization before/after examples

**Codebase-specific patterns this agent enforces:**
- UUID primary keys: `uuid().defaultRandom().primaryKey()`
- Decimal precision for money: `decimal({ precision: 10, scale: 2 })`
- Timestamps: `timestamp().defaultNow()`
- Soft deletion: `boolean().default(false)` or `timestamp()` for `deletedAt`
- Enum types via `pgEnum()` (e.g., sale channels, payment methods)
- Drizzle relations via `relations()` function
- Zod insert schemas via `createInsertSchema()` from `drizzle-zod`
- Type exports: `InferSelectModel<typeof table>` and `InferInsertModel<typeof table>`
- Neon serverless PostgreSQL connection pooling

---

## 4. Quality & Assurance Tier

### 4.1 Testing Agent

**Purpose:** Generate and run tests, track coverage, identify untested code paths. Currently only 2 test files exist (`security.test.ts`, `currency.test.ts`) — this agent fills the massive testing gap.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Unit Test Writer** | Generate Vitest tests for services with mocked storage | After writing service code |
| **Integration Test Writer** | Generate supertest-based API endpoint tests | After modifying routes |
| **Coverage Analyzer** | Identify untested code paths, suggest test cases | On-demand, before releases |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `generate-service-test` | Create Vitest tests for service files — mock storage layer, test business logic, test transaction behavior. Pattern from roastService.ts |
| `generate-route-test` | Create supertest-based route integration tests — test HTTP status codes, response shapes, auth requirements, validation |
| `generate-component-test` | Create React Testing Library tests for components — render, user interactions, async state |
| `generate-acceptance-tests` | From story acceptance criteria → Vitest test cases that validate each criterion |
| `run-tests` | Execute `npm run test` and parse/report results |
| `check-coverage` | Run `vitest --coverage`, identify untested files and functions |
| `suggest-test-cases` | For a given file, suggest test cases covering happy path, edge cases, error cases |
| `link-tests-to-stories` | Annotate test files with story/use-case IDs for traceability: `// Story: 1.1.1 | UC: UC-001` |

**Operates on:** `server/__tests__/`, `client/src/__tests__/`, `vitest.config.ts`, all source files

**Guidelines consumed:**
- `docs/architecture/CLEAN_ARCHITECTURE_SHOWCASE.md` — testability patterns (services are independently testable)
- `.claude/skills/_shared/references/security-rules.md` — security testing recommendations

**Test structure pattern:**
```typescript
// server/__tests__/[name]Service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { [Name]Service } from '../[name]Service';

describe('[Name]Service', () => {
  let service: [Name]Service;
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = { /* mocked storage methods */ };
    service = new [Name]Service(mockStorage);
  });

  describe('methodName', () => {
    it('should [expected behavior]', async () => { /* ... */ });
    it('should handle [edge case]', async () => { /* ... */ });
    it('should throw when [error condition]', async () => { /* ... */ });
  });
});
```

---

### 4.2 Security Agent

**Purpose:** Audit code for OWASP vulnerabilities, review auth flows, scan dependencies, validate input sanitization. Enforces the security hardening already implemented.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Dependency Auditor** | Run `npm audit`, flag vulnerable packages, suggest upgrades | Before deployments, weekly |
| **Auth Flow Reviewer** | Validate JWT handling, Supabase auth flow, session management | After auth-related changes |
| **Input Validation Scanner** | Check for unsanitized inputs in routes, SQL injection vectors, XSS | During code review |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `scan-sql-injection` | Check for raw SQL strings, unsanitized inputs in Drizzle queries. Drizzle ORM is parameterized by default, but check for `sql.raw()` usage |
| `scan-xss` | Check for `dangerouslySetInnerHTML`, unescaped user content in React components, reflected data in responses |
| `audit-dependencies` | Run `npm audit`, flag CVEs, suggest version upgrades |
| `review-auth-middleware` | Validate JWT validation chain, `requireAuth` middleware usage, Supabase token verification |
| `check-rate-limits` | Verify rate limiting is applied to sensitive endpoints (login, registration, API mutations) |
| `validate-cors-config` | Ensure CORS is properly configured for production domains (Vercel frontend → Cloud Run backend) |
| `check-secrets` | Scan for hardcoded API keys, tokens, passwords, database URLs in source code |
| `review-error-sanitization` | Ensure internal errors (stack traces, DB details) are not leaked to clients |

**Operates on:** `server/security.ts`, `server/index.ts`, `server/routes.ts`, `server/*Service.ts`, `.env.example`, `package.json`

**Guidelines consumed — CRITICAL:**
- `.claude/skills/_shared/references/security-rules.md` — **Primary reference**: 2 critical vulns fixed (PII logging, error sanitization), 4 high-severity fixes (Helmet, CORS, JWT auth, rate limiting), 3 medium-severity fixes (security logging, input validation, error handling)
- `.claude/skills/_shared/references/security-rules.md` — **Must enforce**: JWT-based auth without CSRF tokens, HTTP-only cookies, defense-in-depth layers. **WARNING**: Never re-implement CSRF
- `.claude/skills/_shared/references/security-rules.md` — Supabase auth integration details
- `replit.md` — "secure code patterns are essential and should be included"

**Security checklist this agent validates:**
- [ ] Helmet headers configured (`server/security.ts`)
- [ ] CORS restricted to production domains
- [ ] Rate limiting on auth endpoints
- [ ] JWT validation on all `/api/*` routes
- [ ] No PII in server logs
- [ ] Error messages sanitized (no stack traces to client)
- [ ] Input validation via Zod on all POST/PATCH/PUT
- [ ] No hardcoded secrets in source
- [ ] Dependencies free of known CVEs
- [ ] Content Security Policy headers set

---

### 4.3 Code Quality Agent

**Purpose:** Find code smells, enforce architecture patterns, suggest refactoring. The gatekeeper for clean architecture compliance.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Pattern Enforcer** | Verify code follows the 3-layer architecture rules | During code review, on-demand |
| **Complexity Analyzer** | Measure cyclomatic complexity, find god functions/files | On-demand |
| **Dead Code Finder** | Find unused exports, unreachable code, orphaned files | During cleanup sprints |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `check-architecture` | Verify routes→services→storage separation. Flag: business logic in routes (175 try-catch blocks with logic), transactions outside services, query construction in routes |
| `find-large-files` | Flag files >500 lines. Current offenders: routes.ts (3,769), Settings.tsx (2,960), storage.ts (2,198), ProductDetail.tsx (1,949), Customers.tsx (1,285), Products.tsx (1,212) |
| `find-duplicate-patterns` | Detect repeated patterns: useState/CRUD in Settings.tsx (55 useState, 10+ identical tab patterns), error handling copy-paste, sort/filter logic |
| `check-error-handling` | Find generic "Failed to..." messages (182 instances), missing error context, silent `console.warn` failures |
| `find-dynamic-imports` | Flag dynamic `await import("@shared/schema")` (13 in routes.ts) that should be static top-level imports |
| `check-transaction-placement` | Verify all `db.transaction()` calls are in *Service.ts files, not in routes or storage |
| `measure-complexity` | Cyclomatic complexity per function, flag functions >10 |

**Operates on:** All source files

**Guidelines consumed:**
- `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md` — **Primary reference**: 19 issues (7 HIGH, 8 MEDIUM, 4 LOW) with line numbers
- `docs/architecture/ARCHITECTURAL_ISSUES_BY_LINE.md` — exact line-by-line locations of each issue
- `docs/architecture/ARCHITECTURE_BEFORE_AFTER.md` — correct refactoring patterns with before/after examples
- `docs/architecture/CLEAN_ARCHITECTURE_SHOWCASE.md` — reference implementations for correct patterns
- `docs/architecture/REFACTORING_SUMMARY.md` — refactoring progress tracking

**Rules this agent enforces:**
1. No business logic in `routes.ts` — only HTTP concerns
2. No in-memory filtering in `storage.ts` — use SQL WHERE clauses
3. All `db.transaction()` calls in `*Service.ts` files
4. All schema imports static at top of file (no dynamic `await import()`)
5. No file >1,000 lines without documented justification
6. Error messages must include context (what failed, why, actionable suggestion)
7. Console logging must use structured logger, not raw `console.log` (265 instances)

---

### 4.4 PR Review Agent

**Purpose:** Review code changes holistically before merge. Delegates to specialized agents and synthesizes findings.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| Delegates to | Security Agent, Testing Agent, Code Quality Agent, TypeScript Agent | On every PR review |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `review-diff` | Analyze git diff for: anti-patterns, missed edge cases, security issues, architecture violations, type errors |
| `check-breaking-changes` | Detect: schema changes without migrations, API endpoint changes (signature, response shape), removed exports |
| `suggest-tests` | Recommend test cases that should accompany this PR based on changed files |
| `validate-commit-messages` | Enforce conventional commit format |
| `check-migration-safety` | Verify migrations are: reversible, data-safe, backward-compatible, tested |
| `generate-review-report` | Produce review summary in `docs/reviews/PR-NNN-review.md` |

**Operates on:** Git diff / staged changes, `docs/reviews/`

**Review checklist this agent applies:**
- [ ] Architecture: changes follow 3-layer pattern?
- [ ] Types: no new `any` types, proper generics?
- [ ] Security: input validated, auth checked, no secrets?
- [ ] Tests: adequate test coverage for changes?
- [ ] Performance: no N+1 queries, no in-memory filtering?
- [ ] Error handling: descriptive messages, proper HTTP codes?
- [ ] UI: follows design_guidelines.md (colors, typography, spacing)?
- [ ] Migration: safe, reversible, tested?
- [ ] Docs: use case / spec updated if behavior changed?

---

## 5. Infrastructure Tier

### 5.1 Documentation Agent

**Purpose:** Generate and maintain technical documentation, API docs, and architecture decision records. Keeps docs in sync with code.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **API Doc Generator** | Scan routes and produce endpoint documentation | After route changes |
| **ADR Writer** | Document significant architecture decisions | When making tech decisions |
| **Code Commenter** | Generate JSDoc for public service methods | After service creation |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `generate-api-docs` | Scan `server/routes.ts` → produce endpoint documentation in `docs/api/endpoints.md` with HTTP method, path, auth requirements, request/response shapes |
| `generate-adr` | Create Architecture Decision Record in `docs/architecture/` following the pattern established by `ARCHITECTURE_DECISION_JWT_AUTH.md` |
| `document-service` | Generate JSDoc comments for a service file's public methods |
| `document-schema` | Generate data dictionary from `shared/schema.ts` — table names, columns, types, relations, constraints |
| `changelog` | Generate changelog from git commits between tags/dates |
| `update-readme` | Keep top-level README in sync with current features, setup instructions, deployment |
| `sync-docs` | Check for stale documentation — files moved, APIs changed, features removed |

**Operates on:** `docs/api/`, `docs/architecture/`, `docs/guides/`, `server/routes.ts`, `server/*Service.ts`, `shared/schema.ts`

**Guidelines consumed:**
- All `docs/` subdirectories — must understand existing documentation style and format
- Existing ADR format from `.claude/skills/_shared/references/security-rules.md`

---

### 5.2 DevOps / Deploy Agent

**Purpose:** Manage Docker builds, Vercel/Cloud Run deployment, CI/CD pipeline, environment configuration.

**Sub-agents:**

| Sub-Agent | Purpose | Trigger |
|-----------|---------|---------|
| **Docker Builder** | Optimize Dockerfile, validate builds | Before deployment |
| **Deploy Validator** | Pre-flight checks before deploy | Before deployment |
| **CI Pipeline Builder** | Generate GitHub Actions workflows | Initial setup, when adding checks |

**Skills:**

| Skill | What It Does |
|-------|-------------|
| `validate-dockerfile` | Lint Dockerfile, check multi-stage build optimization, verify production dependencies |
| `check-env-vars` | Compare `.env.example` vs deployed config, flag missing variables |
| `build-check` | Run `npm run build` and validate output (ESBuild for server, Vite for client) |
| `setup-github-actions` | Generate CI/CD pipeline: lint → type-check → test → build → deploy. Currently no CI/CD exists |
| `deploy-preview` | Trigger preview deployment to staging |
| `verify-vercel-config` | Validate `vercel.json` settings for frontend deployment |
| `check-cloud-run` | Validate Cloud Run deployment configuration (Docker, memory, CPU, scaling) |

**Operates on:** `Dockerfile`, `vercel.json`, `.env.example`, `package.json`, `.github/workflows/`

**Guidelines consumed:**
- `replit.md` — build and development stack details (Vite, ESBuild, monorepo structure)
- `.claude/skills/_shared/references/security-rules.md` — environment variable requirements, deployment security

**CI/CD pipeline this agent creates:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    steps:
      - TypeScript: tsc --noEmit
      - Tests: vitest run
      - Build: npm run build
      - Security: npm audit
  deploy:
    needs: check
    if: github.ref == 'refs/heads/main'
    steps:
      - Frontend: Vercel deploy
      - Backend: Cloud Run deploy
```

---

## 6. Shared Skills (Cross-Cutting)

Skills used by multiple agents:

| Skill | Used By | What It Does |
|-------|---------|-------------|
| `read-use-cases` | All agents | Load relevant use case context from `docs/use-cases/` |
| `read-architecture-docs` | Express, Code Quality, Spec | Load `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md` for known issues |
| `read-design-guidelines` | React, PR Review | Load `docs/design/design_guidelines.md` for UI rules |
| `read-security-guidelines` | Express, Security, PR Review | Load `.claude/skills/_shared/references/security-rules.md` for security rules |
| `read-reference-service` | Express, Testing | Load `server/roastService.ts` as 3-layer pattern reference |
| `run-build` | DevOps, PR Review | Execute `npm run build` and report errors |
| `run-tests` | Testing, PR Review | Execute `npm run test` and report results |
| `lint-typescript` | TypeScript, PR Review | Run `tsc --noEmit` for type errors |
| `check-imports` | Code Quality, TypeScript | Verify no circular dependencies |
| `read-backlog` | Requirements, Spec, Testing | Load `docs/product/BACKLOG.md` for story context |

---

## 7. End-to-End Workflow

How agents chain together from idea to deployment:

```
1. User describes a need or feature request
   │
   ▼
2. ANALYST AGENT
   ├─ create-use-case → docs/use-cases/UC-NNN.md
   ├─ map-domain-model (if new entities)
   └─ trace-use-case-to-code (if modifying existing)
   │
   ▼
3. REQUIREMENTS AGENT
   ├─ slice-use-case → user stories
   ├─ update-backlog → docs/product/BACKLOG.md
   └─ prioritize (MoSCoW/WSJF)
   │
   ▼
4. SPEC AGENT
   ├─ generate-spec → docs/specs/SPEC-NNN.md
   ├─ impact-analysis (affected files)
   └─ dependency-check
   │
   ▼
5. IMPLEMENTATION AGENTS (parallel where possible)
   ├─ SQL/Drizzle Agent: add-table, generate-migration
   ├─ TypeScript Agent: generate-zod-schema, fix-type-errors
   ├─ Express Agent: scaffold-service, add-endpoint
   └─ React Agent: scaffold-admin-page, add-query-hook
   │
   ▼
6. TESTING AGENT
   ├─ generate-acceptance-tests (from spec criteria)
   ├─ generate-service-test, generate-route-test
   ├─ run-tests
   └─ link-tests-to-stories
   │
   ▼
7. QUALITY GATES (parallel)
   ├─ Code Quality Agent: check-architecture, find-large-files
   ├─ Security Agent: scan-sql-injection, audit-dependencies
   └─ TypeScript Agent: check-strict-mode
   │
   ▼
8. PR REVIEW AGENT
   ├─ review-diff
   ├─ suggest-tests
   ├─ check-breaking-changes
   └─ generate-review-report → docs/reviews/
   │
   ▼
9. DOCUMENTATION AGENT
   ├─ generate-api-docs (if endpoints changed)
   ├─ document-service (if new service)
   └─ sync-docs
   │
   ▼
10. DEVOPS AGENT
    ├─ build-check
    ├─ check-env-vars
    └─ deploy
```

---

## 8. Implementation Priority

### Phase 1 — Analysis Foundation
| # | Agent | Rationale |
|---|-------|-----------|
| 1 | Analyst Agent | Establish use cases as the permanent source of truth |
| 2 | Requirements Agent | Enable spec-driven development workflow |
| 3 | Spec Agent | Bridge analysis to implementation with traceability |

### Phase 2 — Language Agents (biggest dev velocity impact)
| # | Agent | Rationale |
|---|-------|-----------|
| 4 | TypeScript Agent | Type safety across the full stack |
| 5 | Express/Node Agent | Clean up routes.ts (3,769→~1,100 lines), enforce 3-layer architecture |
| 6 | React Agent | Frontend component patterns, extract hooks from 2,960-line Settings.tsx |
| 7 | SQL/Drizzle Agent | Query optimization (3-4x performance improvement), safe migrations |

### Phase 3 — Quality Gates
| # | Agent | Rationale |
|---|-------|-----------|
| 8 | Testing Agent | Fill massive test gap (2 → comprehensive) |
| 9 | Code Quality Agent | Enforce clean architecture, catch anti-patterns |
| 10 | Security Agent | Automated vulnerability scanning |
| 11 | PR Review Agent | Pre-merge validation, holistic review |

### Phase 4 — Infrastructure & Documentation
| # | Agent | Rationale |
|---|-------|-----------|
| 12 | Documentation Agent | Keep docs in sync with code |
| 13 | DevOps Agent | CI/CD pipeline (currently none), deployment automation |

---

## 9. Agent Summary Table

| # | Agent | Tier | Sub-Agents | Skills | Primary Output |
|---|-------|------|-----------|--------|----------------|
| 1 | Analyst | Analysis | 3 | 6 | `docs/use-cases/` |
| 2 | Requirements | Analysis | 3 | 6 | `docs/product/BACKLOG.md` |
| 3 | Spec | Analysis | 2 | 4 | `docs/specs/` |
| 4 | TypeScript | Implementation | 2 | 6 | Type-safe `.ts`/`.tsx` files |
| 5 | React | Implementation | 3 | 7 | Components, hooks, pages |
| 6 | Express/Node | Implementation | 3 | 6 | Services, routes, middleware |
| 7 | SQL/Drizzle | Implementation | 3 | 7 | Schema, migrations, queries |
| 8 | Testing | Quality | 3 | 8 | Test files, coverage reports |
| 9 | Security | Quality | 3 | 8 | Security audit reports |
| 10 | Code Quality | Quality | 3 | 7 | Code quality reports |
| 11 | PR Review | Quality | delegates | 6 | `docs/reviews/` |
| 12 | Documentation | Infrastructure | 3 | 7 | `docs/api/`, `docs/architecture/` |
| 13 | DevOps | Infrastructure | 3 | 7 | CI/CD, deployment |
| **Total** | | **4 tiers** | **34** | **85** | |
