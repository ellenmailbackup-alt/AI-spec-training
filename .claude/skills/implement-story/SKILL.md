---
name: implement-story
description: Implement an already-specced story directly from its spec. Use when the user references a Story ID, SPEC-NNN, or UC-NNN.
user-invocable: true
argument-hint: "[Story ID, SPEC-NNN, or UC-NNN]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, Agent
agent: general-purpose
---

Implement the already-documented work specified by `$ARGUMENTS`.

---

## Recognition

This skill handles: user references a Story ID (e.g., "Story 3.2.1"), SPEC-NNN, or UC-NNN explicitly.

## Procedure

### Step 0 — Read Shared References
Read the following before starting:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/security-rules.md`
- `.claude/skills/_shared/references/documentation-structure.md`
- `.claude/skills/_shared/references/available-mcps.md`

### Step 1 — Find the Spec

Based on `$ARGUMENTS`:
- If a Story ID → find the story file in `docs/product/backlog/epic-N-*/`, then find its SPEC-NNN
- If a SPEC-NNN → read `docs/specs/SPEC-NNN*.md` directly
- If a UC-NNN → read `docs/use-cases/UC-NNN*.md`, check for linked specs

Skip ideation — the docs exist.

### Step 3 — Write Failing Tests (TDD — Tests First)

Read the spec's **Test Plan** section. Write all test files defined there:
1. Create test files at the exact paths specified in the Test Plan
2. Write test cases that match the spec's test descriptions
3. Each test should assert the expected behavior — and **fail** because the code doesn't exist yet
4. Run `npm run test` to confirm tests fail as expected (red phase)

→ **STOP.** Confirm to the user: "Tests written and failing as expected. Starting implementation."

### Step 4 — Implement to Pass Tests (Green Phase)

Now implement the production code from the spec:
1. Follow the spec's file plan (schema → storage → service → routes → frontend)
2. After each layer, run `npm run test` to see tests progressively turn green
3. Continue until all tests pass

### Step 5 — Refactor (Refactor Phase)

With all tests green:
1. Review the implementation for code quality, duplication, naming
2. Refactor while keeping tests green
3. Run `npm run test` one final time to confirm everything passes

### Step 6 — Verify Coverage

Delegate to the **testing agent** via `/generate-tests` to check for gaps:
- Are there acceptance criteria without test coverage?
- Are there edge cases the spec's Test Plan missed?
- Add any missing tests

### Step 7 — Post-Implementation

After completing implementation, propose (don't force):
- `/security-audit` — if new endpoints or auth were added
- `/review-pr` — before creating a PR
