# TypeScript Type Patterns

## Never Use `any` — Use These Instead

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

## Drizzle ORM Type Patterns

```typescript
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { products } from '@shared/schema';

type Product = InferSelectModel<typeof products>;
type InsertProduct = InferInsertModel<typeof products>;
```

## Type Guard Pattern

```typescript
function isProduct(item: unknown): item is Product {
  return typeof item === 'object' && item !== null && 'price' in item;
}
```

## Zod Inference

```typescript
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

const insertProductSchema = createInsertSchema(products);
type InsertProduct = z.infer<typeof insertProductSchema>;
```

## Error Categorization

Group errors by type when fixing:
- **Missing types** — implicit `any`, missing return types
- **Type mismatches** — wrong type assigned
- **Null safety** — unchecked null/undefined access
- **Import issues** — missing or incorrect type imports
- **Schema types** — Drizzle/Zod type misalignment
