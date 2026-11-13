# Mike Cohn's User Story Principles

Every user story must be evaluated against all 14 principles below. A story that fails any principle should be flagged with a concrete suggestion for improvement.

## 1. Slice the Cake
Each story must be a **complete vertical slice** of functionality — touching all layers (UI, backend, database) needed to deliver the feature. A story that only covers "add a database column" or "create the API endpoint" is a task, not a story.

**Test:** Can a user actually use this feature end-to-end after this story is done?

## 2. Size the Story to the Horizon
Stories near the top of the backlog (next sprint) should be small and detailed. Stories further out can be larger and vaguer — they'll be refined later.

**Test:** Is the story appropriately sized for when it will be worked on?

## 3. Single User Role — End-Users Only
Each story focuses on **one specific end-user role**. Avoid "As a user" — be specific: "As a cashier", "As the admin", "As a webshop visitor". If two roles need the same capability differently, write separate stories.

**Never write stories from non-user perspectives.** "As a product owner...", "As a developer...", "As a stakeholder..." are invalid — these are team roles, not end-users of the system.

**Test:** Is the actor a specific, named end-user role (not generic "user", not a team/stakeholder role)?

## 4. Some Things Aren't Stories
Technical tasks, chores, and infrastructure work are NOT user stories. They don't have a user-facing "so that" benefit. If the "so that" clause is about the development team (e.g., "so that the code is cleaner"), it's a task, not a story.

**Test:** Does the "so that" clause describe a benefit to a real end-user or the business?

## 5. Customer Writes — Stories Are Conversation Starters
Stories should be written from the customer/user perspective. The language should be understandable by a non-technical stakeholder. A story is a **placeholder for a conversation**, not a complete specification — the use case provides the process view, and the spec provides the technical detail. Keep the story lightweight.

**Ron Jeffries' 3 C's:** Every story has three aspects:
- **Card** — the written story itself (keep it brief, it's a pointer)
- **Conversation** — the discussion that fleshes out the details
- **Confirmation** — the acceptance criteria that prove it's done

**Test:** Would the business owner understand this story without technical explanation? Is it a conversation starter rather than an over-specified mini-spec?

## 6. Purpose Focus
Every story must maintain focus on its purpose. Don't let implementation details or edge cases obscure the core intent.

**Test:** Can you state the story's purpose in one sentence?

## 7. Don't Number Story Cards (No Fixed Priority)
Story numbering should not imply fixed priority or execution order. Stories should be prioritizable independently.

**Test:** Could this story be moved up or down in the backlog without its number causing confusion?

## 8. Closed Stories
Stories must have clear **constraints and endpoints**. "Improve search" is open — when is it done? "Search returns results within 2 seconds for catalogs up to 500 products" is closed.

**Test:** Is there a clear definition of "done" with measurable/observable endpoints?

## 9. Minimal UI Details
Don't specify UI implementation in the story. Focus on what the user needs, not how the interface looks. UI details belong in design specs, not stories.

**Test:** Does the story avoid specifying buttons, layouts, modals, or specific UI controls?

## 10. No Conjunctions
A story with "and" or "or" joining two capabilities is usually two stories. Keep each story focused on one thing.

**Test:** Does the story describe exactly one capability without "and"/"or" joining distinct features?

## 11. INVEST Criteria
- **I**ndependent — can be developed and delivered without other stories
- **N**egotiable — implementation details can be discussed
- **V**aluable — delivers value to a user or the business
- **E**stimable — small and clear enough to estimate effort
- **S**mall — completable in one sprint
- **T**estable — has clear, verifiable acceptance criteria

## 12. Clarity and Simplicity
Use active voice. Provide the right level of detail — enough to understand, not so much that it constrains. Include non-functional requirements (performance, security) when relevant.

**Test:** Is the story clear on first reading without requiring additional explanation?

## 13. Regular Review and Adaptation
Stories should be reviewed and refined as understanding grows. Stale stories should be updated or removed.

**Test:** Does this story still reflect current understanding and priorities?

## 14. Balance Business and Technical Needs
Stories should serve business goals while being technically feasible. Pure technical stories should be reframed as business value or converted to tasks.

**Test:** Does the story balance what the business needs with what's technically practical?

## 15. Two Ways to Add Detail: Split or Sharpen
When a story needs more detail, there are two options:
- **Split** the story into multiple smaller stories (when it covers too much scope)
- **Add conditions of satisfaction** — enrich the acceptance criteria without splitting (when the scope is right but the "done" definition is vague)

Not every vague story needs splitting. Sometimes the story is the right size but just needs sharper acceptance criteria.

**Test:** If the story feels vague, is the fix to split it or to write better acceptance criteria?

---

## Story Splitting Patterns (Humanizing Work)

When reviewing stories for size, check whether the right splitting pattern was applied. A story that is too large should be split using one of these patterns — not arbitrarily.

### The Meta-Pattern
1. Find the core complexity
2. List all variations (business rules, user types, interfaces, data types)
3. Reduce to **one complete slice** through that complexity

### The 9 Patterns

| # | Pattern | Signal | Split by |
|---|---|---|---|
| 1 | **Workflow Steps** | Multi-step process | Simple end-to-end first, then add steps |
| 2 | **Operations (CRUD)** | "Manage X" | Separate operations (add, edit, remove) |
| 3 | **Business Rule Variations** | Same goal, different rules | One rule per story |
| 4 | **Variations in Data** | Complex data handling | Simple data first, add complexity |
| 5 | **Data Entry Methods** | Fancy UI needed | Simple input first, rich UI later |
| 6 | **Major Effort** | First impl carries most effort | First type + remaining types |
| 7 | **Simple/Complex** | Many edge cases | Simplest version + edge cases as separate stories |
| 8 | **Defer Performance** | Perf optimization dominates | "Make it work" + "Make it fast" |
| 9 | **Break Out a Spike** | Unknown implementation | Time-boxed investigation + implementation (last resort) |

### Evaluating Splits
When multiple patterns produce valid splits:
1. **Prefer the split that exposes low-value work** — so it can be deprioritized or thrown away
2. **Prefer the split that produces equally-sized stories** — more prioritization flexibility

### Splitting Anti-Patterns to Flag
- **Horizontal slicing** — split by layer (UI story, DB story) breaks Independent and Valuable
- **Tasks dressed as stories** — "As a developer..." phrasing doesn't make a task into a story
- **Splitting non-valuable work** — if the whole isn't valuable, the parts won't be either
- **Over-deferring performance** — calling slow work "done" accumulates debt
