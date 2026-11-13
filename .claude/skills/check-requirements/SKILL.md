---
name: check-requirements
description: Check requirements (user stories, acceptance criteria, use case steps, spec requirements, or pasted text) against the 7 rules for writing better requirements and propose concrete rewrites.
user-invocable: true
argument-hint: "[Story ID, UC-NNN, SPEC-NNN, file path, or requirement text]"
allowed-tools: Read, Grep, Glob
agent: requirements-quality
---

Check the requirements specified by `$ARGUMENTS` against the 7 rules for writing better requirements.

---

## Step 0 — Read References
Read before starting:
- `.claude/skills/check-requirements/references/requirement-writing-rules.md`

## Step 1 — Gather Requirements

- **Story ID** (e.g. "1.2"): find the story file in `docs/product/backlog/epic-N-*/`
- **UC-NNN**: read `docs/use-cases/UC-NNN-*.md` (main flow, alternative flows, business rules)
- **SPEC-NNN**: read `docs/specs/SPEC-NNN-*.md` (requirements, acceptance criteria)
- **File path**: read that file
- **Plain text**: treat the text in `$ARGUMENTS` as the requirements to check
- **Empty**: ask which requirements to check

## Step 2 — Extract Requirement Sentences

Split the source into individual requirement sentences:
- "I want" + "so that" clauses of a user story
- Each acceptance criterion
- Each use case flow step and business rule
- Each functional / non-functional requirement in a spec

Ignore headings, metadata, and explanatory prose that is not a requirement. Record the location (file:line or criterion number) for each sentence.

**Line numbers must be exact** — take them from the line numbers shown by the Read tool (1-based); never estimate or count manually. Double-check each `file:line` before reporting.

## Step 3 — Check Each Sentence Against All 7 Rules

| # | Rule | Look for |
|---|---|---|
| 1 | Simple, direct, active sentences | passive voice, long nested sentences |
| 2 | Mention the type of user | "user", missing actor, "they" |
| 3 | Single desired result | multiple outcomes, "manage/handle/support" |
| 4 | No conjunctions | and, or, also, as well as, and/or, & |
| 5 | No but / except / unless | but, except, unless, however, other than |
| 6 | No vague terms | fast, optimal, easy, user-friendly, several, ... |
| 7 | No possibility verbs | may, might, should, could, would, ideally |

Apply the exceptions from the reference file (proper names, fixed domain terms) — no false positives.

## Step 4 — Rewrite

For every violating sentence produce a rewrite that passes all 7 rules:
- Split conjunctions and exceptions into separate requirements (R1, R2, ...)
- Replace vague terms with measurable values, or `[TBD: value]` + an Open Question
- Replace possibility verbs with a definite present-tense verb or "must"
- Name the specific user type
- Re-check the rewrite against all 7 rules before reporting it

## Step 5 — Produce Report

Use the template in `.claude/skills/check-requirements/templates/requirement-check-report.md`.

**Verdict:**
- **PASS** — no Critical findings, at most a few Suggestions
- **NEEDS REVISION** — Warnings or a few Critical findings
- **MAJOR REWRITE** — most sentences have Critical findings

Do not modify the documents. After the report, offer to apply the rewrites via `/extend-feature` (for use cases/stories/specs).

---

## Retrospective

After completing this task, review the conversation for corrections or feedback the user gave. If they are **not already captured** in this skill or its reference file:

1. List each lesson learned (what was wrong, what is correct).
2. Propose specific changes to this skill or the rules reference.

**Do not apply changes.** Present the proposals and wait for user approval.
