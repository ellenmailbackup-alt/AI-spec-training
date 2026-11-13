---
name: scaffold-service
description: Scaffold a new backend service following the roastService.ts clean architecture pattern.
user-invocable: true
argument-hint: "[service-name]"
allowed-tools: Read, Grep, Glob, Write, Edit
agent: express
---

Scaffold a new service for `$ARGUMENTS` following the clean architecture pattern.

## Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/security-rules.md`
- `.claude/skills/_shared/references/available-mcps.md`

## Architecture Rules (MANDATORY)

1. **No business logic in routes.ts** — only HTTP concerns (validate, auth, call service, respond)
2. **All `db.transaction()` in the service** — never in routes or storage
3. **No in-memory filtering in storage** — use SQL WHERE clauses
4. **Static imports only** — no dynamic `await import()`
5. **Descriptive error messages** — include error code and context
6. **`requireAuth` middleware** on all `/api/*` routes

## Step-by-Step Procedure

### Step 1: Read reference implementation
Read `server/roastService.ts` — this is THE pattern to follow.

### Step 2: Find schema tables
Read `shared/schema.ts` to find relevant tables for `$ARGUMENTS`. Note column names, types, and relationships.

### Step 3: Check existing routes
Search `server/routes.ts` for existing endpoints related to `$ARGUMENTS`. Note any business logic that should move to the service.

### Step 4: Create service file
Create `server/$ARGUMENTSService.ts` following the pattern below.

### Step 5: Update routes
Update `server/routes.ts` to use the new service — thin HTTP handlers only.

### Step 6: Verify patterns
Check against `docs/architecture/CLEAN_ARCHITECTURE_SHOWCASE.md` to confirm compliance.

## Service Pattern Template

```typescript
import { db } from './db';
import { eq } from 'drizzle-orm';
import { tableName, type InsertTableName, type TableName } from '@shared/schema';

export class NameService {
  // Simple reads can delegate to storage
  async getById(id: number): Promise<TableName | undefined> {
    const [result] = await db.select()
      .from(tableName)
      .where(eq(tableName.id, id));
    return result;
  }

  async getAll(): Promise<TableName[]> {
    return await db.select().from(tableName);
  }

  // Business logic with transactions
  async create(data: InsertTableName): Promise<TableName> {
    return await db.transaction(async (tx) => {
      // 1. Validate business rules
      // 2. Create main record
      const [record] = await tx.insert(tableName)
        .values(data)
        .returning();

      // 3. Create related records (stock movements, etc.)
      // 4. Return result
      return record;
    });
  }

  async update(id: number, data: Partial<InsertTableName>): Promise<TableName> {
    return await db.transaction(async (tx) => {
      // 1. Verify record exists
      const [existing] = await tx.select()
        .from(tableName)
        .where(eq(tableName.id, id));

      if (!existing) {
        throw new Error(`${tableName} with ID ${id} not found`);
      }

      // 2. Apply business rules
      // 3. Update record
      const [updated] = await tx.update(tableName)
        .set(data)
        .where(eq(tableName.id, id))
        .returning();

      return updated;
    });
  }

  async delete(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // 1. Verify record exists and can be deleted
      // 2. Clean up related records (stock movements, etc.)
      // 3. Delete main record
      const result = await tx.delete(tableName)
        .where(eq(tableName.id, id));

      return (result.rowCount ?? 0) > 0;
    });
  }
}

// Singleton export
export const nameService = new NameService();
```

## Route Pattern Template

```typescript
// In server/routes.ts — thin HTTP handler
app.post("/api/resource", isAdmin, async (req, res) => {
  try {
    const validated = insertSchema.parse(req.body);
    const result = await nameService.create(validated);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create resource";
    res.status(error instanceof Error && error.message.includes("not found") ? 404 : 500)
      .json({ error: message });
  }
});
```

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
