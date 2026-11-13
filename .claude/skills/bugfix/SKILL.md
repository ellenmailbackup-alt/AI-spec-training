---
name: bugfix
description: Investigate and fix a bug. Skips ideation — goes straight to diagnosis, fix, and verification.
user-invocable: true
argument-hint: "[bug description or error message]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
agent: general-purpose
---

Investigate and fix the bug described by `$ARGUMENTS`.

---

## Recognition

This skill handles: "broken", "not working", "error", "bug", "fix", or describing unexpected behavior.

## Procedure

### Step 1 — Load Context

Read shared references relevant to the fix:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/security-rules.md`
- `.claude/skills/_shared/references/available-mcps.md`

### Step 2 — Investigate

1. Reproduce or understand the bug from the description
2. Search for the relevant code paths
3. Identify the root cause

### Step 3 — Fix

Apply the fix following architecture rules and coding standards.

### Step 4 — Verify

Confirm the fix resolves the issue. Run related tests if they exist.

### Step 5 — Follow-up

- If the bug reveals a gap in a use case, note it as a follow-up but don't block the fix
- Bugs and tech debt go to `docs/product/ISSUES.md`, never in use cases or backlog
- Propose `/generate-tests` if the bug area lacks test coverage
