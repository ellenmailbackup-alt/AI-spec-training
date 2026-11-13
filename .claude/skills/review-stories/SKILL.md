---
name: review-stories
description: Review user stories against Mike Cohn's 15 principles and INVEST criteria. Use after slicing stories or before sprint planning.
user-invocable: true
argument-hint: "[Story IDs, UC-NNN, or 'all']"
allowed-tools: Read, Grep, Glob
agent: review
---

Review user stories specified by `$ARGUMENTS` against Mike Cohn's 15 principles.

---

## Step 0 — Read References
Read the following before starting:
- `.claude/skills/review-stories/references/mike-cohn-principles.md`
- `.claude/skills/_shared/references/use-case-30-principles.md`

## Step 1 — Gather Stories to Review

- If `$ARGUMENTS` is a Story ID (e.g., "1.1"): find the story file in `docs/product/backlog/epic-N-*/`
- If `$ARGUMENTS` is a UC-NNN: search all story files in `docs/product/backlog/` that reference that UC
- If `$ARGUMENTS` is "all": review all story files across `docs/product/backlog/epic-N-*/`
- Also read the referenced use case(s) from `docs/use-cases/` to verify traceability

## Step 2 — Review Each Story Against All 14 Principles

For each story, evaluate against every Mike Cohn principle:

1. **Slice the Cake** — Is it a complete vertical slice (UI + backend + data)?
2. **Size to Horizon** — Is it appropriately sized for its backlog position?
3. **Single User Role** — Does it name one specific actor (not generic "user")?
4. **Not a Task** — Does the "so that" benefit a real end-user or the business?
5. **Customer Writes** — Would a non-technical stakeholder understand it?
6. **Purpose Focus** — Is the core intent clear in one sentence?
7. **No Fixed Priority via Numbering** — Can it be reprioritized without confusion?
8. **Closed Story** — Are there clear, measurable endpoints for "done"?
9. **Minimal UI Details** — Does it avoid specifying buttons, layouts, modals?
10. **No Conjunctions** — Does it describe exactly one capability (no "and"/"or")?
11. **INVEST** — Independent, Negotiable, Valuable, Estimable, Small, Testable?
12. **Clarity & Simplicity** — Active voice, right level of detail?
13. **Review & Adaptation** — Does it still reflect current understanding?
14. **Business/Technical Balance** — Does it serve business goals while being feasible?
15. **Split or Sharpen** — If vague, does it need splitting or just better acceptance criteria?

## Step 3 — Check Splitting Quality

For any story that seems too large (aim for 6–10 stories per sprint), check:
- Was an appropriate splitting pattern used? (Workflow Steps, CRUD, Business Rule Variations, Data Variations, Data Entry Methods, Major Effort, Simple/Complex, Defer Performance, Spike)
- **Horizontal slicing anti-pattern** — Is any story scoped to a single layer (just UI, just DB)? Flag it.
- **Tasks dressed as stories** — Does any story use "As a developer..." or have a team-facing "so that"? Flag it.
- If a story could be split further, suggest which pattern applies and how.

## Step 4 — Check Cross-Story Quality

- **Coverage gaps** — Are all main flow steps and alternative flows from the UC covered by at least one story?
- **Overlaps** — Do any two stories cover the same functionality?
- **Dependencies** — Are dependencies between stories explicit and minimal?
- **Acceptance criteria** — Is each criterion independently testable with clear pass/fail?
- **Equal sizing** — Are stories roughly similar in size, or is there one giant story surrounded by tiny ones?

## Step 4 — Verify Against Codebase (if stories reference existing features)

- If the UC has an "Implemented By" section, verify the referenced files exist
- Cross-check schema fields mentioned in acceptance criteria against `shared/schema.ts`

## Step 5 — Produce Review Report

Use the template from `.claude/skills/review-stories/templates/story-review-report.md`.

**Severity levels:**
- **Critical** — Story violates core principles (not a story, open-ended, two capabilities merged, no acceptance criteria)
- **Warning** — Story is functional but could be improved (vague actor, UI details leaked in, could be smaller)
- **Suggestion** — Minor wording or structure improvements

For every issue flagged, provide a **concrete rewrite** — not just "fix this".

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
