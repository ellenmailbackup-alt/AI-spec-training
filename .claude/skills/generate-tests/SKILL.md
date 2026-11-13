---
name: generate-tests
description: Generate or verify Vitest tests for a file or feature. In TDD flow, verifies coverage gaps after implementation. Standalone, creates full test suites.
user-invocable: true
argument-hint: "[file-path or feature-name]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
agent: testing
---

Generate or verify Vitest tests for `$ARGUMENTS`.

## TDD Context

In the standard workflow, tests are written BEFORE implementation as part of `/implement-story`. This skill serves two purposes:
1. **Coverage verification** (in TDD flow) — after implementation, check that all acceptance criteria have tests and find gaps
2. **Standalone test generation** (on-demand) — generate full test suites for existing code that lacks tests

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/architecture-rules.md`
- `.claude/skills/_shared/references/coding-standards.md`
- `.claude/skills/_shared/references/tech-stack.md`
- `.claude/skills/_shared/references/available-mcps.md`

1. Read the target file to understand its public API and dependencies
2. Determine test type based on file pattern:
   - `*Service.ts` → service unit test (mock storage/db, test business logic)
   - `routes.ts` endpoint → route integration test (supertest)
   - `*.tsx` component → React Testing Library test
3. If a SPEC-NNN exists for the feature, read `docs/specs/SPEC-NNN.md` for acceptance criteria
4. Check `docs/product/backlog/epic-N-*/` for related story acceptance criteria
5. Create test file co-located with the source:
   - Service: `server/[name]Service.test.ts`
   - Utility: `[name].test.ts` next to source file
6. Write tests covering all categories below
7. Run `npm run test` to verify tests pass
8. Report results with pass/fail counts

## Test Coverage Categories

### For service tests:
- Happy path for each public method
- Edge cases (empty inputs, boundary values, nulls)
- Error paths (invalid data, missing references, thrown errors)
- Transaction behavior (verify `db.transaction()` is used for multi-step ops)

### For route tests:
- Authentication (401 without token)
- Authorization (403 for non-admin on admin routes)
- Validation (400 with bad input)
- Success (200/201 with valid data)
- Not found (404 for missing resources)
- Response shape validation

### For component tests:
- Renders correctly with required props
- User interactions (click, type, submit)
- Conditional rendering states (loading, error, empty)
- Accessibility (labels, roles)

## Test Structure Patterns

### Service Test (mock storage, test business logic)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServiceName();
  });

  describe('create', () => {
    it('should create with valid data', async () => { /* ... */ });
    it('should validate required fields', async () => { /* ... */ });
    it('should handle duplicate entries', async () => { /* ... */ });
  });
});
```

### Route Test (supertest, test HTTP layer)
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('GET /api/products', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  it('should return products array', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

### Component Test (React Testing Library)
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Mock Patterns

### Mocking database with chained query builder
```typescript
const mockWhere = vi.hoisted(() => vi.fn());

vi.mock('./db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: mockWhere,
      }),
    }),
  },
}));
```

### Mocking another service
```typescript
vi.mock('./parameterService', () => ({
  parameterService: {
    getCurrentYear: vi.fn().mockResolvedValue(2026),
  },
}));
```

### Mocking db.transaction
```typescript
const mockTx: any = {
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
};

vi.mock('./db', () => ({
  db: {
    transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => callback(mockTx)),
  },
}));
```

### Using vi.hoisted for shared mocks
When a mock variable is used inside `vi.mock()` factory functions, use `vi.hoisted()` to avoid "Cannot access before initialization" errors:
```typescript
const mockFn = vi.hoisted(() => vi.fn());
vi.mock('./module', () => ({ someExport: mockFn }));
```

## Traceability

Annotate tests with story/use-case IDs when known:
```typescript
// Story: 1.1.1 | UC: UC-001 — Revenue Overview
describe('DashboardService - Revenue', () => { /* ... */ });
```

If acceptance criteria exist in the backlog or spec, map each criterion to at least one test case and note the mapping in a comment.

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
