---
name: security-audit
description: Run a security audit on the codebase or specific files. Checks OWASP vulnerabilities, auth flows, dependencies.
user-invocable: true
argument-hint: "[file-path or 'full' for complete audit]"
allowed-tools: Read, Grep, Glob, Bash
agent: security
---

Run a security audit on `$ARGUMENTS` (or full codebase if "full" or no args).

## Step 0 — Read Shared References
Read the following before starting:
- `.claude/skills/_shared/references/security-rules.md`
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/available-mcps.md`

## Step 1 — Read Security Baseline

Read these docs before auditing:
- `.claude/skills/_shared/references/security-rules.md` — implemented security measures
- `.claude/skills/_shared/references/security-rules.md` — JWT auth decision (NO CSRF tokens)

## Step 2 — Run Full Security Checklist

### Authentication & Authorization
- [ ] All `/api/*` routes use `requireAuth` or `isAdmin` middleware
- [ ] No unprotected mutation endpoints (POST/PATCH/PUT/DELETE)
- [ ] JWT tokens validated server-side on every request
- [ ] No CSRF tokens implemented (JWT auth handles this — see ADR)

### Input Validation
- [ ] All POST/PATCH/PUT endpoints validate input with Zod schemas
- [ ] No `sql.raw()` with unsanitized input (SQL injection risk)
- [ ] No string concatenation in Drizzle queries
- [ ] ID parameters validated with `parseIdParam()` from `server/security.ts`

### XSS Prevention
- [ ] No `dangerouslySetInnerHTML` with user-provided content
- [ ] No unescaped user content rendered in React
- [ ] No reflected user input in server responses

### Information Disclosure
- [ ] No PII in server logs (customer emails, addresses, phone numbers in console.log)
- [ ] Error responses don't expose stack traces or DB details
- [ ] Error messages sanitized based on NODE_ENV
- [ ] No hardcoded secrets (API keys, tokens, passwords, DB URLs)

### Dependencies
- [ ] Run `npm audit` — report vulnerabilities with severity
- [ ] No packages with known critical CVEs

### Infrastructure
- [ ] Helmet headers configured (CSP, HSTS, X-Frame-Options)
- [ ] CORS properly configured for production (ALLOWED_ORIGINS)
- [ ] Rate limiting on auth endpoints (10 req/15min) and API (100 req/15min)

## Step 3 — Scan for Specific Vulnerabilities

### SQL Injection
Search for patterns:
- `sql.raw()` with variable input
- String concatenation in query builders
- Template literals in `sql\`...\`` with unsanitized variables

### XSS
Search for patterns:
- `dangerouslySetInnerHTML`
- Rendering user input without escaping
- `innerHTML` assignments

### Secrets
Search for patterns:
- Hardcoded API keys, tokens, passwords
- Database connection strings in source
- `.env` files committed to git

### Auth Gaps
- Find all route handlers and verify each has auth middleware
- Check for routes that skip authentication

## Step 4 — Dependency Audit

Run `npm audit` and categorize results by severity.

## Output Format

```
## Security Audit Report

### CRITICAL
- [file:line] Description of critical vulnerability — immediate fix required

### HIGH
- [file:line] Description of high-severity issue

### MEDIUM
- [file:line] Description of medium-severity issue

### LOW
- [file:line] Description of low-severity issue

### PASSED
- [check] Authentication middleware verified on all routes
- [check] No SQL injection patterns found
- [check] Dependencies clean (npm audit)

### Dependency Vulnerabilities
| Package | Severity | Description | Fix |
|---------|----------|-------------|-----|

### Recommendations
1. [Priority] Action to take
```

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
