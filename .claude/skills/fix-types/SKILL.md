---
name: fix-types
description: Run TypeScript type checker and fix all errors with proper typing. Never uses 'any' — uses generics, utility types, and type guards.
user-invocable: true
argument-hint: "[file-path or 'all']"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
agent: typescript
---

Fix TypeScript type errors in `$ARGUMENTS` (or full codebase if "all" or no args).

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/available-mcps.md`

### Step 1: Run type checker
```bash
npx tsc --noEmit 2>&1
```
If `$ARGUMENTS` is a specific file, filter output to that file.

### Step 2: Categorize errors
Group errors by type:
- **Missing types** — implicit `any`, missing return types
- **Type mismatches** — wrong type assigned
- **Null safety** — unchecked null/undefined access
- **Import issues** — missing or incorrect type imports
- **Schema types** — Drizzle/Zod type misalignment

### Step 3: Fix each error

#### Never use `any` — use these instead:
| Instead of `any` | Use |
|-------------------|-----|
| Unknown input | `unknown` + type guard |
| Object with unknown shape | `Record<string, unknown>` |
| Function parameter | Proper generic `<T>` |
| Drizzle select result | `InferSelectModel<typeof table>` |
| Drizzle insert data | `InferInsertModel<typeof table>` |
| Partial update | `Partial<InsertType>` |
| Pick specific fields | `Pick<Type, 'field1' \| 'field2'>` |
| Omit specific fields | `Omit<Type, 'id' \| 'createdAt'>` |

#### Drizzle ORM type patterns:
```typescript
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { products } from '@shared/schema';

type Product = InferSelectModel<typeof products>;
type InsertProduct = InferInsertModel<typeof products>;
```

#### Type guard pattern:
```typescript
function isProduct(item: unknown): item is Product {
  return typeof item === 'object' && item !== null && 'price' in item;
}
```

#### Zod inference:
```typescript
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

const insertProductSchema = createInsertSchema(products);
type InsertProduct = z.infer<typeof insertProductSchema>;
```

### Step 4: Verify fix
Run `npx tsc --noEmit` again to confirm all errors are resolved.

### Step 5: Report
List what was fixed and any remaining issues that need manual review.

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
