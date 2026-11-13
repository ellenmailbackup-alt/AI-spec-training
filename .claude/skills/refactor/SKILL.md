---
name: refactor
description: Refactor or optimize code — technical improvement with no behavior change. Skips ideation.
user-invocable: true
argument-hint: "[what to refactor]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
agent: general-purpose
---

Refactor or improve `$ARGUMENTS`.

---

## Recognition

This skill handles: "refactor", "clean up", "improve performance", "optimize", technical change with no behavior change.

## Procedure

### Step 1 — Load Context

Read shared references relevant to the refactor:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/available-mcps.md`

### Step 2 — Understand Current State

Read the code to refactor. Understand what it does and how it fits into the architecture.

### Step 3 — Refactor

Apply the improvement. No behavior changes — only structural, performance, or readability improvements.

### Step 4 — Verify

Ensure no behavior has changed. Run existing tests if available.
