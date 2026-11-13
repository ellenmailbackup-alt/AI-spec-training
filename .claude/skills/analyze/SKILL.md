---
name: analyze
description: Research and explore a feature or area of the codebase. Reports findings without creating documents. Use to understand how something works before deciding next steps.
user-invocable: true
argument-hint: "[feature-name or area]"
allowed-tools: Read, Grep, Glob
agent: analyst
---

Research and explore the feature or area specified by `$ARGUMENTS`. Report your findings — do NOT create any documents.

## Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/documentation-structure.md`

## What to investigate

1. **Routes** — find all API endpoints related to `$ARGUMENTS` in `server/routes.ts`
2. **Services** — find service files (`server/*Service.ts`) that handle business logic
3. **Storage** — find storage methods in `server/storage.ts` for data access
4. **Components** — find React components in `client/src/` related to this feature
5. **Schema** — find relevant database tables in `shared/schema.ts`
6. **Existing docs** — check `docs/use-cases/`, `docs/specs/`, and `docs/product/backlog/` for prior work

## What to report

Present a structured summary covering:

- **What it does** — plain-language description of the capability
- **How it works** — the flow from UI → route → service → storage
- **Key files** — list of files involved with their roles
- **Actors** — who uses this feature and through which interface
- **Business rules** — constraints or conditions the system enforces
- **External systems** — any third-party integrations
- **Gaps** — anything missing, partially implemented, or undocumented
- **Existing documentation** — links to any UCs, specs, or stories that already cover this

## Rules

- **Do NOT create or write any files** — this is a research-only skill
- **Do NOT create use case documents** — use `/create-use-case` for that
- Report findings directly to the user so they can decide next steps
- If no `$ARGUMENTS` provided, identify undocumented features by comparing routes against existing use cases in `docs/use-cases/`

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
