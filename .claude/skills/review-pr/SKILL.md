---
name: review-pr
description: Review current changes or a PR for architecture, security, tests, and quality. Use before merging.
user-invocable: true
argument-hint: "[PR-number or 'staged' for current changes]"
allowed-tools: Read, Grep, Glob, Bash
agent: pr-review
---

Review the changes specified by `$ARGUMENTS`.

## Step 0 — Read Shared References
Read the following before starting:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/security-rules.md`

## Step 1 — Get the Diff

- If `$ARGUMENTS` is a PR number, use `gh pr diff $ARGUMENTS` to get the diff
- If `$ARGUMENTS` is "staged" or empty, use `git diff --staged` and `git diff` for current changes

## Step 2 — Apply Full Review Checklist

### Architecture
- [ ] Changes follow 3-layer pattern (routes -> services -> storage)?
- [ ] No business logic added to routes.ts?
- [ ] Transactions in services only?
- [ ] No dynamic imports in route handlers?
- [ ] Reference: `docs/architecture/CLEAN_ARCHITECTURE_SHOWCASE.md`

### TypeScript
- [ ] No new `any` types?
- [ ] Proper generics and utility types?
- [ ] Drizzle types used correctly (`InferSelectModel`, `InferInsertModel`)?

### Security
- [ ] Input validated with Zod on all POST/PATCH/PUT?
- [ ] Auth middleware on new endpoints (`requireAuth` / `isAdmin`)?
- [ ] No hardcoded secrets?
- [ ] No PII in logs?
- [ ] No CSRF tokens added (JWT auth handles this)?
- [ ] Reference: `.claude/skills/_shared/references/security-rules.md`

### Tests
- [ ] New code has test coverage?
- [ ] Existing tests still pass?
- [ ] Acceptance criteria validated?

### Performance
- [ ] No N+1 queries introduced?
- [ ] No in-memory filtering where SQL would work?
- [ ] No unnecessary re-renders (React)?

### Error Handling
- [ ] Descriptive error messages (not "Failed to X")?
- [ ] Proper HTTP status codes?
- [ ] Errors don't expose internals (stack traces, DB details)?

### UI (if frontend changes)
- [ ] Follows design_guidelines.md (KRUZE brand colors, typography, spacing)?
- [ ] nl-BE number formatting, `€ 26,40` currency display?
- [ ] Delete confirmations use AlertDialog with AlertTriangle icon?
- [ ] Edit buttons = yellow, Delete = destructive variant?
- [ ] Reference: `docs/design/design_guidelines.md`

### Database (if schema changes)
- [ ] Migration generated (`npx drizzle-kit generate`) and reviewed?
- [ ] Migration is reversible and data-safe?
- [ ] Indexes on frequently queried columns?

### Documentation
- [ ] Use case updated if behavior changed?
- [ ] API docs updated if endpoints changed?

## Step 4 — Check for Breaking Changes

- Schema changes without migrations?
- API changes (different parameters, different response shape)?
- Removed exports that other files depend on?
- Changed behavior of existing public methods?

## Step 5 — Suggest Missing Tests

For each changed file without test coverage, recommend specific test cases.

## Output Format

```
## PR Review: [branch name]

### Summary
[1-2 sentence summary of changes]

### Verdict: [APPROVE | REQUEST CHANGES | NEEDS DISCUSSION]

### Findings

#### Critical (must fix)
- [file:line] Description

#### Warnings (should fix)
- [file:line] Description

#### Suggestions (consider)
- [file:line] Description

### Missing Tests
- [test case description]

### Checklist Results
- [x] Architecture compliance
- [x] TypeScript types
- [ ] Missing: input validation on new endpoint
- [x] Security
- [x] Performance
```

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
