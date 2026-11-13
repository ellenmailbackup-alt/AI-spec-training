# UC-035: Participate in Challenges and View Content

A loyalty member engages with time-limited challenges to earn bonus points and explores educational content — daily tips, brewing guides, and product reviews — that deepens their connection with the KRUZE product range. This drives habitual app use beyond the moment of purchase.

## Metadata
- **Domain:** Customer / Loyalty / Gamification
- **Primary Actor:** Loyalty User
- **Secondary Actors:** None
- **Priority:** Could
- **Status:** Draft (Future Feature)
- **Interface:** Loyalty App (Mobile/PWA)

## Preconditions
- Loyalty user has a verified and active account.
- Challenges and content are configured by the admin.

## Main Flow
1. The loyalty user opens the Challenges section in the Loyalty App.
2. The system shows all active challenges, each with a name, description, goal, current progress, and the bonus points on offer.
3. The loyalty user selects a challenge and indicates they wish to participate.
4. The system records the enrolment and begins tracking the user's progress toward the challenge goal.
5. As the loyalty user completes qualifying purchases, the system updates the progress indicator.
6. When the goal is met (e.g., "Purchase 5 different single origins this month"), the system awards the bonus points to the user's balance.
7. The loyalty user receives a completion notification confirming the bonus points earned.

## Alternative Flows
- **AF-1: Challenge Expired Before Completion** — The challenge period ends before the goal is reached. The system shows the final partial progress but no reward is granted.
- **AF-2: View Daily Tips** — The loyalty user opens the Tips section. The system shows the daily coffee or tea tip covering brewing techniques, flavour profiles, or preparation methods. Content refreshes daily according to the admin-configured schedule.
- **AF-3: Access Brewing Guides** — The loyalty user opens the Brewing Guides section. The system shows step-by-step guides for methods such as pour-over, French press, espresso, AeroPress, and cold brew, each including recommended products and preparation tips.
- **AF-4: Submit a Product Review** — The loyalty user opens a product they have purchased and records a review with a star rating (1–5) and written comment. The system confirms the user has purchased the product, then stores the review pending moderation before it becomes publicly visible.

## Exception Flows
- **EF-1: No Active Challenges** — The system shows a "Check back soon for new challenges" message.
- **EF-2: Review Without Purchase** — The loyalty user attempts to review a product they have not bought. The system prevents submission and explains why.

## Postconditions
- Challenge completion adds bonus points to the user's loyalty balance.
- Submitted reviews are stored and queued for admin moderation.
- Educational content remains accessible for ongoing engagement.

## Business Rules
- **BR-1:** Challenges operate within a time-limited window (e.g., monthly).
- **BR-2:** Challenge progress is derived automatically from the user's purchase history.
- **BR-3:** Only verified purchasers may submit a review for a product.
- **BR-4:** Daily tips rotate on a schedule configured by the admin.
- **BR-5:** Brewing guides are static content managed by the admin.
- **BR-6:** Reviews require admin moderation before they are publicly displayed.

## Implemented By
- Status: **Not yet implemented** — planned future feature
