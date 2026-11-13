# KruzeApp — Claude Code Project Instructions

## Project Overview
KRUZE Coffee & Tea Omnichannel Management System. Three React SPAs (Admin, Storefront, POS) with Express.js REST API, PostgreSQL (Neon), Drizzle ORM, Supabase Auth.

## Documentation Structure
All docs live in `docs/` subdirectories — never dump in root:
- `docs/use-cases/` — permanent use case documentation (UC-NNN format)
- `docs/specs/` — technical specifications (SPEC-NNN format)
- `docs/architecture/` — ADRs, architecture analysis
- `docs/design/` — UI/UX design system
- `docs/product/` — backlog (feature work), issues (bugs/tech debt), epics
- `docs/api/` — API endpoint documentation
- `docs/reviews/` — PR review records
- `docs/investigations/` — bug investigations
- `docs/guides/` — developer guides

## Work Hierarchy
Use Cases → User Stories → Technical Specs → Tasks → Tests

## Skill-Based Architecture
All project rules, standards, and workflows live in `.claude/skills/` and are loaded on demand — not here. Shared references that skills pull from are in `.claude/skills/_shared/references/`.

## Request Routing (MANDATORY)

**Always invoke the matching skill. Never handle these flows manually or launch raw agents.**

| User says... | Invoke | What it does |
|---|---|---|
| "I want...", "we need...", "add...", "build...", "can we have...", any new capability | `/new-feature` | analyst → requirements → spec → implement |
| "update X to also...", "change how X works", "add Y to existing X" | `/extend-feature` | find docs → update UC/stories/spec → implement |
| References a Story ID, SPEC-NNN, or UC-NNN directly | `/implement-story` | read spec → implement directly |
| "broken", "not working", "error", "bug", "fix", unexpected behavior | `/bugfix` | investigate → fix → verify |
| "refactor", "clean up", "improve performance", "optimize" | `/refactor` | refactor directly, no behavior change |
| "remove X", "delete X", "deprecate X", "get rid of X" | `/deprecate-feature` | update UC status → remove code |
| "how does X work?", "explain X", "document X", "review UC-NNN" | `/analyze` | research only, no file creation |
| "what should we work on?", "prioritize", "plan sprint", "what's next?" | `/slice-stories` | requirements agent reviews backlog |
| "write tests for X", "add test coverage" | `/generate-tests` | testing agent |
| "security audit", "check for vulnerabilities" | `/security-audit` | security agent |
| "code review", "quality check", "find code smells" | `/quality-check` | code-quality agent |
| "review this PR", "review my changes", "before I merge" | `/review-pr` | pr-review agent |
| "review use case", "check UC-NNN", "QA the use case" | `/review-use-case` | review agent |
| "review stories", "check stories", "QA the stories" | `/review-stories` | review agent |
| "review tests", "check test coverage", "QA the tests" | `/review-tests` | review agent |
| "SEO audit", "improve SEO", "check SEO" | `/seo-review` | storefront SEO check |
| "create a spec for..." | `/generate-spec` | spec agent |
| "create a use case for..." | `/create-use-case` | analyst agent |
| "add a table for..." | `/add-table` | sql-drizzle agent |
| "fix type errors" | `/fix-types` | typescript agent |
| "document this decision", "create an ADR" | `/generate-adr` | documentation agent |
| "generate API docs", "document endpoints" | `/generate-api-docs` | documentation agent |
| "optimize this query", "N+1 problem" | `/optimize-query` | sql-drizzle agent |
| "create a dialog for...", "scaffold dialog" | `/scaffold-dialog` | react agent |
| "create a page for...", "scaffold page" | `/scaffold-page` | react agent |
| "create a service for...", "scaffold service" | `/scaffold-service` | express agent |
| "set up CI", "create pipeline" | `/setup-ci` | devops agent |

**Chaining:** Orchestration skills (`/new-feature`, `/extend-feature`) invoke sub-skills automatically:
- `/new-feature` calls → `/create-use-case` (analyst) → `/review-use-case` (review) → `/slice-stories` (requirements) → `/review-stories` (review) → `/generate-spec` (spec) → TDD implementation (tests first → code → refactor)
- Each sub-skill runs its own agent with its own shared references
- The **review agent** is independent from the writing agents — it never wrote what it reviews

**Post-implementation:** After any feature work, propose (don't force): `/generate-tests`, `/security-audit` (if new endpoints), `/review-pr` (before PR).
