# Security Rules (CRITICAL)

- JWT-based auth — NEVER re-implement CSRF tokens
- Helmet headers, CORS restricted to production domains
- Rate limiting on auth endpoints
- Input validation via Zod on all POST/PATCH/PUT
- No PII in server logs
- No hardcoded secrets in source code

## Security Docs
