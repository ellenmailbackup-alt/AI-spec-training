### Story 9.2.2: Card-Full Email
**As a** registered customer
**I want** to receive an email when my loyalty card becomes full through a purchase
**So that** I know I can redeem my free product at my next checkout

**References:** UC-043 (AF-2, BR-8, Postconditions)

**Priority:** Could (MoSCoW) | **Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] When a paid order makes the balance reach or exceed N (stamps per full card) while the balance before the order was below N, one email is sent to the customer stating that the card is full and the reward can be redeemed (UC-043 AF-2)
- [ ] The email is sent only on the transition to full: an order that adds stamps to an already full card sends no email (UC-043 BR-8)
- [ ] An order that earns several stamps sends one email, not one per stamp (UC-043 BR-8)
- [ ] After a redemption drops the card below N and a later paid order makes it full again, a new email is sent (once per transition)
- [ ] An order that earns 0 stamps sends no email
- [ ] The email is sent only after the stamps have been stored; a failing email send does not fail the webhook or remove stamps (non-critical, same as `sendCustomerConfirmation` in `completeSale()`), and the log contains no email address
- [ ] A duplicate webhook for the same order does not send a second email
- [ ] The email is sent in Dutch like the existing order mails and is plain text with the current stamps and N

**Technical Implementation:**
- Backend: `loyaltyService.awardStampsForOrder()` (Story 9.2.1) returns `{ stampsEarned, becameFull, balance }`; `checkoutService.completeSale()` sends the mail outside the transaction via `getResendClient()` in a new private method `sendCardFullEmail()` (modelled on `sendCustomerConfirmation`)
- Frontend: none
- Database: none; transition detection compares balance before and after inside the awarding transaction using N in force at that moment

**Dependencies:** Story 9.2.1
