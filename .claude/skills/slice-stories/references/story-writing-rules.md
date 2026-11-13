# Story Writing Rules

## Mike Cohn's User Story Principles

### 1. Slice the Cake
Each story must be a complete vertical slice of functionality — touching all layers (UI, backend, database) needed to deliver the feature. A story that only covers one layer (e.g., "add a database column") is a task, not a story.

### 2. Size the Story to the Horizon
Stories near the top of the backlog (next sprint) should be small and detailed. Stories further out can be larger — they'll be refined later.

### 3. Single User Role — End-Users Only
Each story focuses on one specific end-user role. Never use generic "user" — be specific: "cashier", "admin", "webshop visitor". If two roles need the same capability differently, write separate stories. Never write stories from non-user perspectives — "As a product owner...", "As a developer...", "As a stakeholder..." are invalid.

### 4. Some Things Aren't Stories
Technical tasks, chores, and infrastructure work are NOT user stories. If the "so that" clause benefits the development team rather than an end-user or the business, it's a task — track it separately.

### 5. Customer Writes — Stories Are Conversation Starters
Stories should be written from the customer/user perspective in language a non-technical stakeholder would understand. A story is a **placeholder for a conversation**, not a complete specification — the use case provides the process view, the spec provides the technical detail. Keep the story lightweight.

**Ron Jeffries' 3 C's:**
- **Card** — the written story (keep it brief, it's a pointer)
- **Conversation** — the discussion that fleshes out details
- **Confirmation** — the acceptance criteria that prove it's done

### 6. Purpose Focus
Every story must maintain focus on its purpose. Don't let implementation details or edge cases obscure the core intent.

### 7. Don't Number Story Cards (No Fixed Priority)
Story numbering must not imply fixed priority or execution order. Stories should be independently prioritizable.

### 8. Closed Stories
Stories must have clear constraints and endpoints. "Improve search" is open-ended. "Search returns results within 2 seconds for catalogs up to 500 products" is closed.

### 9. Minimal UI Details
Don't specify UI implementation (buttons, layouts, modals) in the story. Focus on what the user needs, not how the interface looks.

### 10. No Conjunctions
A story with "and" or "or" joining two distinct capabilities is usually two stories. Keep each story focused on exactly one thing.

### 11. INVEST Criteria
Every story must be:
- **I**ndependent — can be developed and delivered on its own
- **N**egotiable — details can be discussed
- **V**aluable — delivers value to a user or the business
- **E**stimable — small enough to estimate
- **S**mall — completable in one sprint
- **T**estable — has clear acceptance criteria

### 12. Clarity and Simplicity
Use active voice. Provide the right level of detail — enough to understand, not so much that it constrains. Include non-functional requirements (performance, security) when relevant.

### 13. Regular Review and Adaptation
Stories should be reviewed and refined as understanding grows. Stale stories should be updated or removed.

### 14. Balance Business and Technical Needs
Stories should serve business goals while being technically feasible. Pure technical stories should be reframed as business value or converted to tasks.

### 15. Two Ways to Add Detail: Split or Sharpen
When a story needs more detail, there are two options:
- **Split** into smaller stories (when scope is too broad)
- **Add conditions of satisfaction** — enrich acceptance criteria without splitting (when scope is right but "done" is vague)

Not every vague story needs splitting. Sometimes it just needs sharper acceptance criteria.

---

## Story Splitting Patterns

When a story is too large (aim for 6–10 stories per sprint), use these patterns to split it. Try multiple patterns and pick the best split.

### The Meta-Pattern: Find Complexity, Reduce Variations
1. Identify the core complexity (surprises, human preferences, external dependencies)
2. List all variations (business rules, user types, interfaces, data types)
3. Reduce to **one complete slice** through that complexity

Most splitting patterns below are instances of this thinking.

### Pattern 1: Workflow Steps
Split multi-step processes by building the simple end-to-end case first, then adding middle steps and special cases. Don't split one step at a time sequentially.

*Example: "Publish a news story" → "Publish directly" + "Publish with editor review" + "Publish with legal review"*

### Pattern 2: Operations (CRUD)
The word "manage" signals multiple operations. Split by operation.

*Example: "Manage my account" → "Sign up" + "Edit account settings" + "Cancel account"*

### Pattern 3: Business Rule Variations
Same goal but different business rules per variant → separate stories.

*Example: "Search with flexible dates" → "Search as N days between X and Y" + "Search as a weekend in month" + "Search as ± N days of date"*

### Pattern 4: Variations in Data
Start with simple data handling, add complexity in follow-up stories.

*Example: "Search by location" → "Search by country" + "Search by country, city, town, neighbourhood"*

### Pattern 5: Data Entry Methods
Build the simplest input first, add fancy UI later.

*Example: "Search by date" → "Search with simple date input" + "Search with calendar picker"*

### Pattern 6: Major Effort
When the first implementation carries most of the effort, split it from the easy additions.

*Example: "Pay with VISA, MC, Diners, Amex" → "Pay with one card type" + "Pay with all four types"*

### Pattern 7: Simple/Complex
Extract the simplest viable version, push edge cases and options to separate stories.

*Example: "Search for flights" → "Search (simple, direct)" + "Specify max stops" + "Include nearby airports" + "Use flexible dates"*

### Pattern 8: Defer Performance
Split "make it work" from "make it fast" when performance optimization dominates effort.

*Example: "Search for flights" → "Search (with loading indicator)" + "Search returns results in under 5 seconds"*

**Warning:** Don't accumulate performance debt by calling slow work "done" indefinitely.

### Pattern 9: Break Out a Spike
When implementation is poorly understood, time-box investigation before building. **Use as last resort** after trying other patterns.

*Example: "Implement payment processing" → "Investigate payment providers (time-boxed)" + "Implement payment processing"*

### Choosing Between Splits
When multiple patterns produce valid splits:
1. **Prefer the split that lets you deprioritize or throw away a story** — exposes low-value work early (80/20 rule)
2. **Prefer the split that produces more equally-sized stories** — gives more prioritization flexibility

### Splitting Anti-Patterns
- **Horizontal slicing** — splitting by layer (one story for UI, one for DB) breaks Independent and Valuable
- **Tasks as stories** — "As a developer, I want a DB diagram" is still a task regardless of phrasing
- **Splitting non-valuable work** — if the whole isn't valuable, the parts won't be either

---

## Numbering Convention
- Read `docs/product/backlog/INDEX.md` and existing epic folders to determine the next available number
- Format: `X.Y.Z` where X = epic, Y = feature, Z = story

## Acceptance Criteria Rules
- Each criterion must be independently testable
- Use checkbox format: `- [ ] [Criterion]`
- Be specific — "user can see their order total" not "order display works"
- Include edge cases where relevant
- Criteria must define clear pass/fail — no ambiguity

## Technical Implementation
- List specific endpoints, services, and components (not vague descriptions)
- Reference the spec if one exists: `See SPEC-NNN`

## Traceability
- Every story MUST reference its source use case: `**References:** UC-NNN`
- Stories without a use case reference are not allowed
