### Story 9.2.3: View Loyalty Card and Stamp History
**As a** registered customer
**I want** to see my loyalty card with its stamps and the orders that earned or used them in my account
**So that** I know how close I am to a free product

**References:** UC-047 (Main Flow 1-4, AF-2, EF-1, BR-1, BR-2, PG-1), UC-026 (account section, EF-2), UC-043 (BR-3, Postconditions)

**Priority:** Should (MoSCoW) | **Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] The account page has a loyalty card section next to Profile, Orders, and Top products (UC-047 step 1)
- [ ] The section shows the digital card number, a QR code that encodes the card number, the current number of stamps, the number of stamps still needed, and whether the card is full (UC-047 step 2)
- [ ] The stamps still needed is `max(0, N - balance)`; with balance 12 and N 10 it shows 0 and full (UC-047 BR-2)
- [ ] The linked physical card number is shown when one is linked, and not shown otherwise (UC-047 step 2)
- [ ] When no physical card is linked, the customer is offered a way to start linking one (entry point for UC-047 AF-1; the linking itself is delivered in Story 9.3.2)
- [ ] The stamp history lists, per order that changed the balance, the order number, the order date, the basis amount (without shipping), and the stamps earned (+) or deducted (-) (UC-047 step 4)
- [ ] The history is ordered newest first and can be browsed beyond 20 entries
- [ ] With no entries the history shows an empty-state text (UC-047 AF-2)
- [ ] A customer sees only their own card and history; the customer is derived from the session and no card or customer identifier is accepted from the client (UC-047 BR-1)
- [ ] A customer registered before this feature gets a digital card the first time the section is opened (UC-043 OQ-1 default)
- [ ] When the feature is switched off, the card and history remain visible with unchanged balance (UC-047 PG-1)
- [ ] An expired session leads to the login page with a return address back to the loyalty card section (UC-047 EF-1, UC-026 EF-2)
- [ ] Amounts use nl-BE format (`€ 26,40`) and dates are locale-aware

**Technical Implementation:**
- Backend:
  - `GET /api/account/loyalty-card` (`isAuthenticated`): resolves the customer through the session user email (same approach as `/api/account/profile`, `server/routes.ts` ~3245), returns `{ cardNumber, physicalCardNumber|null, stamps, stampsRequired, stampsStillNeeded, isFull, enabled }`
  - `GET /api/account/loyalty-card/history?page=` (`isAuthenticated`): entries joined with `webshop_order` (order number, date) in one SQL query
  - `loyaltyService.getCardView()` and `getHistory()`; the reserved stamps of Story 9.4.1 are not shown here
- Frontend: `client/src/pages/storefront/Account.tsx` - extend `TABS` and `TabKey` with `loyalty` (tab bar grid changes from 3 to 4 columns) and add a `LoyaltyTab` component using TanStack Query; QR code via `qrcode.react` (run `npm audit` before adding)
- Database: none (read-only, tables from Story 9.2.1)

**Dependencies:** Story 9.2.1 (cards and entries to show)
