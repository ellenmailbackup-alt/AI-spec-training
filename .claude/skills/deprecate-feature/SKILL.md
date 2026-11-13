---
name: deprecate-feature
description: Remove or deprecate a feature — update its use case status and clean up the code.
user-invocable: true
argument-hint: "[feature to remove]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, Agent
agent: general-purpose
---

Remove or deprecate the feature described by `$ARGUMENTS`.

---

## Recognition

This skill handles: "remove the X feature", "delete X", "deprecate X", "get rid of X".

## Procedure

### Step 1 — Load Context

Read:
- `.claude/skills/_shared/references/documentation-structure.md`
- `.claude/skills/_shared/references/architecture-rules.md`

### Step 2 — Find Existing Documentation

Search `docs/use-cases/` for the existing UC covering this feature.

### Step 3 — Update Use Case

Delegate to the **analyst agent** to update the UC status to `Deprecated` with a note explaining why.

### Step 4 — Implement Removal

Delete code, clean up routes/services/components. Follow architecture rules.

### Step 5 — Verify

Ensure no broken references or imports remain.
