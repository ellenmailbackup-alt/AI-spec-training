# Story 5.3 — Navigation and UX

## User Story 5.3.1: Update Main Navigation

**As a** user
**I want to** easily navigate between dashboards
**So that** I can access the information I need quickly

**Priority:** MEDIUM
**Estimate:** 2 story points

**Acceptance Criteria:**
- [ ] Main navigation menu includes links to:
  - Dashboard (Main Overview) - route: `/dashboard`
  - Invoice Manager - route: `/invoices`
  - Sales Analysis - route: `/analytics/sales`
  - Inventory - route: `/inventory`
- [ ] Current page highlighted in navigation (active state)
- [ ] Navigation consistent across all pages (same menu appears everywhere)
- [ ] Mobile-friendly navigation:
  - Hamburger menu on mobile (<768px)
  - Expandable/collapsible menu
  - Touch-friendly tap targets
- [ ] Breadcrumbs show current location on each page:
  - Format: "Dashboard" or "Dashboard > Invoice Manager"
- [ ] Logo/home link returns to Dashboard
- [ ] Navigation accessible (keyboard navigation, ARIA labels)

**Technical Implementation:**
- **Navigation Component:**
  - Desktop: Horizontal menu or sidebar
  - Mobile: Hamburger menu
- **Active Link Styling:**
  - Use router active link detection (e.g., React Router `NavLink` with `activeClassName`)
- **Breadcrumb Component:**
  - Auto-generate based on current route
  - Clickable links (navigate to parent pages)

**Dependencies:**
- All page routes must exist (Epic 1, 2, 3, 4)

**Testing Notes:**
- Test navigation on desktop
- Test navigation on mobile (hamburger menu)
- Test active link highlighting (verify correct page highlighted)
- Test breadcrumbs (verify links work)
- Test keyboard navigation (Tab through links, Enter to activate)
- Test screen reader (verify ARIA labels)
