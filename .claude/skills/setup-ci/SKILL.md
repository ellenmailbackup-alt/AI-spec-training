---
name: setup-ci
description: Generate GitHub Actions CI/CD pipeline for type checking, testing, building, and security auditing.
user-invocable: true
argument-hint: "[basic or full]"
allowed-tools: Read, Grep, Glob, Write, Edit
agent: devops
---

Generate a GitHub Actions CI/CD pipeline for KruzeApp.

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/tech-stack.md`

### Step 1: Check existing CI
Check if `.github/workflows/` already exists. If so, read existing workflows before modifying.

### Step 2: Read build configuration
- Read `package.json` for available scripts
- Read `tsconfig.json` for TypeScript config
- Read `vitest.config.ts` for test config
- Read `Dockerfile` for build process

### Step 3: Create the workflow
Create `.github/workflows/ci.yml` based on the level requested.

### Step 4: Verify locally
Run the individual commands to verify they work before committing.

## Basic Pipeline (default)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build

      - name: Security audit
        run: npm audit --audit-level=high
```

## Full Pipeline (when "full" is specified)

Adds: test coverage, Docker build validation, and deployment triggers.

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests with coverage
        run: npx vitest --coverage --reporter=verbose

      - name: Build
        run: npm run build

      - name: Security audit
        run: npm audit --audit-level=high

  docker:
    runs-on: ubuntu-latest
    needs: check
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t kruzeapp:${{ github.sha }} .

      - name: Verify Docker image
        run: docker run --rm kruzeapp:${{ github.sha }} node -e "console.log('OK')"
```

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
