### Story 9.1.2: Admin Configures Loyalty Card Rules and Feature Switch
**As an** admin
**I want** to set the euro amount per stamp, the number of stamps per full card, and switch the loyalty card feature on or off in the system settings
**So that** I can tune the stamp card without developer involvement

**References:** UC-046 (Main Flow steps 1-10, AF-3, EF-1, BR-1, BR-2, BR-5, BR-6), UC-015 (system settings), UC-043 (BR-3, BR-5)

**Priority:** Should (MoSCoW) | **Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Settings has a "Loyalty card" tab showing the feature status (on/off), the euro amount per stamp, and the stamps per full card; on first use it shows off, 10 euro, 10 stamps (UC-046 Preconditions)
- [ ] The edit form accepts a euro amount greater than 0 and at most 500 with at most two decimals (UC-046 BR-1); 0, a negative amount, 500,01, and 10,123 are rejected
- [ ] The edit form accepts a whole number of stamps from 1 to 100 (UC-046 BR-2); 0, 101, and 7,5 are rejected
- [ ] On an invalid value the form names the invalid field, nothing is recorded, and the admin returns to the edit form (UC-046 EF-1); the server also rejects invalid input with 400 and a `code`, never trusting the client
- [ ] After valid input the admin must confirm in a dialog before anything is saved; cancelling leaves all values unchanged (UC-046 step 8)
- [ ] When the number of stamps per full card changes, the confirmation text states that the change applies immediately to all customer cards, so customers may suddenly have, or no longer have, a full card (UC-046 step 7); the server rejects a stamps-per-card change without `confirmStampsChange: true` (UC-046 BR-5)
- [ ] After a change of the stamps per full card, existing card balances (sum of stamp entries) are unchanged
- [ ] After a change of the euro amount per stamp, stamp entries of past orders are not recalculated; it applies to orders paid after the change (UC-046 Postconditions, UC-043 BR-5)
- [ ] The switch on/off asks for confirmation that states the effect (when off: no stamps are earned, no rewards are offered, balances are preserved) (UC-046 AF-3); cancelling leaves the status unchanged
- [ ] The feature can be switched on while the reward choice list is empty, with an informational note that no reward is offered until a product is added (UC-046 BR-6)
- [ ] The updated rules are shown after saving (UC-046 step 10)
- [ ] The endpoints are admin only; a non-admin receives 403

**Technical Implementation:**
- Backend (3-layer pattern, Zod on every write):
  - `GET /api/settings/loyalty-rules` (`isAdmin`): returns `loyaltyService.getRules()`
  - `PUT /api/settings/loyalty-rules` (`isAdmin`): body `{ euroPerStamp: string, stampsPerCard: number, confirmStampsChange?: boolean }`; Zod enforces BR-1/BR-2 (regex for two decimals); returns 409 `CONFIRMATION_REQUIRED` when `stampsPerCard` differs from the stored value and the flag is missing
  - `PUT /api/settings/loyalty-rules/enabled` (`isAdmin`): body `{ enabled: boolean, confirmed: true }`
  - `loyaltyService.updateRules()` and `setEnabled()` write via `parameterService.setParameter()` (`loyalty_euro_per_stamp`, `loyalty_stamps_per_card`, `loyalty_enabled`)
  - Routes: HTTP only, comparable to `/api/settings/shipping-params` (`server/routes.ts` ~1496)
- Frontend: add a `TabsTrigger value="loyalty"` and `TabsContent` in `client/src/pages/admin/Settings.tsx` rendering a new `LoyaltyRulesSettings` component (React Hook Form + Zod, TanStack Query, shadcn `AlertDialog` for confirmations, nl-BE number and currency formatting)
- Database: none (uses `parameter_table` and Story 9.1.1 defaults)

**Dependencies:** Story 9.1.1
