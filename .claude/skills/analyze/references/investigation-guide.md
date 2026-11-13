# Investigation Guide

## What to Investigate

1. **Routes** — find all API endpoints related to the feature in `server/routes.ts`
2. **Services** — find service files (`server/*Service.ts`) that handle business logic
3. **Storage** — find storage methods in `server/storage.ts` for data access
4. **Components** — find React components in `client/src/` related to this feature
5. **Schema** — find relevant database tables in `shared/schema.ts`
6. **Existing docs** — check `docs/use-cases/`, `docs/specs/`, and `docs/product/backlog/` for prior work

## What to Report

Present a structured summary covering:

- **What it does** — plain-language description of the capability
- **How it works** — the flow from UI -> route -> service -> storage
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
- If no arguments provided, identify undocumented features by comparing routes against existing use cases in `docs/use-cases/`
