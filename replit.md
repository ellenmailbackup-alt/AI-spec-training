# Coffee & Tea Omnichannel Management System

## Overview
This project is a comprehensive business management system for coffee and tea retail and wholesale operations. It integrates an Admin Panel for business management, a Customer Storefront for e-commerce, and a POS Interface for in-store transactions. The system's core purpose is to manage products, customers, process orders across multiple channels, and handle invoicing with payment tracking. The business vision is to provide a robust, scalable solution that streamlines operations and enhances customer experience in the coffee and tea industry.

## User Preferences
Preferred communication style: Simple, everyday language. Ask for clarifications when requirements are not fully clear before developing.
In writing code, secure code patterns are essential and should be included.
Always do a web research before implementing a new feature and explain the different steps you will take.

## System Architecture

### Frontend Architecture
The system uses a multi-interface design with three separate React SPAs (Admin, Storefront, POS). UI development utilizes Radix UI with shadcn/ui styling and Tailwind CSS, alongside AdminLTE for the admin interface. State management employs TanStack Query for server state, React Hook Form with Zod for form handling, and React hooks for local component state. A consistent design system is maintained with an industry-inspired color palette and Google Fonts.

### Backend Architecture
The backend is an Express.js REST API, organized with routes, middleware for logging and error handling, and JSON request/response. Data access uses a Storage layer abstraction (IStorage interface) and a Repository pattern, including transaction support. The database schema supports product catalogs, inventory, customer segmentation, multi-channel orders, invoice management, and green-roasted coffee mappings. The architecture follows a three-layer pattern: Routes Layer (HTTP handling, validation), Service Layer (business logic, transactions), and Storage Layer (CRUD operations, data mapping).

### Data Storage Solutions
The primary data store is PostgreSQL on Neon (serverless), managed with Drizzle ORM for type-safe operations and Drizzle Kit for migrations. The schema uses UUID primary keys, enum types, decimal precision for monetary values, foreign key constraints, and soft deletion.

### Build and Development Stack
The development environment uses Vite for rapid development, TypeScript for type safety, and ESBuild for server bundling. The project structure is a monorepo, organized into `/client`, `/server`, and `/shared` directories.

### UI/UX Decisions
- **Number Formatting**: All numeric values use nl-BE locale formatting (comma as decimal separator).
- **Currency Display**: Use euro symbol (€) with space before amount (e.g., "€ 26,40").
- **Action Buttons**: Standardized styling for Edit (yellow background) and Delete (destructive variant) buttons.
- **Delete Confirmation Dialog**: All delete actions must use the shadcn AlertDialog pattern with:
  - AlertTriangle icon (text-destructive) in the title
  - Title format: "Delete [Entity Name]"
  - Description with: "Are you sure you want to delete [specific item identifier]?"
  - Warning text: "This action cannot be undone." (in text-destructive)
  - Cancel button and destructive Delete button
  - data-testid attributes: `dialog-delete-[entity]`, `button-cancel-delete`, `button-confirm-delete`
  - Loading state: Show "Deleting..." while mutation is pending
  - Never use browser `confirm()` dialogs
- **Invoice Design**: PDF invoices feature a redesigned layout with specific typography (Times-Bold, Helvetica, Times-Italic), an enhanced color palette (Dark Brown, Taupe, Accent Brown, Peach-Beige, Deep Brown, Light Cream), logo integration, and a warm tone of voice.
- **Form Enhancements**: Cascading dropdowns for unit and amount selection in sales price forms, and bidirectional VAT auto-calculation in sales price dialogs.

## External Dependencies

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Styled components based on Radix UI.
- **AdminLTE**: Admin dashboard framework.
- **Font Awesome**: Icon library.
- **Lucide React**: Modern icon set for React components.

### Backend Services
- **Neon Database**: Serverless PostgreSQL hosting.

### Font Services
- **Google Fonts**: Merriweather, Lato, JetBrains Mono.

### Form and Validation
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **@hookform/resolvers**: Integration for React Hook Form and Zod.

### Date Management
- **date-fns**: Date manipulation and formatting.

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express.

### PDF Generation
- **pdfkit**: PDF generation library for invoice creation.

## Recent Changes

### November 2, 2025 - Buying Prices Show Expired Filter
1. **Expired Prices Toggle**:
   - Added "Show expired prices" checkbox to Buying Prices tab
   - Matches functionality in Pricing Information tab for consistent UX
   - Filters buying prices by validUntil date (defaults to showing only active/future prices)
   - Updated empty state message to guide users
   - Sorted by validFrom date (newest first)

### February 27, 2026 - Webshop Database Integration
1. **Database Schema Extension** (`shared/schema.ts`):
   - Added 17 new columns to `products` table for webshop: `webshopEnabled`, `webshopDescription`, `originCountry`, `originContinent`, `region`, `tastingNote`, `process`, `strength`, `brewTemp`, `brewTime`, `juraSeries`, `juraPriceRange`, `specs`, `awards`, `seasonal`, `featured`, `webshopSortOrder`
   - All fields nullable (except booleans with defaults) to preserve backward compatibility

2. **API & Storage**:
   - Added `GET /api/webshop/products` public endpoint returning active webshop products with current B2C prices
   - Added `getWebshopProducts()` to storage layer — joins with `sales_price` for active pricing, groups multiple price variants per product
   - Updated `getProducts()` and `getProduct()` to include all new webshop fields

3. **Admin "Webshop" Tab** (`ProductDetail.tsx`):
   - New tab on product detail page for managing webshop metadata
   - Category-specific sections: Coffee (origin/strength/process), Tea (brew temp/time), Equipment (Jura series/price range/specs)
   - General section: webshopEnabled toggle, description, awards, featured/seasonal flags, sort order

4. **Frontend Connected to Real Data**:
   - Shop.tsx fetches from `/api/webshop/products` via React Query instead of mock data
   - WebshopSidebar computes filter counts dynamically from fetched products
   - Product cards handle nullable fields gracefully
   - 88 products seeded with webshop metadata (22 coffees, 66 teas)

5. **Data Seeding**: Coffee origins parsed from product names, tea brewing parameters set by subtype defaults

### February 27, 2026 - Webshop Page UI
1. **Full Webshop Implementation** (`/shop`):
   - Split entry banners, sticky sidebar (260px), product cards with category-specific designs
   - Toolbar with sort/view toggle, section labels, 3-column responsive grid
   - Client-side filtering and sorting, URL-synced category routes

2. **Routes**: `/shop`, `/shop/coffee`, `/shop/tea`, `/shop/equipment`, `/shop/gifts`

3. **All UI text in Dutch** (Belgian Dutch)

### February 21, 2026 - Static Content Pages (Dutch)
1. **Shared Layout Components**:
   - Created `StorefrontLayout` component (header, footer, announcement bar) for all static pages
   - Created `PageHero` reusable hero banner component
   - Consistent navigation across all static pages with mobile hamburger menu
   - Shared color palette and typography (Playfair Display headings, DM Sans body)

2. **Static Pages Created (all in Dutch)**:
   - `/nl/over-ons` — About page with 4 pillars, Stijn & Leen stories, certifications
   - `/nl/contact` — Contact with address, phone, email, opening hours, map, contact form
   - `/nl/workshops` — Workshop types (cupping, latte art, tea blending, corporate events)
   - `/nl/vergaderzaal` — Meeting room details, pricing (€50/hr, €150/half day, €250/full day), catering
   - `/nl/jura` — JURA partnership, product categories, service benefits, technology
   - `/nl/professional` — B2B coffee service, 4 pillars, JURA dealer info

3. **URL Structure**: Using `/nl/` prefix for Dutch pages to support future `/en/` English pages
4. **Navigation Updates**: Homepage nav and footer updated with links to all new pages
5. **Generated Hero Images**: Unique hero images for each static page

### November 2, 2025 - Checkbox Visual Enhancement
1. **Improved Checkbox Visibility**:
   - Increased checkbox size from 16px (h-4 w-4) to 20px (h-5 w-5) for better visibility
   - Added thicker border (border-2 instead of border) for clearer boundaries
   - Enhanced check mark with stroke-[3] for bolder appearance
   - Added explicit background color for unchecked state (bg-background)
   - Added transition-all for smooth state changes
   - Ensured checked state uses both bg-primary and border-primary for maximum contrast
   - Applies to all checkboxes: "Show expired prices", "Show in POS", "Webshop Sale", "Stock Updated", "Uploaded to Accounting"

### November 2, 2025 - Create New Sale Dialog Enhancement
1. **Unit Column Addition**:
   - Added "Unit" column between "Quantity" and "Unit Price" in the products table
   - Displays the selected unit amount (e.g., "100 g", "250 g", "1 kg")
   - Calculated from the weight divided by quantity (unitAmount = weight / amount)
   - Prevents loss of unit information when creating sales
   - Improves clarity by showing exactly what unit size was selected for each product