# UC-033: View and Unlock Loyalty Badges

A loyalty member earns collectible badges by reaching milestones in their purchase behaviour, such as trying new product categories or reaching spending thresholds. Badges add a gamification layer that motivates continued engagement with KRUZE.

## Metadata
- **Domain:** Customer / Loyalty / Gamification
- **Primary Actor:** Loyalty User
- **Secondary Actors:** None
- **Priority:** Could
- **Status:** Draft (Future Feature)
- **Interface:** Loyalty App (Mobile/PWA)

## Preconditions
- Loyalty user has a verified and active account.
- Badge criteria are configured by the admin.

## Main Flow
1. The loyalty user opens the Badges section in the Loyalty App.
2. The system shows all available badges with their name, description, progress, and unlock criteria.
3. The system presents badges in a locked (grey) or unlocked (coloured) state based on the user's history.
4. As the loyalty user makes purchases and earns points, the system checks whether any badge criteria are met.
5. When the criteria are met (e.g., 10 purchases, first bag of single origin), the system unlocks the badge.
6. The loyalty user receives a notification about the newly unlocked badge.
7. The system displays the unlocked badge prominently in the user's profile.

## Alternative Flows
- **AF-1: Badge Progress** — The loyalty user views their partial progress toward a locked badge (e.g., "7 of 10 purchases").
- **AF-2: Share Badge** — The loyalty user shares an unlocked badge on social media.

## Exception Flows
- **EF-1: No Badges Available** — The system shows an empty state with an encouraging message.

## Postconditions
- Badge status is updated to reflect the user's latest activity.
- Unlocked badges are permanently associated with the user's profile.

## Business Rules
- **BR-1:** Badges are unlocked based on configurable criteria (purchase count, product types tried, total spend, etc.).
- **BR-2:** Once unlocked, badges are permanent and cannot be revoked.
- **BR-3:** Badge progress is derived automatically from purchase history.
- **BR-4:** Badges serve as gamification incentives and carry no monetary value.

## Implemented By
- Status: **Not yet implemented** — planned future feature
