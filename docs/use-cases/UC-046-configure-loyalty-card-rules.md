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
- The loyalty card rules are a section of the system settings (see UC-015).
- Until the admin changes them, the defaults apply: feature switched off, 10 euro per stamp, 10 stamps per full card, empty reward choice list.

## Main Flow
1. The admin opens the loyalty card rules in the system settings (see UC-015).
2. The system shows the current rules: whether the loyalty card feature is switched on, the euro amount per stamp, the number of stamps per full card, and the reward choice list with, for each product, its name and whether it is currently offered (active) or not (inactive or removed from the catalogue).
3. The admin indicates they want to change the loyalty card rules.
4. The system asks for the euro amount per stamp (applied to the product total including VAT, excluding shipping costs, after discounts; see UC-043 BR-3) and the number of stamps per full card.
5. The admin provides the values.
6. The system verifies the values.
7. The system asks the admin to confirm the change. If the number of stamps per full card changes, the system states that the change applies immediately to all customer cards, so customers may suddenly have, or no longer have, a full card.
8. The admin confirms. If the admin does not confirm, nothing changes and the use case ends.
9. The system records the values and applies them.
10. The system shows the updated rules.

## Alternative Flows
- **AF-1: Add a Product to the Reward Choice List** — At step 3, instead of changing the values:
  1. The admin indicates they want to add a product to the reward choice list.
  2. The system shows the active products that are not yet on the list, each with its name.
  3. The admin selects a product.
  4. The system adds the product to the list. The flow continues at step 10.
- **AF-2: Remove a Product from the Reward Choice List** — At step 3, instead of changing the values:
  1. The admin selects a product on the list and indicates they want to remove it.
  2. The system asks for confirmation.
  3. The admin confirms. If the admin does not confirm, nothing changes and the use case ends.
  4. The system removes the product from the list. If the list is now empty, the system states that no reward will be offered until a product is added. The flow continues at step 10.
- **AF-3: Switch the Loyalty Card Feature On or Off** — At step 3, instead of changing the values:
  1. The admin indicates they want to switch the loyalty card feature on or off.
  2. The system states the effect (when off: no stamps are earned, no rewards are offered, and balances are preserved) and asks for confirmation.
  3. The admin confirms. If the admin does not confirm, nothing changes and the use case ends.
  4. The system records the new status. The flow continues at step 10.

## Exception Flows
- **EF-1: Invalid Values** — At step 6, the euro amount per stamp or the number of stamps per full card is not within the allowed values (BR-1, BR-2). The system informs the admin which value is invalid and records nothing. The flow returns to step 4.

## Postconditions
- The feature status, the euro amount per stamp, the stamps per full card, and the reward choice list are recorded.
- A changed number of stamps per full card applies immediately to all customer cards; existing balances are unchanged, but whether a card is full is judged against the new number.
- A changed euro amount per stamp applies to orders paid after the change; stamps from past orders are not recalculated (see UC-043 BR-5).
- A listed product that becomes inactive or is removed from the catalogue stays on the list but is not offered while it is inactive or removed.
- When the feature is switched off, no stamps are earned (see UC-043) and no rewards are offered (see UC-045), while balances are preserved.

## Business Rules
- **BR-1:** The euro amount per stamp must be a positive amount of at most 500 euro, with at most two decimals.
- **BR-2:** The number of stamps per full card must be a whole number from 1 to 100.
- **BR-3:** Only active products (enabled in the webshop) can be added to the reward choice list.
- **BR-4:** A product can appear on the reward choice list only once.
- **BR-5:** Changing the number of stamps per full card, removing a product from the list, and switching the feature on or off require explicit confirmation by the admin.
- **BR-6:** The feature can be switched on while the reward choice list is empty; no reward is offered until the list contains an active product.

## Open Questions
- **OQ-1:** The defaults on first use (feature off, 10 euro per stamp, 10 stamps per full card, empty list) are proposed and are to be confirmed.
- **OQ-2:** The upper bounds in BR-1 (500 euro) and BR-2 (100 stamps) are proposed and are to be confirmed.

## Implementation Notes
- The rule values and the feature status are expected to be system parameters comparable to the free shipping threshold in UC-015 (parameter table, `parameterTable` in `shared/schema.ts`); the reward choice list needs its own storage as it references products.
- The list entries must survive a product being deactivated or removed from the catalogue (no automatic removal from the list).
- A reward already reserved by a pending payment keeps the number of stamps that applied when payment was started (see UC-045 BR-7).
- The existing `loyalty` table is replaced by a new loyalty card model; no data migration.
- Out of scope: generating physical card numbers (done by a script outside the system UI), and viewing or blocking customer cards.

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
