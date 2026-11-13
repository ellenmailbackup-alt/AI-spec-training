---
name: generate-api-docs
description: Generate API endpoint documentation from server/routes.ts. Produces a comprehensive endpoint reference.
user-invocable: true
argument-hint: "[endpoint-prefix or 'all']"
allowed-tools: Read, Grep, Glob, Write, Edit
agent: documentation
---

Generate API documentation for `$ARGUMENTS` (or all endpoints if "all" or no args).

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/documentation-structure.md`
- `.claude/skills/_shared/references/security-rules.md`

### Step 1: Extract endpoints
Read `server/routes.ts` and find all `app.get`, `app.post`, `app.patch`, `app.put`, `app.delete` handlers.

### Step 2: For each endpoint, document
- **HTTP method** and **path**
- **Auth requirement** (`requireAuth`, `isAdmin`, or public)
- **Request body/params** (from Zod schema if available)
- **Response shape** (from return statements)
- **Error responses** (from catch blocks and validation)

### Step 3: Group by domain
Organize endpoints into logical sections:
- Products, Customers, Sales, Invoices, Inventory, Roasts, Suppliers, Parameters, Dashboard, POS, Storefront, Auth

### Step 4: Write documentation
Save to `docs/api/endpoints.md`.

## Output Format

```markdown
# API Endpoint Reference

## Authentication
All endpoints require JWT authentication via Supabase unless marked as **Public**.
Admin-only endpoints require the `isAdmin` middleware.

## Products

### GET /api/products
- **Auth:** Admin
- **Response:** `Product[]`
- **Description:** List all products

### POST /api/products
- **Auth:** Admin
- **Request Body:**
  ```json
  {
    "name": "string (required)",
    "price": "string (decimal)",
    "categoryId": "number"
  }
  ```
- **Response:** `Product` (201 Created)
- **Errors:** 400 (validation), 500 (server error)

[...continue for all endpoints...]
```

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
