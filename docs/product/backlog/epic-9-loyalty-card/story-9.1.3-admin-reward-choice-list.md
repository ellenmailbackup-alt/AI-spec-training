### Story 9.1.3: Admin Manages the Reward Choice List
**As an** admin
**I want** to add products to and remove products from the reward choice list
**So that** I decide which free products customers can choose when they redeem a full card

**References:** UC-046 (Main Flow step 2, AF-1, AF-2, BR-3, BR-4, BR-5, Postconditions, Implementation Notes)

**Priority:** Should (MoSCoW) | **Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] The "Loyalty card" settings tab shows the reward choice list with, per product, its name and whether it is currently offered (active) or not (inactive, or removed from the catalogue) (UC-046 step 2)
- [ ] The default list is empty and shows the text that no reward is offered until a product is added
- [ ] "Add product" shows only products with `webshopEnabled = true` that are not yet on the list, each with its name (UC-046 AF-1 step 2, BR-3, BR-4)
- [ ] Selecting a product adds it to the list and the updated list is shown (UC-046 AF-1 steps 3-4)
- [ ] The server rejects adding an inactive product with 400 and adding a product already on the list with 409 (UC-046 BR-3, BR-4)
- [ ] Removing a product requires confirmation in an `AlertDialog`; cancelling leaves the list unchanged (UC-046 AF-2, BR-5)
- [ ] Removing the last product states that no reward will be offered until a product is added (UC-046 AF-2 step 4)
- [ ] A listed product that is set to `webshopEnabled = false` stays on the list and shows as inactive; it is not removed automatically (UC-046 Postconditions)
- [ ] A listed product that no longer exists in the catalogue stays on the list and shows as "removed" (name shown as unavailable); deleting a product is not blocked or cascaded by the list
- [ ] The endpoints are admin only; a non-admin receives 403

**Technical Implementation:**
- Backend:
  - `GET /api/settings/loyalty-rewards` (`isAdmin`): list entries LEFT JOINed with `products` (name, `webshopEnabled`, pack size) to derive `active`/`removed` in SQL
  - `GET /api/settings/loyalty-rewards/candidates` (`isAdmin`): products with `webshopEnabled = true` NOT IN the list (SQL filter, no in-memory filtering)
  - `POST /api/settings/loyalty-rewards` (`isAdmin`): body `{ productId: number }`
  - `DELETE /api/settings/loyalty-rewards/:productId` (`isAdmin`)
  - `loyaltyService.listRewards()`, `addReward()`, `removeReward()`; storage methods in `server/storage.ts`
- Frontend: `RewardChoiceListSettings` section inside the loyalty tab built in Story 9.1.2 (shadcn Table, Dialog for the product picker, AlertDialog with AlertTriangle for removal)
- Database: uses `loyalty_reward_product` from Story 9.1.1 (no foreign key to `products`)

**Dependencies:** Story 9.1.1, Story 9.1.2 (shares the settings tab)
