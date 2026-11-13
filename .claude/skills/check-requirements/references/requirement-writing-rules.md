# The 7 Rules for Writing Better Requirements

Every requirement sentence must pass all 7 rules. A sentence that fails a rule is flagged and rewritten.

---

## 1. Use Simple, Direct, Active Sentences
A requirement names who does what. Avoid passive voice, nested clauses, and long sentences.

**Detect:** passive constructions ("is created", "will be shown", "gets sent"), sentences over ~25 words, multiple subordinate clauses.

| ❌ Bad | ✅ Good |
|---|---|
| An invoice is generated when the sale has been completed by the cashier. | The cashier generates an invoice for a completed sale. |

**Test:** Is there one subject, one active verb, one object?

## 2. Mention the Type of User
Every requirement names a specific actor. Generic actors hide who needs the behaviour.

**Detect:** "user", "someone", "people", "they", missing actor, "the system" as the only actor of a user-facing requirement.

| ❌ Bad | ✅ Good |
|---|---|
| The user can export the sales report. | The accountant exports the monthly sales report. |

**Test:** Can you name the role (admin, cashier, webshop visitor, B2B customer, roaster, accountant)?

## 3. Specify a Single Desired Result
One requirement = one observable, verifiable outcome.

**Detect:** multiple outcomes, open-ended results ("handles", "manages", "supports", "deals with"), no observable result.

| ❌ Bad | ✅ Good |
|---|---|
| The admin manages stock. | The admin records a stock correction for a product. |

**Test:** Can you write exactly one pass/fail test for it?

## 4. Don't Use Conjunctions (and / or / also)
A conjunction usually means two requirements are merged. Split them.

**Detect:** "and", "or", "also", "as well as", "and/or", "&", "plus", "both … and", "either … or", comma-separated lists of actions.

| ❌ Bad | ✅ Good |
|---|---|
| The cashier can register a sale and print a receipt. | R1: The cashier registers a sale. R2: The cashier prints a receipt for a registered sale. |

**Exceptions:** proper names and fixed domain terms ("Coffee & Tea", "Boeren en Buren"), a list of data fields belonging to one result ("name and address" on one form) — flag as Suggestion only.

## 5. Avoid But / Except / Unless
Exceptions inside a requirement hide a second rule. Write the exception as its own requirement.

**Detect:** "but", "except", "unless", "however", "other than", "apart from", "with the exception of", "if not".

| ❌ Bad | ✅ Good |
|---|---|
| B2B customers pay within 15 days, unless they have a custom agreement. | R1: A B2B customer without a custom agreement pays within 15 days. R2: A B2B customer with a custom agreement pays within the agreed term. |

## 6. Don't Use Vague Terms
Vague terms cannot be tested. Replace them with measurable values.

**Detect:** fast, quick, slow, optimal, efficient, user-friendly, easy, simple, intuitive, flexible, robust, scalable, appropriate, adequate, sufficient, large, small, many, few, several, some, approximately, as soon as possible, minimal, maximal, modern, seamless, etc., and so on, TBD-like wording.

| ❌ Bad | ✅ Good |
|---|---|
| The product page loads fast. | The product page loads within 2 seconds for a webshop visitor on a 4G connection. |

If the measurable value is unknown, write `[TBD: value]` and list it under Open Questions.

## 7. Avoid Possibility Verbs (may / might / should)
Possibility verbs make a requirement optional and untestable. Use a definite verb (present tense or "must").

**Detect:** may, might, should, could, can (when expressing possibility), would, possibly, ideally, preferably, if possible, where applicable.

| ❌ Bad | ✅ Good |
|---|---|
| The system should send a confirmation email. | The system sends a confirmation email to the webshop visitor after checkout. |

---

## Severity

| Severity | When |
|---|---|
| **Critical** | Rule 3, 4 or 5 violated (requirement actually contains multiple requirements or hidden exceptions), or rule 6/7 makes the requirement untestable |
| **Warning** | Rule 1 or 2 violated (ambiguous actor, passive voice) |
| **Suggestion** | Borderline cases (field lists with "and", long but clear sentences) |
