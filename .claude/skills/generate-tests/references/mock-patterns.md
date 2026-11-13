# Mock Patterns

## Mocking Database with Chained Query Builder

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

## Mocking Another Service

```typescript
vi.mock('./parameterService', () => ({
  parameterService: {
    getCurrentYear: vi.fn().mockResolvedValue(2026),
  },
}));
```

## Mocking db.transaction

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

## Using vi.hoisted for Shared Mocks

When a mock variable is used inside `vi.mock()` factory functions, use `vi.hoisted()` to avoid "Cannot access before initialization" errors:

```typescript
const mockFn = vi.hoisted(() => vi.fn());
vi.mock('./module', () => ({ someExport: mockFn }));
```
