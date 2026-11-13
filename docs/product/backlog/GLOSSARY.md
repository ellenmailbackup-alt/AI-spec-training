# Business Glossary

Shared definitions used across use cases, user stories, and technical specifications.

---

## Actors

| Term | Definition |
|------|------------|
| **Visitor** | An anonymous person browsing the storefront without an account. |
| **Registered User** | A person who has completed storefront registration and has an active account. They may or may not have placed any orders yet. |
| **Customer** | A registered user who has placed at least one order. The term "customer" also appears in the admin panel where it refers to any person or company in the customer database, regardless of whether they use the storefront. |
| **Admin** | A staff member with full access to the admin panel and POS interface. |

## Order & Commerce

| Term | Definition |
|------|------------|
| **Sale** | A confirmed transaction recorded in the `sales` table. Covers all channels: webshop (post-payment), admin-created, and POS. |
| **Webshop Order** | A storefront order captured in the `webshopOrders` table during the checkout and payment flow. Once Mollie payment is confirmed, it is converted into a Sale. The webshop order record is kept for audit and recovery purposes. |
| **Order History** | The full list of sales associated with a registered user, spanning all channels. |
| **Invoice** | A formal billing document generated for B2B sales. Each invoice carries a sequential invoice number per year. |
| **B2B Client** | A customer flagged as a business buyer. B2B sales require an invoice number to be generated. |
| **B2C** | Business-to-consumer sales without a formal invoice requirement. |

## Products & Inventory

| Term | Definition |
|------|------------|
| **Product** | A sellable item (coffee, tea, equipment) managed in the admin panel. |
| **SKU** | Stock Keeping Unit — a unique identifier for a product variant. |
| **Stock Movement** | A record of inventory change: purchase (in), sale (out), roast (in/out), or manual adjustment. |
| **Green Coffee** | Unroasted coffee beans tracked separately in inventory. |
| **Roasted Coffee** | Coffee beans that have been roasted. Linked to green coffee via a roast record. |

## Finance

| Term | Definition |
|------|------------|
| **VAT (BTW)** | Value Added Tax. All prices in the system have both VAT-inclusive and VAT-exclusive values. |
| **Revenue** | Reported **excluding VAT** throughout the system unless stated otherwise. |
| **Fiscal Year** | Calendar year (1 January – 31 December). |

## Channels

| Term | Definition |
|------|------------|
| **Webshop** | The customer-facing storefront SPA. |
| **Admin** | The back-office management SPA used by staff. |
| **POS** | Point of Sale — the in-store touchscreen interface used by staff. |
| **Boeren en Buren** | A fourth sales channel for community/market sales, imported via supplier data. |
