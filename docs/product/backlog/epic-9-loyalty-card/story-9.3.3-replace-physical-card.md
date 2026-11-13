### Story 9.3.3: Replace a Linked Physical Card
**As a** registered customer who lost or exchanged a printed card
**I want** to replace my linked physical card with another one
**So that** my new card works and the old one can no longer be used

**References:** UC-044 (AF-1, EF-3, EF-4, BR-3, BR-4, BR-7)

**Priority:** Could (MoSCoW) | **Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] When a physical card is already linked, the link button reads "Replace card" and first shows a confirmation that the current card will become invalid (UC-044 AF-1, BR-4)
- [ ] If the customer does not confirm, nothing changes, the dialog closes, and the linked card stays as it is
- [ ] The server rejects a replacement without `confirmReplace: true` with 409 `CONFIRMATION_REQUIRED`
- [ ] After confirmation the same card number and code checks, attempt limits, and failure counting as Story 9.3.2 apply
- [ ] On success the new card is linked first and then the previous card gets status `invalid`, within one transaction, so there is never a moment with zero or two linked cards (UC-044 BR-3, BR-7)
- [ ] The tab then shows the new physical card number, the stamps are unchanged
- [ ] The invalidated card cannot be linked again by anyone (it fails like EF-3)
- [ ] When the new card is not recognised, already linked, invalid, or its number is blocked, the currently linked card remains valid and linked (UC-044 EF-3, EF-4, BR-7)
- [ ] A customer cannot "replace" a card with the card that is already linked to themselves; this counts as an unusable card and the current card stays linked

**Technical Implementation:**
- Backend: extend `POST /api/account/loyalty-card/physical` with optional `confirmReplace: boolean`; `loyaltyService.linkPhysicalCard()` performs link new then invalidate old in one `db.transaction()`
- Frontend: confirmation step (AlertDialog with AlertTriangle) before the dialog of Story 9.3.2 when `physicalCardNumber` is set
- Database: none (status `invalid` already in `loyalty_card`)

**Dependencies:** Story 9.3.2
