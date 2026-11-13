# UC-046: Configure Loyalty Card Rules

The admin sets how stamps are earned, how many stamps make a full loyalty card, and which products customers can choose as their reward. This lets the business tune the stamp card without developer involvement.

## Metadata
- **Domain:** Customer / Operations
- **Primary Actor:** Admin
- **Secondary Actors:** None
- **Priority:** Should
- **Status:** Draft
- **Interface:** Admin Dashboard

## Preconditions
- The admin is authenticated and has admin privileges.

## Main Flow
1. The admin requests the loyalty card rules.
2. The system shows the current rules: the euro amount per stamp, the number of stamps per full card, and the reward choice list with, for each product, its name and availability.
3. The admin indicates they want to change the loyalty card rules.
4. The system asks for the euro amount per stamp and the number of stamps per full card.
5. The admin provides the values and confirms.
6. The system verifies the values and records them.
7. The system shows the updated rules and states that the change applies to future orders only.

## Alternative Flows
- **AF-1: Add a Product to the Reward Choice List** — At step 3, instead of changing the values, the admin indicates they want to add a product to the reward choice list. The system asks which product. The admin selects an active product and confirms. The system adds it to the list. The flow continues at step 7.
- **AF-2: Remove a Product from the Reward Choice List** — At step 3, instead of changing the values, the admin selects a product on the list and indicates they want to remove it. The system asks for confirmation. The admin confirms. The system removes the product from the list. The flow continues at step 7.

## Exception Flows
- **EF-1: Invalid Values** — At step 6, the euro amount per stamp or the number of stamps per full card is not a valid positive value. The system informs the admin which value is invalid and records nothing. The flow returns to step 4.
- **EF-2: Product Already on the List** — At step 2 of AF-1, the selected product is already on the reward choice list. The system informs the admin and the list remains unchanged.

## Postconditions
- The euro amount per stamp, the stamps per full card, and the reward choice list are recorded.
- The new rules apply to orders placed after the change.

## Business Rules
- **BR-1:** The euro amount per stamp must be a positive amount.
- **BR-2:** The number of stamps per full card must be a positive whole number.
- **BR-3:** Only active products can be added to the reward choice list.
- **BR-4:** A product can appear on the reward choice list only once.
- **BR-5:** Changes to the rules apply to future orders only; stamps already earned from past orders are not recalculated.
- **BR-6:** The reward is offered to customers only when the choice list contains at least one available product (see UC-045).

## Open Questions
- **OQ-1:** Do changes to the stamps per full card affect stamps already on customers' cards? For example, if the full card is lowered from 10 to 8 stamps, do customers with 9 stamps immediately have a full card? Is the reverse (raising N) allowed when customers already have a full card?
- **OQ-2:** Should the system prevent removing the last product from the choice list, or is an empty list allowed (reward then simply not offered)?
- **OQ-3:** What happens to a product on the list that later becomes inactive or is removed from the catalogue: is it skipped automatically or flagged to the admin?
- **OQ-4:** Is the loyalty card feature switched on and off through these rules (for example launching later)? Not part of the agreed scope.

## Implementation Notes
- The rule values are expected to be system parameters comparable to the free shipping threshold in UC-015 (parameter table, `parameterTable` in `shared/schema.ts`); the reward choice list needs its own storage as it references products.
- The existing `loyalty` table is replaced by a new loyalty card model; no data migration.
- Explicitly out of scope: generating physical card numbers (done by a script outside the system UI), and viewing or blocking customer cards.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
