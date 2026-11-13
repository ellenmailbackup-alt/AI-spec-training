---
name: new-feature
description: Orchestrate the full pipeline for a new feature — from use case through stories, spec, and implementation. Use when the user wants something the system doesn't have yet.
user-invocable: true
argument-hint: "[feature description]"
allowed-tools: Read, Grep, Glob, Write, Edit, Agent
---

Orchestrate the full feature development pipeline for `$ARGUMENTS`.

---

## Recognition

This skill handles: "I want...", "we need...", "add...", "build...", "can we have...", any capability the system doesn't yet have.

## Mandatory Sequence

**Do not skip or reorder. Each step requires explicit user confirmation before the next begins.**

**Documentation is non-negotiable.** If the user says "skip the docs / just build it", explain why docs come first and redirect to the clarification phase. There is no override.

**Scope is always a user decision.** Never silently mark anything as in or out of scope. Always surface scope boundaries as explicit questions before writing any documentation.

---

### Step 0 — Read Shared References
Read the following before starting:
- `.claude/skills/_shared/references/documentation-structure.md`
- `.claude/skills/_shared/references/use-case-30-principles.md`

### Step 1 — Search for Existing Work

Search `docs/use-cases/` and `docs/specs/` for related existing work. If this feature is already partially documented, switch to `/extend-feature` instead.

### Step 2 — Use Case (Analyst Agent)

Delegate to the **analyst agent** via `/create-use-case $ARGUMENTS`.

→ **STOP.** Present the document path and a brief summary to the user.
Ask: "Does this use case capture it correctly? Any changes before we review it?"
→ Do not proceed until the user explicitly approves.

### Step 2b — Use Case Review (Review Agent)

Delegate to the **review agent** via `/review-use-case UC-NNN`.

→ **STOP.** Present the review findings to the user.
- If verdict is **PASS**: proceed to Step 3.
- If verdict is **NEEDS REVISION** or **MAJOR REWRITE**: delegate back to the analyst agent to address the findings, then re-review.
→ Do not proceed until the review passes or the user explicitly overrides.

### Step 3 — User Stories (Requirements Agent)

Delegate to the **requirements agent** via `/slice-stories UC-NNN`.

→ **STOP.** Show the story titles and acceptance criteria.
Ask: "Do these stories look right? Any additions, splits, or changes?"
→ Do not proceed until the user explicitly approves.

### Step 3b — Story Review (Review Agent)

Delegate to the **review agent** via `/review-stories UC-NNN`.

→ **STOP.** Present the review findings to the user.
- If verdict is **PASS**: proceed to Step 4.
- If verdict is **NEEDS REVISION**: delegate back to the requirements agent to address the findings, then re-review.
→ Do not proceed until the review passes or the user explicitly overrides.

### Step 4 — Technical Spec (Spec Agent)

Delegate to the **spec agent** via `/generate-spec [story-ids]`.

→ **STOP.** Show the file plan and document path.
Ask: "Does this spec match your expectations? Ready to start implementation?"
→ Do not proceed until the user explicitly approves.

### Step 5 — TDD Implementation

Only after spec is confirmed. Follow the TDD cycle from the spec's Test Plan:

1. **Red** — Write failing tests from the spec's Test Plan
2. **Green** — Implement code to make tests pass
3. **Refactor** — Clean up while keeping tests green
4. **Verify coverage** — delegate to `/generate-tests` to check for gaps

### Step 6 — Post-Implementation

After completing implementation, propose (don't force):
- `/security-audit` — if new endpoints or auth were added
- `/review-pr` — before creating a PR
