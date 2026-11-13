# Available MCP Servers

## Context7 — Library Documentation
Up-to-date documentation for all project libraries. Use this INSTEAD of relying on training data when you need current API details for:
- Drizzle ORM (schema, queries, migrations)
- TanStack Query (useQuery, useMutation patterns)
- React 18 (hooks, patterns)
- shadcn/Radix UI (component APIs)
- Zod (schema validation)
- Supabase JS SDK (auth, client)
- Vite (config, plugins)
- Wouter (routing)

**When to use:** Before writing code that uses a library API you're not 100% certain about.

## Playwright — Browser Testing
Interact with a real browser: navigate pages, click elements, fill forms, take screenshots.

**When to use:**
- Verifying storefront pages render correctly after changes
- Testing POS flows end-to-end
- Checking UI changes visually
- Debugging visual issues
- SEO audits (checking actual rendered HTML)

## Supabase — Database & Auth (local scope, when configured)
Direct access to the Supabase database and auth system.

**When to use:**
- Inspecting actual database schema and data
- Verifying migration results
- Debugging auth flows
- Checking real data when optimizing queries

**Note:** Only available when configured via `claude mcp add` with credentials. Not in `.mcp.json`.
