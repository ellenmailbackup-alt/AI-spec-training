---
name: seo-review
description: Audit storefront pages for SEO issues — meta tags, structured data, accessibility, performance.
user-invocable: true
argument-hint: "[page or 'full' for complete audit]"
allowed-tools: Read, Grep, Glob, Bash
agent: general-purpose
---

Run an SEO review on `$ARGUMENTS` (or full storefront if "full" or no args).

---

## Recognition

This skill handles: "SEO audit", "improve SEO", "check SEO", "optimize for search", "add meta tags".

## Procedure

### Step 0 — Read Shared References
Read the following before starting:
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/documentation-structure.md`
- `.claude/skills/_shared/references/available-mcps.md`

### Step 1 — Identify Storefront Pages

Search `client/src/pages/storefront/` for all page components.

### Step 2 — Check Each Page

For each page, verify:
- [ ] `<title>` tag present and descriptive
- [ ] `<meta name="description">` present and unique
- [ ] Open Graph tags (`og:title`, `og:description`, `og:image`)
- [ ] Semantic HTML (`<main>`, `<article>`, `<nav>`, `<header>`, `<footer>`)
- [ ] Heading hierarchy (single `<h1>`, logical `<h2>`-`<h6>` nesting)
- [ ] Image `alt` attributes present and descriptive
- [ ] Canonical URLs if applicable
- [ ] Structured data (JSON-LD) for products if applicable

### Step 3 — Report

Present findings with specific file:line references and recommendations.

If the review reveals a need for new SEO functionality, recommend `/new-feature` to capture it properly.
