---
name: generate-spec
description: Generate a technical specification from a user story or feature description. Produces a file-level implementation plan.
user-invocable: true
argument-hint: "[story-id or feature description]"
allowed-tools: Read, Grep, Glob, Write, Edit
agent: spec
---

Generate a technical specification for `$ARGUMENTS`.

---

## Step 0 — Read Shared References
Read the following before starting:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/security-rules.md`
- `.claude/skills/_shared/references/documentation-structure.md`

## Step 1 — Research the Feature

1. If `$ARGUMENTS` is a story ID, find the story file in `docs/product/backlog/epic-N-*/`
2. If `$ARGUMENTS` is a description, treat it as a feature request
3. Search for the related use case in `docs/use-cases/`
4. Read relevant codebase files to understand current state:
   - `shared/schema.ts` — existing tables and Zod schemas
   - `server/routes.ts` — existing endpoints
   - `server/roastService.ts` — reference service pattern
5. Check `docs/specs/` for existing specs that might overlap or relate

## Step 2 — Clarification Phase

**Before writing any spec**, gather the information below. Skip questions already clearly answered. Ask all missing questions at once.

### Mandatory — cannot write without these

1. **New vs. existing**: Is this extending an existing page/feature, or building something entirely new?
2. **User roles**: Which roles need access to this feature? (Admin only, Cashier, Customer, Public, combination?)
3. **Out of scope**: What is explicitly NOT included in this spec? (Prevents scope creep — e.g., "no reporting in this spec", "mobile app excluded")

### Enrichment — ask if not clear from context

4. **Existing patterns to follow**: Are there specific files or patterns beyond `roastService.ts` that this should mirror?
5. **Performance requirements**: Any constraints on scale or speed?
6. **External integrations**: Does this require calling an external service? (email via Resend, payment via Mollie, Supabase Storage, accounting export)
7. **Data migration**: Does this change existing data or schema in a way that requires a migration strategy for existing records?
8. **Edge cases from acceptance criteria**: Are there any acceptance criteria from the story that are ambiguous and need a design decision?

## Step 3 — Confirm File Plan

After gathering answers, list the **files you plan to create or modify** with a one-line description of each change. Get confirmation before writing the full spec.

Example:
> "Here's what I plan to touch:
> - `shared/schema.ts` — add `discounts` table with percentage and scope columns
> - `server/storage.ts` — add `createDiscount()`, `getDiscountByCode()` methods
> - `server/discountService.ts` — new service with `applyDiscount()` business logic
> - `server/routes.ts` — add POST `/api/discounts` and GET `/api/discounts/:code`
> - `client/src/pages/pos/Checkout.tsx` — add discount code input field
> - `client/src/components/DiscountBadge.tsx` — new component to show applied discount
>
> Does this scope look right before I write the full spec?"

Only write the full spec after the user confirms the file plan.

## Step 4 — Write the Spec Document

Create `docs/specs/SPEC-NNN-short-name.md` following the template below.

---

## Spec Template

```markdown
# SPEC-NNN: [Title]

## References
- **Story:** [Story ID and file path from docs/product/backlog/]
- **Use Case:** [UC-NNN]

## Scope
[What this spec covers and what it explicitly does NOT cover]

## Schema Changes
- [ ] New tables / columns in shared/schema.ts
- [ ] Migration file via drizzle-kit generate
- [ ] Updated Zod insert schemas

## Backend Changes
- [ ] Storage methods in server/storage.ts
- [ ] Service file: server/[name]Service.ts (follow roastService.ts pattern)
- [ ] Route handlers in server/routes.ts (thin HTTP layer only)
- [ ] Validation: Zod schemas for request body/params

## Frontend Changes
- [ ] Components in client/src/components/
- [ ] Pages in client/src/pages/admin/ (or /pos/ or /storefront/)
- [ ] Hooks in client/src/hooks/
- [ ] Design: follows design_guidelines.md [specific guidelines]

## Security Considerations
- [ ] Auth required? Which roles?
- [ ] Input validation (Zod)
- [ ] Rate limiting needed?

## Test Plan (TDD — tests are written BEFORE implementation)

### Acceptance Criteria → Test Cases
For each acceptance criterion from the story, define the concrete test case(s) that will verify it.

| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| [Criterion 1] | service / route / component | [What the test asserts] | [test file path] |
| [Criterion 2] | service / route / component | [What the test asserts] | [test file path] |

### Service Tests (Vitest, mock storage)
- [ ] [Test case: happy path for method X]
- [ ] [Test case: edge case for method X]
- [ ] [Test case: error path for method X]

### Route Tests (supertest)
- [ ] [Test case: 401 without auth]
- [ ] [Test case: 400 with invalid input]
- [ ] [Test case: 200 with valid request]

### Component Tests (React Testing Library)
- [ ] [Test case: renders with required props]
- [ ] [Test case: user interaction triggers expected behavior]

### Implementation Order
1. Write failing tests from this test plan
2. Implement code to make tests pass
3. Refactor while keeping tests green
```

---

## Writing Rules (MANDATORY)

### Rule 1: Follow the 3-Layer Architecture
Every spec MUST respect the separation: Routes (HTTP only) -> Services (business logic, transactions) -> Storage (CRUD, queries). Never spec business logic in routes or transactions in storage.

### Rule 2: Reference Implementation
`server/roastService.ts` is the reference. New services MUST follow this pattern. Point to it explicitly in the spec.

### Rule 3: Schema Changes Must Be Complete
If the spec adds or modifies tables in `shared/schema.ts`, it MUST also specify:
- The Drizzle table definition (column names, types, constraints)
- The Zod insert schema via `createInsertSchema()`
- The migration command (`npx drizzle-kit generate`)

### Rule 4: Security Is Not Optional
Every spec MUST include a Security Considerations section. At minimum: which roles have access, what input validation is needed (Zod on all POST/PATCH/PUT), and whether rate limiting applies.

### Rule 5: Be Specific About Files
Do not write vague specs like "add a component for X". Name the exact file path, the exact function/method name, and what it does. The spec is the implementation plan — a developer should be able to code directly from it.

### Rule 6: Test-Driven Development — Test Plan Is Mandatory
Every acceptance criterion from the story MUST have a corresponding test case in the Test Plan. The Test Plan defines:
- The exact test file path
- The test description (what it asserts)
- The test type (service / route / component)
- The acceptance criterion it validates

Tests are written BEFORE implementation code. The spec's Test Plan is the contract — implementation is done when all tests pass.

### Rule 7: Coding Standards
Specs must respect project coding standards:
- Number formatting: nl-BE locale (comma as decimal separator)
- Currency: Euro symbol with space: `€ 26,40`
- UI buttons: Edit = yellow background, Delete = destructive variant
- Delete confirmations: Always use shadcn AlertDialog with AlertTriangle icon
- TypeScript: No `any` types
- Error messages: Descriptive with context

---

## Step 5 — Quality Checklist

Before saving, verify ALL of the following:

- [ ] **References** link to correct Story ID and UC-NNN
- [ ] **Scope** section clearly states what is and is not included
- [ ] **3-layer architecture** respected — no business logic in routes, no transactions in storage
- [ ] **Every file** to create or modify is listed with its exact path
- [ ] **Schema changes** include table definition, Zod schema, and migration step
- [ ] **Security section** is complete (roles, validation, rate limiting)
- [ ] **Test Plan** covers every acceptance criterion with concrete test cases, file paths, and test types
- [ ] **Test Plan** specifies implementation order: tests first, then code
- [ ] **No `any` types** specified — proper TypeScript types throughout
- [ ] **Design guidelines** referenced where frontend changes are specified
- [ ] **Existing patterns** followed — spec references `roastService.ts` or other relevant examples

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
