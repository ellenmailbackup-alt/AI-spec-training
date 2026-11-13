# Use Case Writing Rules

All rules are mandatory. Violations will be caught by the quality checklist.

## Rule 1: One Use Case = One Capability
Each use case document covers **exactly one capability**. If a feature request contains multiple distinct capabilities (e.g., "SEO and analytics"), split them into separate use cases. A use case that tries to cover two unrelated flows is always wrong.

## Rule 2: Title = Verb + Noun from the Actor's Perspective
Use case titles MUST follow the pattern: **Verb + Noun**, written from the primary actor's perspective. The name should be non-technical and describe what the actor accomplishes.

**CORRECT:** "Browse Storefront Product Catalog", "Manage Shopping Cart", "Discover Storefront via Search Engines"
**FORBIDDEN:** "SEO Optimization and Google Analytics Integration", "Product CRUD Operations", "Stock Movement Service"

## Rule 3: Business Language Only — Never Technical
Never expose implementation details in flows, preconditions, postconditions, or business rules.

**FORBIDDEN:** "System creates the roast record in a database transaction", "System inserts a row into the stock_movements table", "System validates using Zod schema"
**CORRECT:** "The system records the roast information", "The system adjusts the inventory levels accordingly", "The system verifies the provided information is complete and valid"

## Rule 4: Abstract from the User Interface
Never reference buttons, dropdowns, tabs, modals, or other interface controls.

**FORBIDDEN:** "Admin clicks the 'Add Supplier' button", "System presents a modal dialog"
**CORRECT:** "The admin indicates they want to add a new supplier", "The system asks for the supplier details"

## Rule 5: Business Verbs — Not Technical Verbs

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

## Rule 6: Actors — People and External Systems Only
**Primary actors** are always people (roles). **Secondary actors** are external systems or persons only.

**FORBIDDEN as actors:** PostgreSQL, Google Cloud Storage, PDFKit, Redis, Drizzle ORM
**CORRECT secondary actors:** Payment Provider (e.g., Mollie), Email Service (e.g., Resend), Authentication Service (e.g., Supabase Auth)

## Rule 7: Main Flow — One Continuous Story
The main flow tells **one story from start to finish**. No subdivisions, no sub-headers, no labeled sections within the main flow.

## Rule 8: Short Description
Every use case MUST have a short description (1-2 sentences) immediately after the title, before Metadata.

## Rule 9: Technical Guidance — Separate Section
Implementation-relevant details go in a dedicated **"Implementation Notes"** section after Business Rules and before Implemented By.

## Rule 10: Step Phrasing
Every step clearly identifies WHO acts: "The admin ..." or "The system ...". Steps alternate between actor and system actions.

## Rule 11: Be Specific About Displayed Data
When a step says "the system shows a list" or "the system displays", enumerate exactly what fields or data points are shown. Never use vague terms like "basic statistics" or "relevant information". If a page shows summary cards separate from a data list, describe them as separate steps.

## Rule 12: Cross-Check All Schema Fields
Before finalizing the form field list in any "the system asks for" step, read the database schema AND the frontend form to ensure every captured field is listed. Missing fields are a common error.

## Rule 13: Confirmation Before Destructive Actions
Any flow that removes or permanently changes data must include an explicit confirmation step where the system asks the actor to confirm the action before proceeding.

## Rule 14: Scope Business Rules to This Use Case Only
Business rules must relate directly to the capability described in this use case. Rules about pricing logic, external integrations, or behaviors that belong to another use case should not be included — reference the other UC instead. Only create a business rule when there is an actual constraint, validation, or conditional logic — not for simple data capture (e.g., "birthday is stored" is not a business rule).

## Rule 15: Distinguish Independent Data Fields
When two fields appear related but are independently controlled (e.g., a classification flag and a pricing flag), describe them as separate items. Never collapse distinct fields into a single vague description.

## Rule 16: Exception Flows = Postcondition Cannot Be Achieved
An exception flow describes a scenario where the **postcondition cannot be achieved** — the actor fails to accomplish their goal. If the system can still fulfil the actor's intent (e.g., showing zero values when no data exists), that is **normal behaviour**, not an exception. Similarly, if the actor navigates to an item from a system-generated list, "item not found" is not a valid exception — the system just displayed it.

## Rule 17: Business Rules Must Be Validatable Constraints
A business rule is a constraint or condition that can be **validated and can result in an error or rejection**. Examples: "blend components must total 100%", "customers cannot be removed if they have sales". UI formatting (nl-BE locale, currency display), tab visibility logic, badge styling, and chart presentation are NOT business rules — they are **Presentation Guidelines**. General display rules (formatting, currency, weight units) belong in `docs/design/design_guidelines.md` and must not be repeated per use case.

## Rule 18: Presentation Guidelines Section
When a use case involves a detail/consultation page with page-specific display behaviour (conditional tabs, status indicators, chart styling), add a **Presentation Guidelines** section after Business Rules. Only include rules specific to this page — never repeat system-wide formatting rules from `docs/design/design_guidelines.md`.

## Rule 19: Alternative Flows Must Specify Branch and Rejoin Points
Every AF must state which main flow step it branches from and which step it rejoins (or state that it ends the use case). An AF without a clear branch point is likely not a valid alternative flow.

**CORRECT:** "AF-3: Cash Payment — At step 13, instead of banktransfer, the cashier pays cash. The system calculates change. The flow continues at step 14."
**FORBIDDEN:** "AF-3: Start New Transaction — After sale completion, the cashier starts a new transaction." (This is just the main flow ending — not an alternative.)

## Rule 20: Exception Flows Must Specify Detection Step
Every EF must state at which main flow or AF step the exception is detected. An EF without a step reference is ambiguous and harder to validate.

**CORRECT:** "EF-2: Empty Cart — At step 12, if the cart contains no items, the system prevents proceeding to payment."
**FORBIDDEN:** "EF-2: Empty Cart — The system prevents checkout when the cart is empty."

## Rule 21: Main Flow Uses One Variant — Alternatives Get AFs
When a main flow step has multiple variants (e.g., payment methods, notification channels), pick the most common or simplest variant for the main flow and describe the others as alternative flows. Never list all variants inline in the main flow.

**CORRECT:** Main flow step 13 describes banktransfer payment. AF-6 describes cash payment. AF-7 describes split payment.
**FORBIDDEN:** "Step 13: The cashier selects a payment method. For banktransfer... For cash... For split payment..."

## Rule 22: Exception Flows Cannot Describe Filtered-Out Conditions
If a precondition or an earlier main flow step already prevents a condition from occurring (e.g., upfront filtering removes unavailable products from a list), that condition is not a valid exception flow. EFs only describe failures that can actually happen at runtime.

## Rule 23: One Use Case = One Uninterruptible Flow
If the actor never pauses, saves, or leaves the process to continue later, the entire flow belongs in one use case. Two activities that always happen together in sequence should not be split into separate use cases. For example, browsing products and checking out at the POS is one continuous flow — the cashier never leaves mid-process — so it is one use case, not two.
