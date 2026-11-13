# UC-031: Loyalty App Login and Email Verification

A loyalty user registers and verifies their identity via email to gain access to the KRUZE loyalty programme. This ensures that only confirmed account holders can earn points, collect badges, and redeem rewards.

## Metadata
- **Domain:** Customer / Loyalty
- **Primary Actor:** Loyalty User
- **Secondary Actors:** Authentication Service (Supabase Auth), Email Service
- **Priority:** Could
- **Status:** Draft (Future Feature)
- **Interface:** Loyalty App (Mobile/PWA)

## Preconditions
- Loyalty App is deployed and accessible
- User has a valid email address

## Main Flow
1. The loyalty user opens the KRUZE Loyalty App.
2. The system presents a login and registration screen.
3. The loyalty user enters their email address to register.
4. The system sends a verification email containing a confirmation link.
5. The loyalty user follows the verification link in the email.
6. The system confirms the email address and activates the loyalty account.
7. The loyalty user opens the app and signs in with their verified email.
8. The system authenticates the user and displays the loyalty dashboard.

## Alternative Flows
- **AF-1: Existing Customer** — A loyalty user who already has a webshop account links their loyalty account to their existing customer profile.
- **AF-2: Link Multiple Emails** — The loyalty user associates multiple email addresses with a single loyalty account (e.g., personal and work emails).
- **AF-3: Returning User Login** — An existing loyalty user signs in directly without re-verification.

## Exception Flows
- **EF-1: Invalid Email** — The system rejects an invalid email format and prompts the user to correct it.
- **EF-2: Verification Expired** — The verification link has expired. The loyalty user requests a new one.

## Postconditions
- The loyalty account exists and is verified.
- The loyalty user can access loyalty features (points, badges, rewards).
- If linked, loyalty activity syncs with the customer's purchase history.

## Business Rules
- **BR-1:** Email verification is mandatory before accessing loyalty features.
- **BR-2:** Loyalty accounts can be linked to existing customer records for unified history.
- **BR-3:** Multiple email addresses can be associated with one loyalty account.
- **BR-4:** Authentication uses the same identity service as the webshop.

## Implemented By
- Status: **Not yet implemented** — planned future feature
