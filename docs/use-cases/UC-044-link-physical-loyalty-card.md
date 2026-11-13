# UC-044: Link Physical Loyalty Card

A registered customer who owns a printed loyalty card links it to their webshop account, so the physical and digital card identify the same customer and share one stamp balance. This lets customers who received a printed card take part in the webshop stamp card.

## Metadata
- **Domain:** Customer / Storefront
- **Primary Actor:** Registered Customer
- **Secondary Actors:** None
- **Priority:** Should
- **Status:** Draft
- **Interface:** Storefront

## Preconditions
- The customer is registered and logged in (see UC-027).
- The customer has a digital loyalty card (see UC-043 BR-1).
- The customer holds a printed loyalty card showing a card number and carrying a secret verification code (for example under a scratch panel).

## Main Flow
1. The registered customer opens their loyalty card in their account (see UC-047) and indicates they want to link a physical card.
2. The system checks that the customer is not temporarily barred from trying (BR-5) and asks for the card number printed on the physical card and its secret verification code.
3. The registered customer enters the card number and the verification code.
4. The system checks that the card number is not temporarily blocked (BR-6), that it belongs to an issued physical card, that the verification code matches that card, and that the card is not yet linked to any customer and has not been made invalid.
5. The system links the physical card to the customer's existing loyalty card.
6. The system confirms that the physical card is linked and shows the loyalty card with the linked physical card number and the current stamps.

## Alternative Flows
- **AF-1: Replace a Linked Physical Card** — At step 1, the customer already has a physical card linked. The system asks the customer to confirm that the currently linked card will be replaced and will become invalid. If the customer confirms, the flow continues at step 2; at step 5 the system links the new card and only then invalidates the previously linked card; the flow then continues at step 6. If the customer does not confirm, the use case ends and the linked card stays as it is.

## Exception Flows
- **EF-1: Customer Temporarily Barred** — At step 2, the customer has reached the maximum number of failed attempts (BR-5). The system informs the customer that they must wait before trying again and does not ask for card details. The use case ends; the customer can start again once the waiting period has passed.
- **EF-2: Card Number or Verification Code Not Recognised** — At step 4, the entered card number does not match any issued physical card, or the verification code does not match that card. The system informs the customer that the combination is not recognised, without stating which of the two is wrong, counts the attempt as failed, and no link is made. The customer can enter the details again at step 3.
- **EF-3: Card Already Linked or Invalid** — At step 4, the card number and verification code match, but the card is already linked to another customer, or has been made invalid by a replacement. The system informs the customer that the card cannot be linked, counts the attempt as failed, and no link is made. The customer can enter other details at step 3. In a replacement (AF-1), the currently linked card remains valid.
- **EF-4: Card Number Temporarily Blocked** — At step 4, the entered card number has reached the maximum number of failed attempts across all customers (BR-6). The system informs the customer that the card cannot be linked at this time, without checking the verification code, and no link is made. The customer can enter other details at step 3. In a replacement (AF-1), the currently linked card remains valid.

## Postconditions
- The physical card is linked to the customer's loyalty card.
- The physical card and the digital card identify the same customer and share the same stamps.
- When a previous physical card was replaced, that card is invalid and cannot be linked again.

## Business Rules
- **BR-1:** A physical card can be linked to only one customer.
- **BR-2:** Only issued physical cards can be linked, and only when both the card number and the secret verification code match the same issued card.
- **BR-3:** A customer can have only one physical card linked. Linking a new card replaces the old one, which becomes invalid.
- **BR-4:** Replacing a linked physical card requires explicit confirmation by the customer.
- **BR-5:** After 5 failed attempts, the customer cannot try again for 15 minutes. Every failed attempt counts, including an attempt with a card that is already linked. The counter resets on a successful link or once the 15-minute waiting period has passed.
- **BR-6:** After 10 failed attempts on the same card number, summed across all customers, that card number cannot be linked by anyone for 60 minutes; the counter resets once that period has passed. This prevents bypassing BR-5 with multiple accounts.
- **BR-7:** The currently linked physical card stays valid until the new card has been linked successfully; a failed replacement changes nothing.
- **BR-8:** Linking a physical card remains possible while the loyalty card feature is switched off.

## Open Questions
- **OQ-1:** If a physical card carries stamps before it is linked (for example from a future POS use case), are those stamps added to the customer's balance at linking? (Out of scope today as POS stamps do not exist; to be decided in the future POS use case.)
- **OQ-2:** The per-card-number values in BR-6 (10 attempts, 60 minutes) are proposed defaults and are to be confirmed. A blocked card number also blocks its legitimate owner for that period.

## Implementation Notes
- Batches of physical card numbers, each with a secret verification code, are generated by a script outside the system UI. This is not an admin capability; the system must be able to recognise the issued numbers and verify the codes (how they get into the system is to be decided in the specification; codes should not be stored in readable form).
- The attempt limits and waiting periods are fixed system settings, not configurable by the admin.
- The verification code protects against claiming an unlinked card by guessing or reading its number only.
- Out of scope: viewing or blocking customer cards by the admin, POS use of the physical card (future use case).

## Implemented By
- Routes: Not yet implemented
- Services: Not yet implemented
- Components: Not yet implemented
- Storage: Not yet implemented
