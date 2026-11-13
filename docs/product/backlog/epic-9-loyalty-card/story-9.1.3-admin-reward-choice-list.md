### Story 9.1.3: Admin Manages the Reward Choice List
**As an** admin
**I want** to add products to and remove products from the reward choice list
**So that** I decide which free products customers can choose when they redeem a full card

**References:** UC-046 (Main Flow step 2, AF-1, AF-2, BR-3, BR-4, BR-5, Postconditions, Implementation Notes)

**Priority:** Should (MoSCoW) | **Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] The loyalty card section of the system settings shows the reward choice list with, per product, its name and whether it is currently offered (active) or not (inactive, or removed from the catalogue) (UC-046 step 2)
- [ ] The default list is empty and states that no reward is offered until a product is added
- [ ] When adding, only webshop-enabled products that are not yet on the list are offered, each with its name (UC-046 AF-1 step 2, BR-3, BR-4)
- [ ] Choosing a product adds it to the list and the updated list is shown (UC-046 AF-1 steps 3-4)
- [ ] An inactive product, or a product already on the list, cannot be added, also not when the request does not come from the normal screen (UC-046 BR-3, BR-4)
- [ ] Removing a product requires confirmation; cancelling leaves the list unchanged (UC-046 AF-2, BR-5)
- [ ] Removing the last product states that no reward will be offered until a product is added (UC-046 AF-2 step 4)
- [ ] A listed product that becomes webshop-disabled stays on the list and shows as inactive; it is not removed automatically (UC-046 Postconditions)
- [ ] A listed product that no longer exists in the catalogue stays on the list and shows as removed (name shown as unavailable); deleting a product is not blocked by the list
- [ ] Only admins can read or change the list

**Technical Implementation:**
- Backend:
  - New table `loyalty_reward_product` (former Story 9.1.1 part): `id`, `product_id` integer unique not null (UC-046 BR-4), `creation_date`; no foreign key to `products`, so an entry survives a product being deactivated or removed; insert schema and select/insert types exported per `.claude/rules/database.md`
  - `GET /api/settings/loyalty-rewards` (`isAdmin`): entries LEFT JOINed with `products` (name, `webshopEnabled`, pack size) to derive `active`/`removed` in SQL
  - `GET /api/settings/loyalty-rewards/candidates` (`isAdmin`): products with `webshopEnabled = true` NOT IN the list (SQL filter, no in-memory filtering)
  - `POST /api/settings/loyalty-rewards` (`isAdmin`): body `{ productId: number }`; 400 for an inactive product, 409 for a duplicate
  - `DELETE /api/settings/loyalty-rewards/:productId` (`isAdmin`)
  - Non-admin requests receive 403
  - `loyaltyService.listRewards()`, `addReward()`, `removeReward()`; storage methods in `server/storage.ts`
- Frontend: `RewardChoiceListSettings` inside the loyalty tab built in Story 9.1.2 (shadcn Table, Dialog for the product picker, AlertDialog with AlertTriangle for removal)
- Database: migration via `npx drizzle-kit generate`, review the SQL before applying

**Dependencies:** Story 9.1.2 (shares the loyalty settings section and `loyaltyService`)
