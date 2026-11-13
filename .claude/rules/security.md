---
paths:
  - "server/**/*.ts"
---

# Security Rules for Server Code

Reference: `.claude/skills/_shared/references/security-rules.md`

## Authentication
- JWT-based auth via Supabase — NEVER re-implement CSRF tokens
- All `/api/*` routes require `requireAuth` middleware
- HTTP-only cookies for JWT tokens
- Validate JWT on every request server-side

## Input Validation
- ALL POST/PATCH/PUT endpoints MUST validate with Zod schemas
- Use `createInsertSchema()` from `drizzle-zod` for DB-bound data
- Never trust client input — validate at system boundaries

## Error Handling
- NEVER expose stack traces, DB errors, or internal details to clients
- Sanitize all error responses
- No PII in server logs (no customer emails, addresses, phone numbers in console.log)

## Dependencies
- Run `npm audit` before adding new packages
- No packages with known CVEs

## Headers & CORS
- Helmet headers configured in `server/security.ts`
- CORS restricted to production domains only
- Rate limiting on auth and mutation endpoints

## Secrets
- NEVER hardcode API keys, tokens, passwords, or database URLs
- All secrets via environment variables
- Check `.env.example` for required vars
