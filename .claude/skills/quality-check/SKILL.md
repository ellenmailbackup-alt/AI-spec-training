---
name: quality-check
description: Run a code quality check on the codebase. Finds architecture violations, large files, duplicate patterns, generic errors.
user-invocable: true
argument-hint: "[file-path or 'full' for complete check]"
allowed-tools: Read, Grep, Glob, Bash
agent: code-quality
---

Run a code quality check on `$ARGUMENTS` (or full codebase if "full" or no args).

## Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/security-rules.md`

## Rules to Enforce

1. **No business logic in routes.ts** — only HTTP concerns (validate, auth, call service, respond)
2. **No in-memory filtering in storage.ts** — use SQL WHERE clauses
3. **All `db.transaction()` in *Service.ts** — never in routes or storage
4. **Static imports only** — no `await import("@shared/schema")` in handlers
5. **No file >1,000 lines** without documented justification
6. **Descriptive error messages** — not generic "Failed to X"
7. **No raw `console.log`** — use structured logging

## Known Offenders

These files have the highest concentration of violations — always check them:

| File | Lines | Key Issues |
|------|-------|------------|
| `server/routes.ts` | ~3,769 | 175 try-catch with logic, 182 generic errors, 13 dynamic imports |
| `server/storage.ts` | ~2,198 | N+1 queries, in-memory filtering |
| `client/src/pages/admin/Settings.tsx` | ~2,960 | 55 useState, 10+ duplicated CRUD patterns |
| `client/src/pages/admin/ProductDetail.tsx` | ~1,949 | God component, needs splitting |
| `client/src/pages/admin/Customers.tsx` | ~1,285 | Large file, mixed concerns |

## Step-by-Step Procedure

### Step 1: Read architecture docs
Read `docs/architecture/ARCHITECTURAL_ISSUES_SUMMARY.md` for known issues and severity ratings.

### Step 2: Check architecture violations
- Search `server/routes.ts` for `db.transaction`, `db.select`, `db.insert`, `db.update`, `db.delete` — business logic leaking into routes.
- Search `server/storage.ts` for `.filter(`, `.map(`, `.reduce(` on query results — in-memory filtering.
- Verify all `db.transaction()` calls live in `*Service.ts` files.

### Step 3: Find large files
Use `wc -l` to find all `.ts` and `.tsx` files exceeding 500 lines. Sort by size descending.

### Step 4: Find dynamic imports
Grep for `await import(` and `import(` inside route handlers and non-top-level code.

### Step 5: Check error handling
- Grep for `"Failed to ` — generic error messages lacking context.
- Grep for `catch (error)` blocks that swallow errors or return generic messages.

### Step 6: Find duplicate patterns
- In `Settings.tsx`: repeated useState/useQuery/useMutation/CRUD patterns.
- Across route handlers: repeated try-catch, validation, and response patterns.

### Step 7: Check transaction placement
Grep for `db.transaction` across the codebase. Flag any occurrence outside `*Service.ts` files.

### Step 8: Measure complexity
Identify functions with deeply nested if/else, switch statements, or long method bodies (>50 lines).

## Output Format

```
## Code Quality Report

### Architecture Violations
- [file:line] Description of violation (which rule it breaks)

### Large Files (>500 lines)
| File | Lines | Issue |
|------|-------|-------|
| path/to/file.ts | 1234 | Description |

### Dynamic Imports
- [file:line] `await import("...")` — should be static top-level import

### Error Handling Issues
- [file:line] Generic error message: "Failed to X" — needs entity/operation context

### Duplicate Patterns
- [pattern] Found in [N] locations: [file1, file2, ...]

### Transaction Placement
- [file:line] `db.transaction()` found outside *Service.ts

### Recommendations
1. **[HIGH]** Action to take — expected impact
2. **[MEDIUM]** Action to take — expected impact
3. **[LOW]** Action to take — expected impact
```

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
