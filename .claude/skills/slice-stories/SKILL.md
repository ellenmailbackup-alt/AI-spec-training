---
name: slice-stories
description: Slice a use case into INVEST-format user stories for the product backlog. Use when a use case is approved and needs to be broken into deliverable stories.
user-invocable: true
argument-hint: "[UC-NNN or feature description]"
allowed-tools: Read, Grep, Glob, Write, Edit
agent: requirements
---

Slice `$ARGUMENTS` into INVEST-format user stories and add them to the backlog.

## Step-by-Step Procedure

### Step 0: Read shared references
Read the following before starting:
- `.claude/skills/_shared/references/use-case-30-principles.md`
- `.claude/skills/_shared/references/documentation-structure.md`

### Step 1: Read the source material
- If `$ARGUMENTS` is a UC-NNN, read the use case from `docs/use-cases/`
- If `$ARGUMENTS` is a description, treat it as a feature request
- Read `docs/product/backlog/INDEX.md` to understand existing epic/story numbering
- Browse `docs/product/backlog/epic-N-*/` folders to understand the file format

### Step 2: Clarification Phase

**Before writing any stories**, gather missing information. Skip questions already answered.

#### Mandatory
1. **Priority**: What is the priority? (Must / Should / Could — or deadline?)
2. **Interfaces affected**: Which parts of the system? (Admin Dashboard, POS Terminal, Storefront, multiple?)

#### Enrichment — ask if not clear
3. **Granularity**: One story or multiple smaller, independently deliverable stories?
4. **Dependencies**: Existing stories this depends on, or that will depend on this?
5. **Technical constraints**: Known constraints for acceptance criteria?
6. **Sales channels**: Does this affect specific channels differently? (B2B vs B2C vs Webshop vs Boeren en Buren)

### Step 3: Confirm story structure

Show the user **proposed story titles only** (no full content yet) and confirm before writing.

Example:
> "Based on your input, I'd break this into 3 stories:
> - Story X.Y.1: Apply cart-level discount at POS
> - Story X.Y.2: Display discount line on printed receipt
> - Story X.Y.3: Report discount amounts in daily sales summary
>
> Does this structure look right, or should I combine/split any of these?"

Only write full stories after the user confirms.

### Step 4: Write the stories

Create individual story files in the appropriate epic folder under `docs/product/backlog/`. Update the epic's `epic.md` story table and `INDEX.md` if a new epic is created.

## Story File Format

Each story is a separate file: `docs/product/backlog/epic-N-name/story-N.N-short-name.md`

```markdown
### Story X.Y.Z: [Title]
**As a** [actor]
**I want** [capability]
**So that** [benefit]

**References:** UC-NNN

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**Technical Implementation:**
- Backend: [endpoints, services]
- Frontend: [components, pages]
- Database: [schema changes]

**Dependencies:** [Story X.Y.A, Story X.Y.B]
```

## Story Writing Rules

### INVEST Criteria
Every story must be:
- **I**ndependent — can be developed and delivered on its own
- **N**egotiable — details can be discussed
- **V**aluable — delivers value to a user or the business
- **E**stimable — small enough to estimate
- **S**mall — completable in one sprint
- **T**estable — has clear acceptance criteria

### Numbering Convention
- Read `docs/product/backlog/INDEX.md` and existing epic folders to determine the next available epic/story number
- Format: `X.Y.Z` where X = epic, Y = feature, Z = story

### Acceptance Criteria Rules
- Each criterion must be independently testable
- Use checkbox format: `- [ ] [Criterion]`
- Be specific — "user can see their order total" not "order display works"
- Include edge cases where relevant

### Technical Implementation
- List specific endpoints, services, and components (not vague descriptions)
- Reference the spec if one exists: `See SPEC-NNN`

### Traceability
- Every story MUST reference its source use case: `**References:** UC-NNN`
- Stories without a use case reference are not allowed

---

## Retrospective

After completing this task (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in this skill file:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
