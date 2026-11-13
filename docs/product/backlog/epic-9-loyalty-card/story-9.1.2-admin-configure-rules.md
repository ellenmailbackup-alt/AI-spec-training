### Story 9.1.2: Admin Configures Loyalty Card Rules
**As an** admin
**I want** to set the loyalty card rules (euro amount per stamp, stamps per full card, and whether the feature is on) in the system settings
**So that** I can tune the stamp card without developer involvement

**References:** UC-046 (Main Flow steps 1-10, AF-3, EF-1, BR-1, BR-2, BR-5, BR-6, Preconditions defaults, OQ-1, Implementation Notes), UC-015 (system settings), UC-043 (BR-3, BR-5)

**Priority:** Should (MoSCoW) | **Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] The loyalty card section of the system settings shows the feature status (on/off), the euro amount per stamp, and the stamps per full card
- [ ] When no rules have been stored yet, the rules are off, 10 euro per stamp, and 10 stamps per full card (UC-046 Preconditions); the same defaults apply wherever the rules are read by other features
- [ ] A euro amount greater than 0 and at most 500 with at most two decimals is accepted (UC-046 BR-1); 0, a negative amount, 500,01, and 10,123 are rejected
- [ ] A whole number of stamps from 1 to 100 is accepted (UC-046 BR-2); 0, 101, and 7,5 are rejected
- [ ] On an invalid value the admin is told which field is invalid, nothing is recorded, and the admin can correct the input (UC-046 EF-1); invalid input is also rejected when it does not come from the normal screen
- [ ] After valid input the admin must confirm before anything is saved; cancelling leaves all values unchanged (UC-046 step 8)
- [ ] When the number of stamps per full card changes, the confirmation states that the change applies immediately to all customer cards, so customers may suddenly have, or no longer have, a full card (UC-046 step 7); a change of stamps per full card is not saved without that confirmation (UC-046 BR-5)
- [ ] After a change of the stamps per full card, existing card balances are unchanged
- [ ] After a change of the euro amount per stamp, stamps of past orders are not recalculated; the new amount applies to orders paid after the change (UC-046 Postconditions, UC-043 BR-5)
- [ ] Switching the feature on or off asks for confirmation that states the effect (when off: no stamps are earned, no rewards are offered, balances are preserved) (UC-046 AF-3); cancelling leaves the status unchanged
- [ ] The feature can be switched on while the reward choice list is empty, with a note that no reward is offered until a product is added (UC-046 BR-6)
- [ ] The updated rules are shown after saving (UC-046 step 10)
- [ ] Only admins can read or change the rules

**Technical Implementation:**
- Backend (3-layer pattern, Zod on every write):
  - New `server/loyaltyService.ts` with `getRules()` returning `{ enabled, euroPerStamp, stampsPerCard }`; reads `loyalty_enabled`, `loyalty_euro_per_stamp`, `loyalty_stamps_per_card` through `parameterService.getParameter()` (same pattern as `free_shipping_threshold_incl_vat`, `server/routes.ts` ~1498) and parses boolean, number, integer; code fallbacks `{ enabled: false, euroPerStamp: 10, stampsPerCard: 10 }` when a parameter does not exist, no seed rows (this is the former Story 9.1.1 rule-defaults part)
  - `GET /api/settings/loyalty-rules` (`isAdmin`): returns `getRules()`
  - `PUT /api/settings/loyalty-rules` (`isAdmin`): body `{ euroPerStamp: string, stampsPerCard: number, confirmStampsChange?: boolean }`; Zod enforces BR-1/BR-2 (regex for two decimals); invalid input returns 400 with a `code`; returns 409 `CONFIRMATION_REQUIRED` when `stampsPerCard` differs from the stored value and the flag is missing
  - `PUT /api/settings/loyalty-rules/enabled` (`isAdmin`): body `{ enabled: boolean, confirmed: true }`
  - `loyaltyService.updateRules()` and `setEnabled()` write via `parameterService.setParameter()`
  - Non-admin requests receive 403
  - Routes: HTTP only, comparable to `/api/settings/shipping-params` (`server/routes.ts` ~1496)
- Frontend: add a `TabsTrigger value="loyalty"` and `TabsContent` in `client/src/pages/admin/Settings.tsx` rendering a new `LoyaltyRulesSettings` component (React Hook Form + Zod, TanStack Query, shadcn `AlertDialog` for confirmations, nl-BE number and currency formatting)
- Database: none (uses `parameter_table`)
- Unit tests: default rules, stored rules, bounds

**Definition of Done additions:**
- [ ] `docs/use-cases/INDEX.md` already marks UC-032 and UC-034 as superseded (by UC-043 and UC-045); no work required, only verify it stays correct

**Dependencies:** None
