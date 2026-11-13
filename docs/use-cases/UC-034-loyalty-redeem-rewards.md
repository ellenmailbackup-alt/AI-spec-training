# UC-034: Redeem Loyalty Rewards

A loyalty member exchanges accumulated points for a reward — such as a discount or a free product — and presents it during a purchase. This gives the loyalty programme tangible value and encourages members to keep their balance active.

## Metadata
- **Domain:** Customer / Loyalty / Sales
- **Primary Actor:** Loyalty User
- **Secondary Actors:** POS User / Cashier
- **Priority:** Could
- **Status:** Draft (Future Feature)
- **Interface:** Loyalty App (Mobile/PWA), POS

## Preconditions
- Loyalty user has sufficient points for at least one reward.
- Rewards catalogue is configured by the admin.

## Main Flow
1. The loyalty user opens the Rewards section in the Loyalty App.
2. The system shows the available rewards with their name, description, points required, and availability.
3. The loyalty user selects a reward to redeem.
4. The system confirms the user has sufficient points for the selected reward.
5. The system deducts the required points from the user's balance.
6. The system generates a reward voucher with a unique code.
7. The loyalty user presents the voucher at the POS or applies it during webshop checkout.
8. The POS user / cashier or the webshop validates the voucher and applies the reward to the transaction.

## Alternative Flows
- **AF-1: In-Store Redemption** — The loyalty user shows a reward QR code at the POS for instant redemption without manual entry.
- **AF-2: Online Redemption** — The loyalty user enters the reward code during webshop checkout.

## Exception Flows
- **EF-1: Insufficient Points** — The loyalty user does not have enough points. The system shows the shortfall and the points still needed.
- **EF-2: Expired Reward** — The reward voucher has passed its validity date. The system rejects the redemption.
- **EF-3: Already Redeemed** — The voucher has already been used. The system rejects the attempt.

## Postconditions
- Points are deducted from the loyalty balance.
- The reward is applied to the transaction (discount, free product, etc.).
- The redemption is recorded in the loyalty history.

## Business Rules
- **BR-1:** Rewards have a fixed point cost.
- **BR-2:** Reward vouchers have an expiration period.
- **BR-3:** Each voucher can only be redeemed once.
- **BR-4:** Rewards can be: percentage discount, fixed discount, free product, or free upgrade.
- **BR-5:** Redemption integrates with POS (UC-021) and webshop checkout (UC-025).

## Implemented By
- Status: **Not yet implemented** — planned future feature
