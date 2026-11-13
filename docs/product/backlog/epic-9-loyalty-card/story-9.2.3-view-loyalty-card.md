### Story 9.2.3: View Loyalty Card and Stamp History
**As a** registered customer
**I want** to see my loyalty card, my stamps, and which orders earned or used stamps in my account
**So that** I know how close I am to a free product

**References:** UC-047 (Main Flow 1-4, AF-2, EF-1, BR-1, BR-2, PG-1), UC-026 (account section, EF-2), UC-043 (BR-3, Postconditions)

**Priority:** Should (MoSCoW) | **Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] The storefront account page has a "Loyalty card" tab next to Profile, Orders, and Top products (UC-047 step 1)
- [ ] The tab shows the digital card number, a QR code that encodes the card number, the current number of stamps, the number of stamps still needed, and whether the card is full (UC-047 step 2)
- [ ] The stamps still needed is `max(0, N - balance)`; with balance 12 and N 10 it shows 0 and "full" (UC-047 BR-2)
- [ ] The linked physical card number is shown when one is linked, and not shown otherwise (UC-047 step 2)
- [ ] A button to link a physical card is present when none is linked (entry point for UC-047 AF-1; the dialog is delivered in Story 9.3.2)
- [ ] The stamp history lists, per order that changed the balance, the order number, the order date, the basis amount (without shipping), and the stamps earned (+) or deducted (-) (UC-047 step 4)
- [ ] The history is ordered newest first and is paginated or scrollable beyond 20 entries
- [ ] With no entries the history shows an empty state text (UC-047 AF-2)
- [ ] A customer sees only their own card and history; the customer is derived from the session, no card or customer id is accepted from the client (UC-047 BR-1)
- [ ] A customer registered before this feature gets a digital card on first opening the tab (UC-043 OQ-1 default)
- [ ] When the feature is switched off, the card and history remain visible with unchanged balance (UC-047 PG-1)
- [ ] An expired session redirects to the login page with a return address back to the loyalty tab (UC-047 EF-1, UC-026 EF-2)
- [ ] Amounts use nl-BE format (`€ 26,40`) and dates are locale-aware

**Technical Implementation:**
- Backend:
  - `GET /api/account/loyalty-card` (`isAuthenticated`): resolves the customer through the session user email (same approach as `/api/account/profile`, `server/routes.ts` ~3245), returns `{ cardNumber, physicalCardNumber|null, stamps, stampsRequired, stampsStillNeeded, isFull, enabled }`
  - `GET /api/account/loyalty-card/history?page=` (`isAuthenticated`): entries joined with `webshop_order` (order number, date) in one SQL query
  - `loyaltyService.getCardView()` and `getHistory()`; the reserved stamps of Story 9.4.1 are not shown here
- Frontend: `client/src/pages/storefront/Account.tsx` - extend `TABS` and `TabKey` with `loyalty` (tab bar grid changes from 3 to 4 columns) and add a `LoyaltyTab` component using TanStack Query; QR code via `qrcode.react` (run `npm audit` before adding)
- Database: none (read-only, tables from Story 9.1.1)

**Dependencies:** Story 9.1.1, Story 9.2.1 (cards and entries to show)
