# UC-046: Configure Loyalty Card Rules

The admin sets how stamps are earned, how many stamps make a full loyalty card, which products customers can choose as their reward, and whether the loyalty card feature is switched on. This lets the business tune the stamp card without developer involvement.

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
2. The system shows the current rules: whether the loyalty card feature is switched on, the euro amount per stamp, the number of stamps per full card, and the reward choice list with, for each product, its name and whether it is currently offered (active) or not (inactive or removed from the catalogue).
3. The admin indicates they want to change the loyalty card rules.
4. The system asks for the euro amount per stamp and the number of stamps per full card.
5. The admin provides the values.
6. The system verifies the values.
7. The system asks the admin to confirm the change. If the number of stamps per full card changes, the system states that the change applies immediately to all customer cards, so customers may suddenly have, or no longer have, a full card.
8. The admin confirms.
9. The system records the values and applies them.
10. The system shows the updated rules and states which changes apply immediately and which apply to future orders only.

## Alternative Flows
- **AF-1: Add a Product to the Reward Choice List** — At step 3, instead of changing the values, the admin indicates they want to add a product to the reward choice list. The system asks which product. The admin selects an active product and confirms. The system adds it to the list. The flow continues at step 10.
- **AF-2: Remove a Product from the Reward Choice List** — At step 3, instead of changing the values, the admin selects a product on the list and indicates they want to remove it. The system asks for confirmation. The admin confirms. The system removes the product from the list; if the list is now empty, the system states that no reward will be offered until a product is added. The flow continues at step 10.
- **AF-3: Switch the Loyalty Card Feature On or Off** — At step 3, instead of changing the values, the admin indicates they want to switch the loyalty card feature on or off. The system states the effect (when off: no stamps are earned, no rewards are offered, and balances are preserved) and asks for confirmation. The admin confirms and the system records the new status. The flow continues at step 10.

## Exception Flows
- **EF-1: Invalid Values** — At step 6, the euro amount per stamp or the number of stamps per full card is not a valid positive value. The system informs the admin which value is invalid and records nothing. The flow returns to step 4.
- **EF-2: Product Already on the List** — At the product selection in AF-1, the selected product is already on the reward choice list. The system informs the admin and the list remains unchanged.
- **EF-3: Change Not Confirmed** — At step 7 (or the confirmation in AF-2 or AF-3), the admin does not confirm. The system records nothing and the use case ends.

## Postconditions
- The feature status, the euro amount per stamp, the stamps per full card, and the reward choice list are recorded.
- A changed number of stamps per full card applies immediately to all customer cards; a changed euro amount per stamp applies to orders placed after the change.
- When the feature is switched off, no stamps are earned and no rewards are offered, while balances are preserved.

## Business Rules
- **BR-1:** The euro amount per stamp must be a positive amount.
- **BR-2:** The number of stamps per full card must be a positive whole number.
- **BR-3:** Only active products can be added to the reward choice list.
- **BR-4:** A product can appear on the reward choice list only once.
- **BR-5:** A changed euro amount per stamp applies to future orders only; stamps already earned from past orders are not recalculated.
- **BR-6:** A changed number of stamps per full card applies immediately to all cards; existing stamp balances are not changed, but whether a card is full is judged against the new number. Changing it requires explicit confirmation by the admin. A reward already reserved by a pending payment keeps the number that applied when payment was started (see UC-045 BR-13).
- **BR-7:** The reward choice list may be empty. While it contains no active product, no reward is offered and customers' stamps remain on their cards (see UC-045).
- **BR-8:** A listed product that becomes inactive or is removed from the catalogue stays on the list but is not offered while it is inactive or removed.
- **BR-9:** While the loyalty card feature is switched off, no stamps are earned (see UC-043), no rewards are offered (see UC-045), and balances are preserved.
- **BR-10:** Removing a product from the list and switching the feature on or off require explicit confirmation by the admin.

## Implementation Notes
- The rule values and the feature status are expected to be system parameters comparable to the free shipping threshold in UC-015 (parameter table, `parameterTable` in `shared/schema.ts`); the reward choice list needs its own storage as it references products.
- The list entries must survive a product being deactivated or removed from the catalogue (no automatic removal from the list).
- The existing `loyalty` table is replaced by a new loyalty card model; no data migration.
- Explicitly out of scope: generating physical card numbers (done by a script outside the system UI), and viewing or blocking customer cards.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
