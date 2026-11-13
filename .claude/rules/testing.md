---
paths:
  - "**/*.test.ts"
  - "**/__tests__/**"
---

# Testing Rules

## Framework
- Vitest for all tests
- React Testing Library for component tests
- Supertest for API endpoint tests

## Test Structure
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ServiceName', () => {
  let service: ServiceName;
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = { /* mocked methods */ };
    service = new ServiceName(mockStorage);
  });

  describe('methodName', () => {
    it('should [expected behavior]', async () => { /* ... */ });
    it('should handle [edge case]', async () => { /* ... */ });
    it('should throw when [error condition]', async () => { /* ... */ });
  });
});
```

## Coverage Goals
- Service files: test all public methods, edge cases, error paths
- Routes: test HTTP status codes, response shapes, auth requirements, validation
- Components: test rendering, user interactions, async state changes

## Traceability
- Annotate tests with story/use-case IDs: `// Story: 1.1.1 | UC: UC-001`

## Current State
- Only 2 test files exist (security.test.ts, currency.test.ts)
- Expanding coverage is a top priority
