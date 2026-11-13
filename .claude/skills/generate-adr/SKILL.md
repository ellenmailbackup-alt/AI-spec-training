---
name: generate-adr
description: Create an Architecture Decision Record documenting a technical decision, its rationale, and alternatives considered.
user-invocable: true
argument-hint: "[decision topic]"
allowed-tools: Read, Grep, Glob, Write, Edit
agent: documentation
---

Create an Architecture Decision Record (ADR) for `$ARGUMENTS`.

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/documentation-structure.md`

### Step 1: Understand the decision
Gather from the user or context:
- What was decided?
- Why was it decided? (constraints, requirements, trade-offs)
- What alternatives were considered?
- What are the consequences?

### Step 2: Read existing ADRs for format
Read `.claude/skills/generate-adr/templates/adr-template.md` as the format reference.

### Step 3: Determine ADR number
Check `docs/architecture/` for existing ADR files and use the next available number.

### Step 4: Write the ADR
Save to `docs/architecture/ADR-NNN-short-title.md`.

## ADR Template

```markdown
# Architecture Decision Record: [Title]

**Date:** [YYYY-MM-DD]
**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Decision Makers:** [who]
**Supersedes:** [previous decision, if any]

---

## Context and Problem Statement

[What is the issue? What forces are at play? 2-4 paragraphs.]

## Decision Drivers

1. [Driver 1]
2. [Driver 2]
3. [Driver 3]

## Considered Options

### Option 1: [Name]
**Pros:**
- ...

**Cons:**
- ...

### Option 2: [Name] (SELECTED)
**Pros:**
- ...

**Cons:**
- ...

## Decision Outcome

**Chosen Option:** [Option name]

[Explain why this option was chosen. How does it address the decision drivers?]

## Consequences

### Positive
- ...

### Negative
- ...

### Mitigation for Negatives
- ...

## References
- [Links to related docs, RFCs, external resources]
```

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
