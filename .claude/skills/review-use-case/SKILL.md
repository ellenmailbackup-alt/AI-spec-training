---
name: review-use-case
description: Review a use case document against the 23 writing rules, quality checklist, and Use-Case 3.0 principles. Use after creating/updating a use case or on demand.
user-invocable: true
argument-hint: "[UC-NNN]"
allowed-tools: Read, Grep, Glob
agent: review
---

Review the use case specified by `$ARGUMENTS` for quality and standards compliance.

---

## Step 0 — Read References
Read the following before starting:
- `.claude/skills/_shared/references/use-case-30-principles.md`
- `.claude/skills/create-use-case/references/quality-checklist.md`
- `.claude/skills/create-use-case/references/writing-rules.md`
- `.claude/skills/_shared/references/documentation-structure.md`

## Step 1 — Read the Use Case

Read the use case document from `docs/use-cases/` matching `$ARGUMENTS`.

## Step 2 — Apply Quality Checklist

Run through every item in the quality checklist:

- [ ] **One capability** per use case
- [ ] **Title** follows Verb + Noun pattern from the actor's perspective
- [ ] **Short description** present after title
- [ ] **No technical language** in flows, preconditions, postconditions, or business rules
- [ ] **No UI references** (buttons, dropdowns, modals, tabs, forms)
- [ ] **No infrastructure actors** (databases, libraries, storage services)
- [ ] **Business verbs** used (add/remove/change, not create/delete/update)
- [ ] **Main flow** reads as one continuous story with no sub-headers
- [ ] **Each step** clearly identifies who acts (actor or system)
- [ ] **Technical details** are in Implementation Notes section only
- [ ] **Exception flows** only describe scenarios where the postcondition cannot be achieved
- [ ] **Business rules** are validatable constraints only
- [ ] **Presentation Guidelines** used for page-specific display rules (if applicable)
- [ ] **Implemented By** section has accurate, verified paths
- [ ] **Uninterruptible flow** check — entire continuous flow in one UC
- [ ] **No "Known Issues" section**
- [ ] **Every AF specifies branch and rejoin**
- [ ] **Every EF specifies detection step**
- [ ] **No AFs that duplicate the main flow ending**
- [ ] **No EFs for filtered-out conditions**
- [ ] **Main flow uses one variant per step**

## Step 3 — Apply Writing Rules (23 Rules)

Check every writing rule from the create-use-case skill. For each violation, cite:
- The rule number and name
- The exact text that violates it
- A concrete rewrite

## Step 4 — Verify Against Use-Case 3.0 Principles

- Does the UC have a clear basic scenario (happy path)?
- Are extensions (AFs/EFs) sliceable into deliverable increments?
- Does each slice traverse start to finish?
- Does each slice provide value?

## Step 5 — Verify Against Codebase

Cross-check the "Implemented By" section:
- Do the referenced route paths exist in `server/routes.ts`?
- Do the referenced service files exist?
- Do the referenced components exist?
- Are schema fields in "the system asks for" steps consistent with `shared/schema.ts`?

Flag any references to files, endpoints, or fields that don't exist.

## Step 6 — Produce Review Report

Use the template from `.claude/skills/review-use-case/templates/uc-review-report.md`.

**Severity levels:**
- **Critical** — Structural issues: wrong scope (multiple capabilities), missing flows, technical language in main flow, broken traceability
- **Warning** — Rule violations that don't break the UC but reduce quality: vague steps, missing field enumeration, UI language
- **Suggestion** — Minor wording, style, or completeness improvements

For every issue flagged, provide a **concrete rewrite** of the affected text.

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
