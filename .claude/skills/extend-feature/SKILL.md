---
name: extend-feature
description: Extend an existing feature — find its docs, update use case/stories/spec, then implement. Use when modifying or adding to something that already exists.
user-invocable: true
argument-hint: "[feature name and change description]"
allowed-tools: Read, Grep, Glob, Write, Edit, Agent
---

Extend an existing feature based on `$ARGUMENTS`.

---

## Recognition

This skill handles: "update X to also...", "change how X works", "add Y to the existing X..."

## Procedure

### Step 0 — Read Shared References
Read the following before starting:
- `.claude/skills/_shared/references/documentation-structure.md`

### Step 1 — Find Existing Documentation

Search for the existing UC and SPEC for the feature in:
- `docs/use-cases/` — find the UC-NNN
- `docs/specs/` — find the SPEC-NNN
- `docs/product/backlog/` — find related stories in epic folders

If no existing documentation is found, switch to `/new-feature` instead.

### Step 2 — Update Use Case

If the behavior changes meaningfully, delegate to the **analyst agent** to update the existing use case.

→ **STOP.** Present the changes to the user for approval.

### Step 2b — Use Case Review (Review Agent)

Delegate to the **review agent** via `/review-use-case UC-NNN`.

→ **STOP.** Present the review findings to the user.
- If verdict is **PASS**: proceed to Step 3.
- If verdict is **NEEDS REVISION** or **MAJOR REWRITE**: delegate back to the analyst agent to address the findings, then re-review.
→ Do not proceed until the review passes or the user explicitly overrides.

### Step 3 — Update Stories

Add new stories or update existing ones in the backlog via the **requirements agent**.

→ **STOP.** Present the story changes for approval.

### Step 3b — Story Review (Review Agent)

Delegate to the **review agent** via `/review-stories UC-NNN`.

→ **STOP.** Present the review findings to the user.
- If verdict is **PASS**: proceed to Step 4.
- If verdict is **NEEDS REVISION**: delegate back to the requirements agent to address the findings, then re-review.
→ Do not proceed until the review passes or the user explicitly overrides.

### Step 4 — Update or Create Spec

Update the existing spec or create a new one via `/generate-spec`.

→ **STOP.** Present the spec for approval.

### Step 5 — TDD Implementation

Follow the TDD cycle from the spec's Test Plan:

1. **Red** — Write failing tests from the spec's Test Plan
2. **Green** — Implement code to make tests pass
3. **Refactor** — Clean up while keeping tests green
4. **Verify coverage** — delegate to `/generate-tests` to check for gaps

### Step 6 — Post-Implementation

After completing implementation, propose (don't force):
- `/security-audit` — if new endpoints or auth were added
- `/review-pr` — before creating a PR
