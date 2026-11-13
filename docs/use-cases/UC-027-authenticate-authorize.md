# UC-027: Authenticate and Authorize Users

A user provides their credentials to gain access to the system. The system verifies the credentials through the authentication service and grants access to the areas and operations permitted for that user's role.

## Metadata
- **Domain:** Security / Operations
- **Primary Actor:** Admin
- **Secondary Actors:** Authentication Service (Supabase Auth)
- **Priority:** Must
- **Status:** Approved
- **Interface:** All (Admin, POS, Storefront)

## Preconditions
- The authentication service is configured and accessible.
- The user has an account with valid credentials (email and password).

## Main Flow
1. The user opens the login page for the admin panel or POS interface.
2. The system shows a login form asking for an email address and password.
3. The user provides their credentials and confirms.
4. The system forwards the credentials to the authentication service for verification.
5. The authentication service verifies the credentials and returns confirmation of the user's identity.
6. The system checks the user's role (admin or customer).
7. The system grants access to the Admin Dashboard or POS interface if the user holds an admin role.
8. The user is directed to the appropriate interface for their role.

## Alternative Flows
- **AF-1: Customer Login** — A customer signs in via the storefront. The system grants access only to storefront features and the customer's own account.
- **AF-2: Token Refresh** — The user's session is near expiration. The system renews the session transparently without interrupting the user.
- **AF-3: Logout** — The user indicates they want to sign out. The system ends the session and returns the user to the login page.

## Exception Flows
- **EF-1: Invalid Credentials** — The authentication service rejects the provided credentials. The system shows an "Invalid email or password" message.
- **EF-2: Expired Session** — The user's session has expired. The system redirects the user to the login page.
- **EF-3: Insufficient Permissions** — The user attempts to access a resource that requires a higher privilege level. The system denies access.
- **EF-4: Rate Limited** — Too many failed login attempts have been made. The system temporarily blocks further attempts for that user.

## Postconditions
- The authenticated user has an active session.
- The user can access resources appropriate to their role.
- Unauthorized access attempts are blocked and logged.

## Business Rules
- **BR-1:** Authentication is handled entirely by the authentication service — the application does not store or verify passwords directly.
- **BR-2:** Two user roles exist: admin (full access) and customer (storefront only).
- **BR-3:** POS access requires the admin role.
- **BR-4:** All protected operations require an active session except explicitly public endpoints.
- **BR-5:** Public endpoints include: storefront product browsing, category listing, shipping calculation, and registration.
- **BR-6:** Rate limiting is applied to login and registration endpoints to prevent brute-force attempts.

## Implementation Notes
- The authentication service is Supabase Auth. Upon successful login, a JWT token is issued and stored in a secure, HTTP-only cookie for all subsequent requests.
- Every request to a protected endpoint validates the token with Supabase server-side; no client-side token inspection is performed.
- The application uses JWT-based stateless authentication. No server-side sessions are maintained. See `.claude/skills/_shared/references/security-rules.md` for the full rationale.
- CSRF tokens are intentionally absent; the combination of JWT validation, HTTP-only cookies, and strict CORS origin validation provides equivalent protection. Do not add CSRF middleware.
- Security headers (via Helmet) are applied to all responses.

## Implemented By
- Routes: `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `POST /api/auth/reset-password`, `POST /api/auth/update-password`, `GET /api/auth/user`; `isAuthenticated` and `isAdmin` middleware on protected routes
- Services: `server/supabaseAuth.ts`, `server/security.ts`
- Components: `client/src/hooks/useAuth.ts`
- Storage: User records in Supabase Auth (external) + customer records in application DB
