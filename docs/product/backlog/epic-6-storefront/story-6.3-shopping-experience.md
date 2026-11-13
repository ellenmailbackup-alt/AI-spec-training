# Story 6.3 — Shopping Experience

## User Story 6.3.1: Product Catalog Pages

**As a** customer
**I want to** browse products by category
**So that** I can find products I'm interested in

**Priority:** HIGH
**Estimate:** 6 story points

**Acceptance Criteria:**
- [ ] Category pages: `/shop/coffee`, `/shop/tea`, `/shop/equipment`
- [ ] Grid showing: image, name, short description, price, quick "Add to Cart", "View Details"
- [ ] Filters: price range, origin, roast level, tea type, in stock, certifications
- [ ] Sorting: featured, price (low/high), newest, name A-Z
- [ ] Pagination (24 per page)
- [ ] Show count: "Showing 1-24 of 87 products"
- [ ] Empty state if no matches
- [ ] Responsive grid (1/2/3-4 cols)
- [ ] Loading skeleton

**Technical Implementation:**
- Routes: `/shop/:category`
- API: GET `/api/products/category/:category?filters&sort&page`
- Components: CategoryPage, ProductGrid, ProductCard, FiltersSidebar, SortDropdown, Pagination

**Dependencies:** User Story 6.1.1, 6.2.4

**Testing Notes:**
- Test category filtering
- Test filters/sorting
- Test pagination
- Test responsive layout
- Test empty/loading states

---

## User Story 6.3.2: Shopping Cart

**As a** customer
**I want to** add products to cart and review before checkout
**So that** I can purchase multiple items

**Priority:** HIGH
**Estimate:** 8 story points

**Acceptance Criteria:**
- [ ] Cart in DB for logged-in, localStorage for guests
- [ ] Cart page: `/shop/cart`
- [ ] Displays: image, name, unit size, price, quantity selector, subtotal, remove button
- [ ] Summary: subtotal (excl. VAT), VAT, shipping, total (incl. VAT)
- [ ] "Continue Shopping" and "Checkout" buttons
- [ ] Empty cart state
- [ ] Cart icon shows item count
- [ ] Add to cart success toast
- [ ] Stock validation
- [ ] Persist cart between sessions
- [ ] Merge carts on login

**Database Schema:**
```sql
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR,
  product_id INTEGER NOT NULL REFERENCES product(id),
  sales_price_id INTEGER NOT NULL REFERENCES sales_prices(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  creation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_item_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);
```

**API:** GET/POST/PATCH/DELETE `/api/cart` and `/api/cart/items`

**Dependencies:** User Story 6.1.1

**Testing Notes:**
- Test add/update/remove
- Test cart persistence
- Test guest vs logged-in
- Test merge on login
- Test stock validation

---

## User Story 6.3.3: Checkout Flow

**As a** customer
**I want to** complete purchase with shipping/payment
**So that** I can receive my order

**Priority:** HIGH
**Estimate:** 13 story points

**Acceptance Criteria:**
- [ ] Checkout: `/shop/checkout`
- [ ] Multi-step:
  1. Shipping info: name, email, phone, address
  2. Shipping method: standard/express, free over €50
  3. Payment method selection (choose one):
     - **Pay Online** (default) - Customer clicks "Continue to Payment" -> redirected to Mollie hosted checkout page where they choose iDEAL, Visa, Mastercard, Bancontact, etc.
     - **Bank Transfer** (B2B customers only) - Manual offline payment, order status = "Awaiting Payment"
  4. Review: order summary, terms & conditions checkbox, "Place Order" button
- [ ] Form validation on each step
- [ ] Progress indicator (Step 1/4, 2/4, 3/4, 4/4)
- [ ] Back/Continue navigation between steps
- [ ] Guest checkout option (no account required)
- [ ] Save shipping addresses for logged-in users
- [ ] Discount code input and validation
- [ ] Order confirmation page after successful payment
- [ ] Order confirmation email sent to customer
- [ ] Save completed order to sales table

**Database:**
```sql
ALTER TABLE sale ADD COLUMN shipping_name TEXT;
ALTER TABLE sale ADD COLUMN shipping_email TEXT;
ALTER TABLE sale ADD COLUMN shipping_phone TEXT;
ALTER TABLE sale ADD COLUMN shipping_address_line1 TEXT;
ALTER TABLE sale ADD COLUMN shipping_city TEXT;
ALTER TABLE sale ADD COLUMN shipping_postal_code TEXT;
ALTER TABLE sale ADD COLUMN shipping_country TEXT DEFAULT 'BE';
ALTER TABLE sale ADD COLUMN payment_provider TEXT; -- 'mollie' or 'bank_transfer'
ALTER TABLE sale ADD COLUMN payment_transaction_id TEXT; -- Mollie payment ID
ALTER TABLE sale ADD COLUMN mollie_payment_status TEXT; -- open, paid, expired, failed, canceled
ALTER TABLE sale ADD COLUMN discount_code TEXT;

CREATE TABLE customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  is_default BOOLEAN DEFAULT FALSE,
  name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT,
  creation_date TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Payment Integration - Mollie:**
- **Library:** `@mollie/api-client` (Node.js SDK)
- **Mollie Hosted Checkout:** Mollie provides a secure hosted checkout page where customers select their preferred payment method
- **Payment Methods Available on Mollie Checkout Page:**
  - iDEAL (most popular in Netherlands/Belgium)
  - Credit/Debit Cards (Visa, Mastercard, Amex)
  - Bancontact (Belgium)
  - SEPA Direct Debit
  - PayPal
  - Apple Pay
  - Other Mollie-supported methods as needed
- **Payment Flow:**
  1. Customer completes checkout steps on your website
  2. Customer selects "Pay Online" and clicks "Place Order"
  3. Backend creates Mollie payment via API
  4. Customer redirected to **Mollie's hosted checkout page**
  5. **On Mollie page:** Customer sees available payment methods (iDEAL, Visa, Bancontact, etc.) and chooses one
  6. Customer completes payment on Mollie's secure page
  7. Mollie redirects customer back to your site: `/checkout/success?order={orderId}` or `/checkout/failure`
  8. **Asynchronously:** Mollie webhook sends payment status updates to your backend
  9. Backend updates order status based on payment status (pending -> paid/failed/expired)
  10. Confirmation email sent to customer

**Technical Implementation:**
```typescript
// Backend - Create Mollie payment
import createMollieClient from '@mollie/api-client';

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

// Step 1: Create payment
const payment = await mollieClient.payments.create({
  amount: {
    currency: 'EUR',
    value: '10.00' // MUST be string format with 2 decimals
  },
  description: `Order #${orderNumber}`,
  redirectUrl: `${baseUrl}/checkout/success?order=${orderId}`,
  webhookUrl: `${baseUrl}/api/webhooks/mollie`,
  metadata: {
    orderId: orderId.toString(),
    customerEmail: customerEmail
  }
});

// Step 2: Get checkout URL from _links.checkout property
const checkoutUrl = payment._links.checkout.href;

// Step 3: Redirect customer using HTTP GET (NOT POST!)
// Frontend: window.location.href = checkoutUrl;
```

**Webhook Implementation:**
```typescript
// POST /api/webhooks/mollie
// Mollie sends a POST request with single parameter: id=<payment_id>
// IMPORTANT: Must respond with 200 OK within 15 seconds or Mollie retries

app.post('/api/webhooks/mollie', async (req, res) => {
  const paymentId = req.body.id;

  try {
    const payment = await mollieClient.payments.get(paymentId);
    const orderId = payment.metadata.orderId;

    if (payment.isPaid()) {
      await updateOrderStatus(orderId, 'PAID');
      await sendConfirmationEmail(orderId);
    } else if (payment.isFailed()) {
      await updateOrderStatus(orderId, 'FAILED');
    } else if (payment.isExpired()) {
      await updateOrderStatus(orderId, 'EXPIRED');
    } else if (payment.isCanceled()) {
      await updateOrderStatus(orderId, 'CANCELED');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Mollie webhook error:', error);
    res.status(200).send('OK'); // Still return 200 to prevent retries
  }
});
```

**Important Notes from Mollie Documentation:**
- Amount value must be a **string** with exactly 2 decimal places
- Use **HTTP GET** for redirect to checkout URL (POST causes issues with some payment methods)
- Webhook must respond with **200 OK within 15 seconds** or Mollie retries
- **Always fetch payment status** from Mollie API in webhook (don't trust POST data alone)
- Webhooks may be called **multiple times** - handle idempotently
- Payment statuses: `open`, `paid`, `failed`, `expired`, `canceled`, `pending`
- Use `metadata` field to store order reference for easy lookup in webhook

**API Endpoints:**
- POST `/api/checkout/shipping` - save shipping info
- POST `/api/checkout/create-payment` - create Mollie payment, return checkout URL
- POST `/api/webhooks/mollie` - receive payment status updates
- GET `/api/checkout/verify-payment/:orderId` - verify payment status on return

**Dependencies:** User Story 6.3.2

**Testing Notes:**
- Test each checkout step (shipping -> method -> payment -> review)
- Test form validation on each step
- Test "Pay Online" flow:
  - Use Mollie test mode with test API key
  - Verify redirect to Mollie hosted checkout page
  - Test selecting different payment methods on Mollie page (iDEAL, credit card, Bancontact)
  - Test successful payment -> redirect to success page
  - Test webhook handling (use Mollie test webhooks or ngrok for local development)
  - Verify order status updates (pending -> paid)
- Test "Bank Transfer" flow:
  - Verify only shown to B2B customers
  - Verify order status = "Awaiting Payment"
  - Verify bank details shown in confirmation email
- Test order confirmation email sent after payment
- Test guest checkout vs logged-in user checkout
- Test saved addresses for logged-in users
- Test discount codes (valid, invalid, expired)
- Test payment expiration (Mollie payments expire after 15-30 min)
- Test payment cancellation (customer clicks "Cancel" on Mollie page)
- Test failed payment scenarios (insufficient funds, card declined, etc.)
- Test concurrent webhook calls (Mollie can send duplicate webhooks)

---

## User Story 6.3.4: Product Search

**As a** customer
**I want to** search products by name/origin/flavor
**So that** I can quickly find what I'm looking for

**Priority:** MEDIUM
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Search bar in header
- [ ] Search results: `/shop/search?q=ethiopia`
- [ ] Matches: name, description, tasting notes, origin, producer
- [ ] Autocomplete suggestions (5 products)
- [ ] Highlight search terms
- [ ] Filters on results page
- [ ] "No results" state with suggestions
- [ ] Search analytics

**Technical Implementation:**
- API: GET `/api/products/search?q=ethiopia&lang=nl`
- Full-text search with ranking
```sql
CREATE INDEX idx_product_search ON product
  USING GIN (to_tsvector('dutch', COALESCE(name, '') || ' ' || COALESCE(short_description, '')));
```

**Dependencies:** User Story 6.1.1, 6.1.2, 6.3.1

**Testing Notes:**
- Test search by name/origin/notes
- Test autocomplete
- Test no results
- Test multilanguage search

---

## User Story 6.3.5: Discount Vouchers & Coupon Codes

**As a** customer
**I want to** enter a discount code during checkout
**So that** I can receive promotional discounts on my order

**Priority:** HIGH
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Discount code input field on checkout review step
- [ ] "Apply" button to validate and apply code
- [ ] Real-time validation:
  - Code exists and is valid
  - Code is not expired (check validFrom/validUntil dates)
  - Code usage limit not exceeded
  - Minimum order amount met (if applicable)
  - Code applicable to products in cart
- [ ] Display discount type and value:
  - Percentage discount (e.g., "10% OFF")
  - Fixed amount discount (e.g., "€5.00 OFF")
  - Free shipping
- [ ] Update order totals after applying code:
  - Show discount amount
  - Recalculate subtotal and total
- [ ] Remove/clear applied code option
- [ ] Error messages for invalid codes
- [ ] Success message for valid codes
- [ ] Code applied is stored with order
- [ ] Admin UI to create/manage discount codes

**Database Schema:**
```sql
CREATE TABLE discount_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "SUMMER2025", "WELCOME10"
  description TEXT, -- Internal description
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'free_shipping'
  discount_value DECIMAL(10, 2) NOT NULL, -- 10.00 for 10% or €10
  minimum_order_amount DECIMAL(10, 2), -- Minimum cart value to use code
  max_uses INTEGER, -- Total usage limit (null = unlimited)
  current_uses INTEGER DEFAULT 0, -- Track usage count
  max_uses_per_customer INTEGER, -- Usage limit per customer (null = unlimited)
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  applies_to VARCHAR(20) DEFAULT 'all', -- 'all', 'category', 'product'
  applies_to_ids JSONB, -- Array of category/product IDs if not 'all'
  created_by VARCHAR REFERENCES users(id),
  creation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  modification_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(active);
CREATE INDEX idx_discount_codes_valid ON discount_codes(valid_from, valid_until);

-- Track code usage per customer
CREATE TABLE discount_code_usage (
  id SERIAL PRIMARY KEY,
  discount_code_id INTEGER NOT NULL REFERENCES discount_codes(id),
  customer_id INTEGER REFERENCES customers(id), -- NULL for guest users
  session_id VARCHAR, -- For guest tracking
  sale_id INTEGER REFERENCES sale(id),
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discount_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX idx_discount_usage_customer ON discount_code_usage(customer_id);
CREATE INDEX idx_discount_usage_sale ON discount_code_usage(sale_id);
```

**Discount Calculation Logic:**
```typescript
interface DiscountResult {
  valid: boolean;
  error?: string;
  discountAmount?: number;
  discountType?: string;
}

async function validateAndCalculateDiscount(
  code: string,
  cartTotal: number,
  cartItems: CartItem[],
  customerId?: number,
  sessionId?: string
): Promise<DiscountResult> {
  // 1. Find code
  const discountCode = await getDiscountCodeByCode(code);
  if (!discountCode || !discountCode.active) {
    return { valid: false, error: 'Invalid discount code' };
  }

  // 2. Check dates
  const now = new Date();
  if (now < discountCode.validFrom || (discountCode.validUntil && now > discountCode.validUntil)) {
    return { valid: false, error: 'Discount code has expired' };
  }

  // 3. Check usage limits
  if (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses) {
    return { valid: false, error: 'Discount code has reached maximum uses' };
  }

  // 4. Check per-customer usage
  if (discountCode.maxUsesPerCustomer) {
    const customerUses = await getCustomerUseCount(discountCode.id, customerId, sessionId);
    if (customerUses >= discountCode.maxUsesPerCustomer) {
      return { valid: false, error: 'You have already used this code' };
    }
  }

  // 5. Check minimum order amount
  if (discountCode.minimumOrderAmount && cartTotal < discountCode.minimumOrderAmount) {
    return {
      valid: false,
      error: `Minimum order of EUR ${discountCode.minimumOrderAmount} required`
    };
  }

  // 6. Check if applies to cart items
  if (discountCode.appliesTo !== 'all') {
    const applicable = checkApplicability(cartItems, discountCode);
    if (!applicable) {
      return { valid: false, error: 'Code not applicable to items in cart' };
    }
  }

  // 7. Calculate discount
  let discountAmount = 0;
  if (discountCode.discountType === 'percentage') {
    discountAmount = (cartTotal * discountCode.discountValue) / 100;
  } else if (discountCode.discountType === 'fixed_amount') {
    discountAmount = Math.min(discountCode.discountValue, cartTotal);
  } else if (discountCode.discountType === 'free_shipping') {
    discountAmount = 0; // Handled separately in shipping calculation
  }

  return {
    valid: true,
    discountAmount,
    discountType: discountCode.discountType
  };
}
```

**Admin UI - Discount Code Management:**
- Page: `/admin/discount-codes`
- List all codes with filters (active, expired, usage stats)
- Create new code form:
  - Code (auto-generate option)
  - Type: percentage/fixed/free shipping
  - Value
  - Date range (valid from/until)
  - Usage limits (total, per customer)
  - Minimum order amount
  - Applies to: all/specific categories/specific products
- Edit/deactivate codes
- View usage analytics per code

**API Endpoints:**
- POST `/api/discount-codes/validate` - validate and calculate discount
- GET `/api/admin/discount-codes` - list all codes (admin)
- POST `/api/admin/discount-codes` - create new code (admin)
- PATCH `/api/admin/discount-codes/:id` - update code (admin)
- DELETE `/api/admin/discount-codes/:id` - deactivate code (admin)
- GET `/api/admin/discount-codes/:id/usage` - view usage stats (admin)

**Frontend Components:**
- DiscountCodeInput (on checkout page)
- DiscountCodeBadge (shows applied code)
- AdminDiscountCodeList
- AdminDiscountCodeForm
- DiscountCodeUsageStats

**Dependencies:**
- User Story 6.3.2 (Shopping Cart)
- User Story 6.3.3 (Checkout Flow)

**Testing Notes:**
- Test valid code application
- Test invalid/expired code errors
- Test usage limit enforcement
- Test per-customer limit
- Test minimum order amount validation
- Test percentage vs fixed amount calculations
- Test free shipping codes
- Test code removal
- Test applies to category/product restrictions
- Test code used in completed order
- Test admin code creation/management
- Test usage tracking and analytics
- Test concurrent usage (race conditions)
- Test code case-insensitivity (CODE123 = code123)
