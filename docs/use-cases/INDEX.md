# KRUZE Coffee & Tea — Use Case Index

**Last Updated:** 2026-03-14
**Total Use Cases:** 36 (29 approved, 7 draft)
**Source:** `kruzeapp-use-case-diagram.drawio` (root), codebase analysis

---

## Overview

This directory contains the structured use case documentation for the KRUZE Coffee & Tea Omnichannel Management System. Use cases are the permanent source of truth from which user stories, specs, and tasks are derived (see `AGENTS_ARCHITECTURE.md` §1.4).

### Actors

**Primary Actors** (people who initiate use cases):

| Actor | Interfaces |
|-------|-----------|
| **Admin** | Admin Dashboard |
| **POS User / Cashier** | POS Terminal |
| **Webshop Visitor** | Storefront |
| **Registered Customer** | Storefront, Loyalty App |
| **Loyalty User** (Future) | Loyalty App |

**Secondary Actors** (external systems or persons the system interacts with):

| Actor | Role | Used In |
|-------|------|---------|
| **Authentication Service** (Supabase Auth) | Identity verification and session management | All interfaces |
| **Payment Provider** (Mollie) | Online payment processing | Storefront checkout |
| **Email Service** (Resend) | Email delivery for invoices and notifications | Admin, Storefront |
| **Supplier** | External company providing goods | Procurement |

> **Note:** Infrastructure components (databases, file storage, PDF libraries) are NOT actors — they are internal implementation details of the system.

---

## Admin Dashboard (UC-001 to UC-040)

| ID | Title | Domain | Priority | Status |
|----|-------|--------|----------|--------|
| [UC-001](UC-001-manage-products.md) | Manage Products | Product | Must | Approved |
| [UC-002](UC-002-manage-customers.md) | Manage Customers | Customer | Must | Approved |
| [UC-003](UC-003-create-manage-sales.md) | Record and Manage Sales | Sales / Finance | Must | Approved |
| [UC-004](UC-004-consult-sale-details.md) | Consult Sale Details | Sales / Finance | Must | Draft |
| [UC-006](UC-006-configure-sales-pricing.md) | Configure Sales Pricing (B2B/B2C) | Product / Finance | Must | Approved |
| [UC-007](UC-007-set-customer-specific-prices.md) | Set Customer-Specific Prices | Product / Customer | Should | Approved |
| [UC-008](UC-008-invoice-customer.md) | Invoice Customer | Finance | Must | Approved |
| [UC-009](UC-009-manage-suppliers-orders.md) | Manage Suppliers and Orders | Inventory / Procurement | Must | Approved |
| [UC-010](UC-010-manage-stock-movements.md) | Manage Stock Movements | Inventory | Must | Approved |
| [UC-011](UC-011-manage-buying-prices.md) | Manage Buying Prices | Product / Procurement | Should | Approved |
| [UC-012](UC-012-create-coffee-roasts.md) | Create Coffee Roasts | Operations / Inventory | Must | Approved |
| [UC-013](UC-013-inventory-counting-session.md) | Conduct Inventory Counting Session | Inventory / Operations | Must | Approved |
| [UC-014](UC-014-view-analytics-dashboard.md) | View Analytics Dashboard | Finance / Analytics | Must | Approved |
| [UC-015](UC-015-configure-system-settings.md) | Configure System Settings and Reference Data | Operations / Config | Must | Approved |
| [UC-016](UC-016-manage-product-blends.md) | Manage Product Blends and Components | Product / Operations | Should | Approved |
| [UC-017](UC-017-import-supplier-data.md) | Import Supplier Data (Boeren en Buren) | Inventory / Procurement | Should | Approved |
| [UC-018](UC-018-generate-accounting-reports.md) | Generate Accounting Reports | Finance / Reporting | Must | Approved |
| [UC-038](UC-038-consult-product-details.md) | Consult Product Details | Product | Must | Approved |
| [UC-039](UC-039-consult-customer-details.md) | Consult Customer Details | Customer | Must | Approved |
| [UC-040](UC-040-manage-unpaid-invoices.md) | Manage Unpaid Invoices | Finance | Must | Approved |

## POS System (UC-021 to UC-022)

| ID | Title | Domain | Priority | Status |
|----|-------|--------|----------|--------|
| [UC-021](UC-021-pos-register-sale.md) | Register POS Sale | Sales / POS | Must | Approved |
| [UC-022](UC-022-pos-daily-report.md) | View POS Daily Sales Report | Sales / Finance | Should | Approved |

## E-Commerce Storefront (UC-023 to UC-026)

| ID | Title | Domain | Priority | Status |
|----|-------|--------|----------|--------|
| [UC-023](UC-023-storefront-browse-catalog.md) | Browse Storefront Product Catalog | Sales / E-Commerce | Must | Approved |
| [UC-024](UC-024-storefront-shopping-cart.md) | Manage Shopping Cart | Sales / E-Commerce | Must | Approved |
| [UC-025](UC-025-storefront-checkout.md) | Checkout and Online Payment | Sales / Finance | Must | Approved |
| [UC-026](UC-026-storefront-customer-account.md) | Manage Customer Account | Customer / E-Commerce | Should | Approved |

## Cross-Cutting (UC-027 to UC-030)

| ID | Title | Domain | Priority | Status |
|----|-------|--------|----------|--------|
| [UC-027](UC-027-authenticate-authorize.md) | Authenticate and Authorize Users | Security | Must | Approved |
| [UC-029](UC-029-manage-media-images.md) | Manage Media Library and Product Images | Product / Operations | Should | Approved |
| [UC-030](UC-030-calculate-shipping.md) | Calculate Dynamic Shipping Cost | Sales / E-Commerce | Must | Approved |

## Storefront SEO & Analytics (UC-036 to UC-037)

| ID | Title | Domain | Priority | Status |
|----|-------|--------|----------|--------|
| [UC-036](UC-036-discover-storefront-search-engines.md) | Discover Storefront via Search Engines | E-Commerce / Marketing | Should | Draft |
| [UC-037](UC-037-track-visitor-behavior-consent.md) | Track Visitor Behavior with Consent | E-Commerce / Marketing / Compliance | Should | Draft |

## Loyalty App — Future (UC-031 to UC-035)

| ID | Title | Domain | Priority | Status |
|----|-------|--------|----------|--------|
| [UC-031](UC-031-loyalty-login-verification.md) | Loyalty App Login and Email Verification | Customer / Loyalty | Could | Draft |
| [UC-032](UC-032-loyalty-earn-points.md) | Earn Loyalty Points | Customer / Loyalty | Could | Draft |
| [UC-033](UC-033-loyalty-badges.md) | View and Unlock Loyalty Badges | Customer / Gamification | Could | Draft |
| [UC-034](UC-034-loyalty-redeem-rewards.md) | Redeem Loyalty Rewards | Customer / Loyalty | Could | Draft |
| [UC-035](UC-035-loyalty-challenges-tips.md) | Participate in Challenges and View Content | Customer / Gamification | Could | Draft |

---

## Domain Coverage Map

| Domain | Use Cases | Coverage |
|--------|-----------|----------|
| **Sales / Finance** | UC-003, UC-004, UC-006, UC-008, UC-018, UC-021, UC-025, UC-040 | Complete |
| **Product** | UC-001, UC-006, UC-007, UC-011, UC-016, UC-029, UC-038 | Complete |
| **Customer** | UC-002, UC-007, UC-026, UC-039 | Complete |
| **Inventory** | UC-009, UC-010, UC-012, UC-013, UC-017 | Complete |
| **E-Commerce** | UC-023, UC-024, UC-025, UC-026, UC-030, UC-036, UC-037 | Complete |
| **POS** | UC-021, UC-022 | Complete |
| **Analytics** | UC-014 | Complete |
| **Security / Auth** | UC-027 | Complete |
| **Operations / Config** | UC-012, UC-015, UC-016, UC-029 | Complete |
| **Loyalty (Future)** | UC-031, UC-032, UC-033, UC-034, UC-035 | Draft |

---

## Diagram Reference

The original UML use case diagram is available at:
- **Editable:** `kruzeapp-use-case-diagram.drawio` (root)
- **Viewable:** `kruzeapp-use-case-diagram.svg` (root)

All use cases in this directory align with and expand upon the diagram's identified use cases.
