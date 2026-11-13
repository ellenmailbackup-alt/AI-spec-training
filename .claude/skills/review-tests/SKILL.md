---
name: review-tests
description: Review test cases for coverage, quality, and alignment with spec's Test Plan and acceptance criteria. Use after writing tests or before merging.
user-invocable: true
argument-hint: "[SPEC-NNN, Story ID, or file path]"
allowed-tools: Read, Grep, Glob
agent: review
---

Review test cases specified by `$ARGUMENTS` for quality and coverage.

---

## Step 0 — Read References
Read the following before starting:
- `.claude/skills/generate-tests/references/test-patterns.md`
- `.claude/skills/generate-tests/references/mock-patterns.md`
- `.claude/skills/_shared/references/architecture-rules.md`

## Step 1 — Gather Context

- If `$ARGUMENTS` is a SPEC-NNN: read the spec's **Test Plan** section from `docs/specs/`
- If `$ARGUMENTS` is a Story ID: find the story file in `docs/product/backlog/epic-N-*/`, then find its spec
- If `$ARGUMENTS` is a file path: read the test file directly
- Read the related acceptance criteria from the story
- Read the source code being tested

## Step 2 — Check Coverage Against Spec Test Plan

For each test case in the spec's Test Plan:
- [ ] Is there a corresponding test in the test file?
- [ ] Does the test assert the right behavior (not just that it doesn't crash)?
- [ ] Are both happy path and error path covered?

Flag any acceptance criteria that have **no corresponding test**.

## Step 3 — Check Test Quality

### Structure
- [ ] Tests are organized by describe/it blocks matching the service/route/component structure
- [ ] Each test has a clear, descriptive name that states expected behavior
- [ ] Tests are independent — no shared mutable state between tests
- [ ] `beforeEach` properly resets state

### Assertions
- [ ] Tests assert specific values, not just truthiness (`toBe(200)` not `toBeTruthy()`)
- [ ] Error paths assert specific error messages or codes
- [ ] Response shape is validated (not just status code)

### Mocking
- [ ] Only external dependencies are mocked (DB, external services) — not the code under test
- [ ] Mocks follow project patterns (vi.hoisted, vi.mock)
- [ ] No over-mocking — if everything is mocked, the test proves nothing

### Anti-Patterns to Flag
- **Testing implementation, not behavior** — test asserts internal method was called rather than observable output
- **Snapshot-only tests** — snapshot tests without behavioral assertions
- **Always-passing tests** — assertions that can never fail (e.g., `expect(true).toBe(true)`)
- **Missing error path tests** — only happy path tested
- **Coupled tests** — test B depends on test A running first
- **Mocking the subject** — mocking the very thing being tested

## Step 4 — Check TDD Compliance

- [ ] Test files exist at the paths specified in the spec's Test Plan
- [ ] Tests cover all acceptance criteria (mapped via comments or describe blocks)
- [ ] Traceability comments present: `// Story: X.Y.Z | UC: UC-NNN`

## Step 5 — Check Architecture Compliance

- [ ] Service tests mock storage/DB, not business logic
- [ ] Route tests use supertest and check auth (401), validation (400), success (200)
- [ ] Component tests use React Testing Library (not enzyme)
- [ ] No business logic tested through route tests (that belongs in service tests)

## Step 6 — Produce Review Report

Use the template from `.claude/skills/review-tests/templates/test-review-report.md`.

**Severity levels:**
- **Critical** — Missing acceptance criteria coverage, always-passing tests, testing the mock instead of the code
- **Warning** — Missing error paths, weak assertions, over-mocking
- **Suggestion** — Better naming, additional edge cases, structural improvements

For every issue flagged, provide a **concrete fix** — not just "add error tests", but the specific test case to add.

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
