# SPEC-NNN: [Title]

## References
- **Story:** [Story ID and file path from docs/product/backlog/]
- **Use Case:** [UC-NNN]

## Scope
[What this spec covers and what it explicitly does NOT cover]

## Schema Changes
- [ ] New tables / columns in shared/schema.ts
- [ ] Migration file via drizzle-kit generate
- [ ] Updated Zod insert schemas

## Backend Changes
- [ ] Storage methods in server/storage.ts
- [ ] Service file: server/[name]Service.ts (follow roastService.ts pattern)
- [ ] Route handlers in server/routes.ts (thin HTTP layer only)
- [ ] Validation: Zod schemas for request body/params

## Frontend Changes
- [ ] Components in client/src/components/
- [ ] Pages in client/src/pages/admin/ (or /pos/ or /storefront/)
- [ ] Hooks in client/src/hooks/
- [ ] Design: follows design_guidelines.md [specific guidelines]

## Security Considerations
- [ ] Auth required? Which roles?
- [ ] Input validation (Zod)
- [ ] Rate limiting needed?

## Test Plan (TDD — tests are written BEFORE implementation)

### Acceptance Criteria → Test Cases

| Acceptance Criterion | Test Type | Test Description | File |
|---|---|---|---|
| [Criterion 1 from story] | service / route / component | [What the test asserts] | [exact test file path] |
| [Criterion 2 from story] | service / route / component | [What the test asserts] | [exact test file path] |

### Service Tests (Vitest, mock storage)
- [ ] [Test case: happy path for method X]
- [ ] [Test case: edge case for method X]
- [ ] [Test case: error path for method X]

### Route Tests (supertest)
- [ ] [Test case: 401 without auth]
- [ ] [Test case: 400 with invalid input]
- [ ] [Test case: 200 with valid request]

### Component Tests (React Testing Library)
- [ ] [Test case: renders with required props]
- [ ] [Test case: user interaction triggers expected behavior]

### Implementation Order
1. Write failing tests from this test plan
2. Implement code to make tests pass
3. Refactor while keeping tests green
