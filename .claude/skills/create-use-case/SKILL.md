---
name: create-use-case
description: Create a use case document for a feature or system capability. Permanent documentation of what the system does and why.
user-invocable: true
argument-hint: "[feature-name]"
allowed-tools: Read, Grep, Glob, Write, Edit
agent: analyst
---

Create a use case document for `$ARGUMENTS`.

---

## Step 0 — Read Shared References
Read the following before starting:
- `.claude/skills/_shared/references/documentation-structure.md`

## Step 1 — Research the Feature

1. Search routes, services, and components related to `$ARGUMENTS`
2. Identify actors, preconditions, flows, business rules
3. If the feature maps to existing stories in `docs/product/backlog/`, note them

## Step 2 — Clarification Phase

**Before writing any use case document**, gather the information below. If the user's initial message already clearly answers a question, skip it — do not ask for information already provided. Ask all missing questions at once, not one at a time.

### Mandatory — cannot write without these

1. **Business problem**: What problem does this feature solve for the business or the user? (1–3 sentences)
2. **Primary actor**: Who uses this feature? What is their role? (e.g., admin, cashier, webshop visitor)
3. **Happy path**: Walk me through the main scenario step by step — what does the user do, and what does the system do in response?
4. **Out of scope**: What is explicitly NOT included in this feature? Never assume — always ask. (prevents silent scope decisions)

### Enrichment — ask if not clear from context

5. **Failure cases**: What can go wrong? How should the system react in each case?
6. **Business rules**: Are there constraints or conditions the system must enforce?
7. **External systems**: Does this feature interact with anything outside the app?
8. **Relationship to existing features**: Does this build on, extend, or replace something already in the system?

### Before writing — confirm understanding

After gathering answers, restate your understanding in 2–3 sentences covering the primary actor, the goal, and the key steps of the main flow. Give the user a chance to correct any misunderstanding before you write the document.

Example:
> "So I understand this as: a **cashier** at the POS can apply a percentage discount to the entire cart before completing a sale. The system recalculates all totals in real time, and the discount is recorded on the invoice. Discounts are not available on webshop orders. Is that correct?"

Only proceed to write the use case document after the user confirms.

## Step 3 — Write the Use Case Document

Create `docs/use-cases/UC-NNN-$ARGUMENTS.md` following the template below with ALL writing rules applied.

---

## Writing Rules (MANDATORY)

### Rule 1: One Use Case = One Capability
Each use case document covers **exactly one capability**. If a feature request contains multiple distinct capabilities (e.g., "SEO and analytics"), split them into separate use cases. A use case that tries to cover two unrelated flows is always wrong.

### Rule 2: Title = Verb + Noun from the Actor's Perspective
Use case titles MUST follow the pattern: **Verb + Noun**, written from the primary actor's perspective. The name should be non-technical and describe what the actor accomplishes.

**CORRECT:** "Browse Storefront Product Catalog", "Manage Shopping Cart", "Discover Storefront via Search Engines"
**FORBIDDEN:** "SEO Optimization and Google Analytics Integration", "Product CRUD Operations", "Stock Movement Service"

### Rule 3: Business Language Only — Never Technical
Never expose implementation details in flows, preconditions, postconditions, or business rules.

**FORBIDDEN:** "System creates the roast record in a database transaction", "System inserts a row into the stock_movements table", "System validates using Zod schema"
**CORRECT:** "The system records the roast information", "The system adjusts the inventory levels accordingly", "The system verifies the provided information is complete and valid"

### Rule 4: Abstract from the User Interface
Never reference buttons, dropdowns, tabs, modals, or other interface controls.

**FORBIDDEN:** "Admin clicks the 'Add Supplier' button", "System presents a modal dialog"
**CORRECT:** "The admin indicates they want to add a new supplier", "The system asks for the supplier details"

### Rule 5: Business Verbs — Not Technical Verbs

| FORBIDDEN | USE INSTEAD |
|-----------|-------------|
| Create | Add, Record, Register, Place |
| Delete | Remove, Cancel, Discard |
| Update | Change, Modify, Adjust, Correct |
| Insert | Add, Record |
| Query | Look up, Retrieve, Show |
| Fetch | Show, Display, Present |
| Execute | Perform, Carry out |
| Validate | Verify, Check |

### Rule 6: Actors — People and External Systems Only
**Primary actors** are always people (roles). **Secondary actors** are external systems or persons only.

**FORBIDDEN as actors:** PostgreSQL, Google Cloud Storage, PDFKit, Redis, Drizzle ORM
**CORRECT secondary actors:** Payment Provider (e.g., Mollie), Email Service (e.g., Resend), Authentication Service (e.g., Supabase Auth)

### Rule 7: Main Flow — One Continuous Story
The main flow tells **one story from start to finish**. No subdivisions, no sub-headers, no labeled sections within the main flow.

### Rule 8: Short Description
Every use case MUST have a short description (1-2 sentences) immediately after the title, before Metadata.

### Rule 9: Technical Guidance — Separate Section
Implementation-relevant details go in a dedicated **"Implementation Notes"** section after Business Rules and before Implemented By.

### Rule 10: Step Phrasing
Every step clearly identifies WHO acts: "The admin ..." or "The system ...". Steps alternate between actor and system actions.

### Rule 11: Be Specific About Displayed Data
When a step says "the system shows a list" or "the system displays", enumerate exactly what fields or data points are shown. Never use vague terms like "basic statistics" or "relevant information". If a page shows summary cards separate from a data list, describe them as separate steps.

### Rule 12: Cross-Check All Schema Fields
Before finalizing the form field list in any "the system asks for" step, read the database schema AND the frontend form to ensure every captured field is listed. Missing fields are a common error.

### Rule 13: Confirmation Before Destructive Actions
Any flow that removes or permanently changes data must include an explicit confirmation step where the system asks the actor to confirm the action before proceeding.

### Rule 14: Scope Business Rules to This Use Case Only
Business rules must relate directly to the capability described in this use case. Rules about pricing logic, external integrations, or behaviors that belong to another use case should not be included — reference the other UC instead. Only create a business rule when there is an actual constraint, validation, or conditional logic — not for simple data capture (e.g., "birthday is stored" is not a business rule).

### Rule 16: Exception Flows = Postcondition Cannot Be Achieved
An exception flow describes a scenario where the **postcondition cannot be achieved** — the actor fails to accomplish their goal. If the system can still fulfil the actor's intent (e.g., showing zero values when no data exists), that is **normal behaviour**, not an exception. Similarly, if the actor navigates to an item from a system-generated list, "item not found" is not a valid exception — the system just displayed it.

### Rule 17: Business Rules Must Be Validatable Constraints
A business rule is a constraint or condition that can be **validated and can result in an error or rejection**. Examples: "blend components must total 100%", "customers cannot be removed if they have sales". UI formatting (nl-BE locale, currency display), tab visibility logic, badge styling, and chart presentation are NOT business rules — they are **Presentation Guidelines**. General display rules (formatting, currency, weight units) belong in `docs/design/design_guidelines.md` and must not be repeated per use case.

### Rule 18: Presentation Guidelines Section
When a use case involves a detail/consultation page with page-specific display behaviour (conditional tabs, status indicators, chart styling), add a **Presentation Guidelines** section after Business Rules. Only include rules specific to this page — never repeat system-wide formatting rules from `docs/design/design_guidelines.md`.

### Rule 15: Distinguish Independent Data Fields
When two fields appear related but are independently controlled (e.g., a classification flag and a pricing flag), describe them as separate items. Never collapse distinct fields into a single vague description.

### Rule 19: Alternative Flows Must Specify Branch and Rejoin Points
Every AF must state which main flow step it branches from and which step it rejoins (or state that it ends the use case). An AF without a clear branch point is likely not a valid alternative flow.

**CORRECT:** "AF-3: Cash Payment — At step 13, instead of banktransfer, the cashier pays cash. The system calculates change. The flow continues at step 14."
**FORBIDDEN:** "AF-3: Start New Transaction — After sale completion, the cashier starts a new transaction." (This is just the main flow ending — not an alternative.)

### Rule 20: Exception Flows Must Specify Detection Step
Every EF must state at which main flow or AF step the exception is detected. An EF without a step reference is ambiguous and harder to validate.

**CORRECT:** "EF-2: Empty Cart — At step 12, if the cart contains no items, the system prevents proceeding to payment."
**FORBIDDEN:** "EF-2: Empty Cart — The system prevents checkout when the cart is empty."

### Rule 21: Main Flow Uses One Variant — Alternatives Get AFs
When a main flow step has multiple variants (e.g., payment methods, notification channels), pick the most common or simplest variant for the main flow and describe the others as alternative flows. Never list all variants inline in the main flow.

**CORRECT:** Main flow step 13 describes banktransfer payment. AF-6 describes cash payment. AF-7 describes split payment.
**FORBIDDEN:** "Step 13: The cashier selects a payment method. For banktransfer... For cash... For split payment..."

### Rule 22: Exception Flows Cannot Describe Filtered-Out Conditions
If a precondition or an earlier main flow step already prevents a condition from occurring (e.g., upfront filtering removes unavailable products from a list), that condition is not a valid exception flow. EFs only describe failures that can actually happen at runtime.

### Rule 23: One Use Case = One Uninterruptible Flow
If the actor never pauses, saves, or leaves the process to continue later, the entire flow belongs in one use case. Two activities that always happen together in sequence should not be split into separate use cases. For example, browsing products and checking out at the POS is one continuous flow — the cashier never leaves mid-process — so it is one use case, not two.

**Note:** The old Rule 19 was renumbered to Rule 23. Rules 19-22 are new additions.

---

## Use Case Template

```markdown
# UC-NNN: [Title]

[Short description — 1-2 sentences explaining what this use case covers and why it matters to the business.]

## Metadata
- **Domain:** [Sales | Inventory | Finance | Customer | Product | Operations | POS | Storefront]
- **Primary Actor:** [Single role: Admin | Cashier | Webshop Visitor | Registered Customer]
- **Secondary Actors:** [External systems or persons involved, if any]
- **Priority:** [Must | Should | Could]
- **Status:** [Draft | Reviewed | Approved]
- **Interface:** [Admin Dashboard | POS Terminal | Storefront | Loyalty App]

## Preconditions
- [What must be true before this use case starts]

## Main Flow
1. The [actor] ...
2. The system ...
3. The [actor] ...
...

## Alternative Flows
- **AF-1: [Name]** — [Description of variant, written in the same business language]

## Exception Flows
- **EF-1: [Name]** — [What happens when something goes wrong, from the user's perspective]

## Postconditions
- [What is true after successful completion, in business terms]

## Business Rules
- **BR-1:** [Validatable constraint that can cause an error or rejection — never UI/display logic]

## Presentation Guidelines
- **PG-1:** [Page-specific display rule — conditional visibility, status logic, chart styling. Omit this section if no page-specific rules exist. Never repeat general formatting rules from design_guidelines.md]

## Implementation Notes
- [Optional: technical guidance for developers — architecture patterns, performance notes, constraints]

## Implemented By
- Routes: [endpoint paths]
- Services: [service files]
- Components: [React components]
- Storage: [storage methods]
```

---

## Step 4 — Quality Checklist

Before saving, verify ALL of the following:

- [ ] **One capability** per use case — if covering two distinct flows, split into separate use cases
- [ ] **Title** follows Verb + Noun pattern from the actor's perspective (not technical)
- [ ] **Short description** present after title
- [ ] **No technical language** in flows, preconditions, postconditions, or business rules
- [ ] **No UI references** (buttons, dropdowns, modals, tabs, forms)
- [ ] **No infrastructure actors** (databases, libraries, storage services)
- [ ] **Business verbs** used (add/remove/change, not create/delete/update)
- [ ] **Main flow** reads as one continuous story with no sub-headers
- [ ] **Each step** clearly identifies who acts (actor or system)
- [ ] **Technical details** are in Implementation Notes section only
- [ ] **Exception flows** only describe scenarios where the postcondition cannot be achieved — not normal empty-state behaviour
- [ ] **Business rules** are validatable constraints only — no UI formatting, display logic, or presentation rules
- [ ] **Presentation Guidelines** used for page-specific display rules (if applicable) — general rules stay in design_guidelines.md
- [ ] **Implemented By** section has accurate, verified route paths, service files, and component names
- [ ] **Uninterruptible flow** check — if the actor never leaves mid-process, the entire flow is in one UC (not split across multiple)
- [ ] **No "Known Issues" section** — use cases describe what the system does, not what's broken. Bugs and tech debt are reported in review findings and tracked in `docs/product/ISSUES.md`
- [ ] **Every AF specifies branch and rejoin** — each AF states which main flow step it branches from and where it rejoins (or ends the UC)
- [ ] **Every EF specifies detection step** — each EF states at which step the exception is detected
- [ ] **No AFs that duplicate the main flow ending** — if behavior is already described in the final main flow steps, it's not an AF
- [ ] **No EFs for filtered-out conditions** — if preconditions or upfront filtering prevent a condition, it cannot be an EF
- [ ] **Main flow uses one variant per step** — multiple variants (e.g., payment methods) use AFs, not inline branching

---

## Step 5 — Retrospective

After completing the use case (or after a review session with the user), review the conversation for any corrections or feedback the user gave. If the user pointed out mistakes, missing patterns, or preferred approaches that are **not already captured** in the Writing Rules or Quality Checklist above:

1. List each lesson learned with a brief explanation of what was wrong and what the correct approach is.
2. Propose specific changes to this skill file (new rules, updated rules, or new checklist items).
3. Propose any user-specific preferences to save to memory (feedback type).

**Do not apply changes.** Present the proposals and wait for the user to approve before modifying anything.
