# Test Patterns

## Test Coverage Categories

### For Service Tests
- Happy path for each public method
- Edge cases (empty inputs, boundary values, nulls)
- Error paths (invalid data, missing references, thrown errors)
- Transaction behavior (verify `db.transaction()` is used for multi-step ops)

### For Route Tests
- Authentication (401 without token)
- Authorization (403 for non-admin on admin routes)
- Validation (400 with bad input)
- Success (200/201 with valid data)
- Not found (404 for missing resources)
- Response shape validation

### For Component Tests
- Renders correctly with required props
- User interactions (click, type, submit)
- Conditional rendering states (loading, error, empty)
- Accessibility (labels, roles)

## Traceability

Annotate tests with story/use-case IDs when known:
```typescript
// Story: 1.1.1 | UC: UC-001 — Revenue Overview
describe('DashboardService - Revenue', () => { /* ... */ });
```

If acceptance criteria exist in the backlog or spec, map each criterion to at least one test case and note the mapping in a comment.
