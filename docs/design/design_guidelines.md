# Design Guidelines: Coffee & Tea Omnichannel Management System

## Design Approach

**Multi-Interface Strategy**: Three distinct front-ends unified by shared brand identity and backend
- **Admin Panel**: AdminLTE framework with coffee/tea industry customization
- **Customer Storefront**: Premium e-commerce experience inspired by specialty coffee brands (Blue Bottle, Trade Coffee) with warm, inviting aesthetics
- **POS Interface**: Touch-optimized, speed-focused design for in-store transactions

## Brand Color Palette

**Official KRUZE Brand Colors** (from brandbook):
- **Primary Brown**: #8A6959 - Main brand color, used for headers, CTAs, emphasis
- **Soft Peach**: #E8BF9C - Warm accent for backgrounds and highlights
- **Golden Beige**: #CCA693 - Secondary accent for UI elements
- **Off-White**: #F1F2ED - Light background alternative

### Dark Mode (Primary)
- **Primary Brand**: 20 21% 45% (KRUZE brown #8A6959)
- **Secondary**: 28 62% 76% (Soft peach #E8BF9C)
- **Accent**: 20 34% 69% (Golden beige #CCA693)
- **Background**: 20 10% 12% (Deep espresso)
- **Surface**: 25 8% 18% (Elevated card background)
- **Text Primary**: 72 12% 94% (Off-white #F1F2ED)
- **Text Secondary**: 30 5% 70% (Muted cream)
- **Success**: 145 50% 45% (Tea green)
- **Warning**: 35 75% 55% (Golden honey)
- **Danger**: 0 60% 50% (Berry red)

### Light Mode
- **Primary Brand**: 20 21% 45% (KRUZE brown #8A6959)
- **Secondary**: 28 62% 76% (Soft peach #E8BF9C)
- **Accent**: 20 34% 69% (Golden beige #CCA693)
- **Background**: 72 12% 94% (Off-white #F1F2ED)
- **Surface**: 0 0% 100% (Pure white)
- **Text Primary**: 25 30% 15% (Dark chocolate)
- **Text Secondary**: 25 15% 40% (Medium brown)

## Typography

**Font Stack**:
- **Primary (UI)**: 'Inter' via Google Fonts - Clean, professional for data and forms
- **Accent (Headers)**: 'Playfair Display' via Google Fonts - Elegant serif for product names and branding
- **Monospace (Data)**: 'JetBrains Mono' for invoices, SKUs, numerical data

**Scale**:
- Hero/Display: text-5xl to text-7xl, font-serif
- Section Headers: text-3xl to text-4xl, font-semibold
- Subsection: text-xl to text-2xl
- Body: text-base, leading-relaxed
- Small/Meta: text-sm

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Tight spacing: p-2, gap-2 (POS buttons, compact lists)
- Standard: p-4, p-6, gap-4 (cards, form fields)
- Generous: p-8, p-12, py-16, py-20 (section padding)
- Extra generous: py-24, py-32 (storefront sections)

**Containers**:
- Admin/POS: Full width with px-4 to px-8 padding
- Storefront: max-w-7xl centered with px-4

## Data Formatting

**Locale**: nl-BE (Belgian Dutch) for all number and currency formatting.

**Currency Display**:
- Euro symbol with a space before the amount: `€ 26,40`
- Comma as decimal separator, period as thousands separator: `€ 1.250,00`
- Always show exactly 2 decimal places for amounts displayed to users

**Number Precision**:
- **Internal calculations** (backend, service layer): use 5-decimal precision to avoid rounding drift across multi-step computations (e.g., unit price x quantity x VAT)
- **User-facing display** (UI, invoices, receipts, PDFs): always round to 2 decimal places
- **Database storage**: numeric fields store up to 5 decimals; formatting to 2 decimals happens at the presentation layer

**Monospace for Financial Data**: Use `JetBrains Mono` (see Typography) for invoice totals, line-item amounts, and any tabular financial data to ensure proper column alignment.

## Interface-Specific Guidelines

### 1. Admin Panel (AdminLTE Customization)

**Layout**:
- AdminLTE sidebar with coffee-themed color scheme
- Sticky top navigation with business name and user profile
- Dashboard cards using AdminLTE's box components
- DataTables for inventory and invoice lists

**Key Sections**:
- Dashboard: KPIs in AdminLTE info-boxes (4-column grid) showing sales, low stock, pending orders, revenue
- Inventory Table: Filterable/sortable with product images (60x60px thumbnails), stock levels with color-coded badges
- Invoice Manager: List view with status badges, quick actions, PDF export
- Product Editor: Multi-step form with image upload, categorization, pricing tiers
- Reports: Chart.js integration for sales trends, inventory turnover

**Color Customization**:
- Replace AdminLTE's default blue with coffee brown primary
- Use warm amber for accents instead of default yellow
- Maintain AdminLTE's success/warning/danger colors

### 2. Customer Storefront

**Hero Section** (h-screen with bg-cover):
- Full-width hero image: Artisan coffee/tea brewing scene, warm lighting, steam rising
- Overlay: gradient from transparent to bg-background/90
- Centered content: Large serif headline "Artisan Coffee & Fine Teas", subheading, CTA button with backdrop-blur

**Navigation**:
- Sticky header with logo, categories (Coffee, Tea, Equipment), search, cart icon
- Transparent over hero, solid with shadow on scroll

**Product Grid**:
- 3-4 column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)
- Product cards: Square images, product name in serif, origin/roast info, price, quick add button
- Hover: Subtle scale transform, elevated shadow
- Filter sidebar: Categories, origin, roast level, price range

**Product Detail Page**:
- 2-column layout: Large image gallery (60%) + details (40%)
- Product title in Playfair Display, large
- Rich description with tasting notes, origin story
- Variant selector (size, grind type)
- Quantity selector + prominent "Add to Cart"
- Related products carousel below

**Checkout Flow**:
- Multi-step indicator at top
- Clean, single-column form layout (max-w-2xl)
- Summary sidebar showing cart items
- Trust badges near payment section

**Sections to Include**:
- Hero with CTA
- Featured products carousel
- About/Story section with founder image
- Product categories grid (Coffee, Tea, Equipment)
- Customer testimonials (2-column)
- Newsletter signup
- Rich footer with quick links, contact, social

### 3. POS Interface

**Design Philosophy**: Speed and touch-friendly
- Large touch targets (min-h-16 for buttons)
- High contrast for visibility in retail lighting
- Minimal chrome, maximum working space

**Layout**:
- 60/40 split: Product grid (60%) + Cart/Checkout (40%)
- Fixed header with business name, current user, logout
- No sidebar navigation

**Product Grid**:
- Large square tiles (w-32 h-32 or larger) with product image
- Product name, price prominent
- Quick category tabs at top for filtering
- Search bar with autofocus for SKU/barcode scanning

**Cart Section** (right sidebar):
- Line items with quantity adjusters (large +/- buttons)
- Running subtotal, tax, total
- Payment type selector (Cash, Card, Other) as large button group
- Tender amount input with number pad
- Complete Sale button (large, full-width, primary color)

**Receipt View**:
- Clean, printable receipt layout
- Print button + New Transaction

**Color Treatment**:
- Use lighter backgrounds for better retail visibility
- High contrast text
- Primary buttons in brand coffee brown
- Success green for completed transactions

## Component Library

**Buttons**:
- Primary: bg-primary with white text, rounded-lg, px-6 py-3
- Secondary: border-2 border-primary with primary text
- Ghost: hover:bg-primary/10
- Icon buttons: Square with p-3

**Cards**:
- bg-surface, rounded-xl, shadow-lg
- Admin: AdminLTE box classes
- Storefront: Hover lift effect (hover:-translate-y-1)
- POS: Minimal shadow, larger padding

**Forms**:
- Input fields: border-2, focus:border-primary, rounded-lg, p-3
- Dark mode: bg-surface with lighter border
- Labels: font-medium, mb-2
- Validation: Red border + error message below

**Tables** (Admin):
- AdminLTE DataTables styling
- Striped rows
- Sortable columns with indicators
- Action buttons column (Edit, Delete icons)

**Badges**:
- Status badges: Paid (green), Pending (amber), Overdue (red)
- Stock level: High (green), Low (amber), Out (red)
- Rounded-full, px-3, py-1, text-sm, font-medium

**Modals**:
- Centered overlay with backdrop-blur
- max-w-2xl for forms
- Close button top-right
- Admin: AdminLTE modal classes

## Images

**Required Images**:
1. **Storefront Hero**: High-quality lifestyle shot of coffee brewing or tea ceremony, warm natural lighting, steam visible (1920x1080)
2. **Product Images**: Clean white background shots of coffee bags/tea tins (800x800 square)
3. **About Section**: Founder or roastery photo, authentic and warm
4. **Category Tiles**: Coffee beans close-up, tea leaves, brewing equipment

**Image Treatment**:
- Storefront: High quality, warm color grading
- Admin: Thumbnails in tables, full size in product editor
- POS: Optimized small thumbnails for speed

## Accessibility & Interactions

- Maintain WCAG AA contrast ratios minimum
- Focus states: 2px ring-2 ring-primary ring-offset-2
- Animations: Use sparingly - product card hovers, page transitions only
- No auto-playing animations
- Touch targets: min 44x44px on POS
- Keyboard navigation fully supported in admin

This creates a cohesive, premium coffee and tea business system with AdminLTE handling complex data management, a beautiful storefront driving online sales, and an efficient POS for in-store transactions.