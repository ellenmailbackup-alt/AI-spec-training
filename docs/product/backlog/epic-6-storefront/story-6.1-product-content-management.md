# Story 6.1 — Product Content Management (Backend)

## User Story 6.1.1: Extend Product Schema for Storefront Content

**As a** business manager
**I want to** add rich content to products (descriptions, features, specifications)
**So that** customers can make informed purchasing decisions on the webshop

**Priority:** HIGH
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Extend products table with content fields:
  - `slug` (URL-friendly identifier, e.g., "ethiopia-yirgacheffe-natural")
  - `shortDescription` (1-2 sentences, max 160 chars)
  - `description` (full product description, rich text/markdown)
  - `features` (JSONB array of feature bullets)
  - `specifications` (JSONB object: origin, roast level, tasting notes, etc.)
  - `seoTitle` (custom page title for SEO)
  - `seoDescription` (meta description for SEO, max 160 chars)
  - `featured` (boolean - show on homepage)
  - `published` (boolean - visible on storefront)
  - `sortOrder` (integer - for manual sorting)
- [ ] All fields nullable (backward compatibility)
- [ ] Auto-generate slug from product name if not provided
- [ ] Unique constraint on slug
- [ ] Migration script

**Technical Implementation:**
```sql
-- Migration: Add storefront content fields to products table
ALTER TABLE product ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE product ADD COLUMN short_description TEXT;
ALTER TABLE product ADD COLUMN description TEXT;
ALTER TABLE product ADD COLUMN features JSONB;
ALTER TABLE product ADD COLUMN specifications JSONB;
ALTER TABLE product ADD COLUMN seo_title TEXT;
ALTER TABLE product ADD COLUMN seo_description TEXT;
ALTER TABLE product ADD COLUMN featured BOOLEAN DEFAULT FALSE;
ALTER TABLE product ADD COLUMN published BOOLEAN DEFAULT TRUE;
ALTER TABLE product ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Auto-generate slugs for existing products
UPDATE product
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

CREATE INDEX idx_product_slug ON product(slug);
CREATE INDEX idx_product_published ON product(published);
CREATE INDEX idx_product_featured ON product(featured);
```

**Example JSONB Structures:**
```json
// features
[
  "Single Origin from Ethiopia",
  "Light roast for fruity complexity",
  "Notes of blueberry, jasmine, and bergamot",
  "Perfect for filter and espresso"
]

// specifications (Coffee)
{
  "origin": "Yirgacheffe, Ethiopia",
  "producer": "Worka Washing Station",
  "variety": "Heirloom Ethiopian varieties",
  "process": "Natural (sun-dried)",
  "altitude": "1900-2200 masl",
  "roastLevel": "Light",
  "tastingNotes": ["Blueberry", "Jasmine", "Bergamot", "Stone fruit"],
  "brewMethods": ["Filter", "V60", "Aeropress", "Espresso"],
  "certifications": ["Organic", "Fair Trade"]
}

// specifications (Tea)
{
  "origin": "Darjeeling, India",
  "grade": "FTGFOP1",
  "harvest": "First Flush 2025",
  "oxidation": "Light (10-20%)",
  "caffeine": "Medium",
  "steepTime": "3-4 minutes",
  "temperature": "80-85C",
  "tastingNotes": ["Floral", "Muscatel", "Green grape"],
  "certifications": ["Organic", "Single Estate"]
}
```

**Dependencies:** None

**Testing Notes:**
- Test migration on local database
- Test slug auto-generation
- Test slug uniqueness constraint
- Test JSONB storage and retrieval
- Verify backward compatibility (existing products still work)

---

## User Story 6.1.2: Multilanguage Content Support

**As a** business manager
**I want to** store product content in multiple languages (Dutch, English)
**So that** I can serve both local and international customers

**Priority:** HIGH
**Estimate:** 8 story points

**Acceptance Criteria:**
- [ ] Create `product_translations` table
- [ ] Support languages: `nl` (Dutch), `en` (English)
- [ ] Translatable fields:
  - name
  - shortDescription
  - description
  - features (JSONB array)
  - seoTitle
  - seoDescription
- [ ] Fallback to default language if translation missing
- [ ] Default language: Dutch (`nl`)
- [ ] Language selector in header
- [ ] Language preference stored in localStorage/cookie
- [ ] All storefront pages respect language selection

**Database Schema:**
```sql
-- Language reference table
CREATE TABLE languages (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);

INSERT INTO languages (code, name, native_name, is_default) VALUES
  ('nl', 'Dutch', 'Nederlands', TRUE),
  ('en', 'English', 'English', FALSE);

-- Product translations table
CREATE TABLE product_translations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  features JSONB,
  seo_title TEXT,
  seo_description TEXT,
  creation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  modification_date TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, language_code)
);

CREATE INDEX idx_product_translations_product ON product_translations(product_id);
CREATE INDEX idx_product_translations_language ON product_translations(language_code);

-- Migrate existing Dutch names to translations
INSERT INTO product_translations (product_id, language_code, name, creation_date)
SELECT id, 'nl', name_dutch, NOW()
FROM product
WHERE name_dutch IS NOT NULL;
```

**API Design:**
- `GET /api/products?lang=nl` - fetch products with Dutch translations
- `GET /api/products/:id?lang=en` - fetch single product with English translation
- `POST /api/products/:id/translations` - add/update translation

**Response Format:**
```json
{
  "id": 123,
  "slug": "ethiopia-yirgacheffe-natural",
  "name": "Ethiopia Yirgacheffe Natural",
  "shortDescription": "Light roast with fruity complexity and floral notes",
  "description": "This exceptional coffee from the Yirgacheffe region...",
  "features": [
    "Single Origin from Ethiopia",
    "Light roast for fruity complexity"
  ],
  "specifications": {...},
  "translations": {
    "nl": {
      "name": "Ethiopie Yirgacheffe Natural",
      "shortDescription": "Lichte branding met fruitige complexiteit",
      "description": "Deze uitzonderlijke koffie uit de Yirgacheffe regio..."
    },
    "en": {...}
  }
}
```

**Dependencies:**
- User Story 6.1.1 (Product content fields must exist)

**Testing Notes:**
- Test translation storage
- Test fallback to default language
- Test language switching on frontend
- Test API with different lang parameters
- Verify migration of existing nameDutch data

---

## User Story 6.1.3: Product Media Gallery

**As a** business manager
**I want to** upload multiple images per product
**So that** customers can see products from different angles

**Priority:** MEDIUM
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] Create `product_media` table
- [ ] Support media types: image (video future enhancement)
- [ ] Multiple images per product (up to 10)
- [ ] Image upload with automatic resizing:
  - Thumbnail: 300x300px
  - Medium: 800x800px
  - Large: 1600x1600px
- [ ] Primary image flag (first image shown in listings)
- [ ] Sort order for media gallery
- [ ] Media file storage (local filesystem or cloud)
- [ ] Delete product media when product deleted (CASCADE)

**Database Schema:**
```sql
CREATE TABLE product_media (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  medium_url TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  alt_text TEXT,
  creation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  modification_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_media_product ON product_media(product_id);
CREATE UNIQUE INDEX idx_product_media_one_primary
  ON product_media(product_id) WHERE is_primary = TRUE;
```

**Technical Implementation:**
- Image Upload: multer for file uploads
- Image Processing: sharp library for resizing
- Storage: Local filesystem (`/uploads/products/`) or AWS S3
- API: POST `/api/products/:id/media`, DELETE `/api/products/:id/media/:mediaId`

**Dependencies:** User Story 6.1.1

**Testing Notes:**
- Test image upload
- Test automatic resizing
- Test primary image constraint
- Test media deletion
- Test sort order

---

## User Story 6.1.4: Product Admin UI - Content Management

**As a** business manager
**I want to** manage product content, translations, and media from admin panel
**So that** I can easily update the webshop

**Priority:** HIGH
**Estimate:** 8 story points

**Acceptance Criteria:**
- [ ] Product detail page has "Webshop Content" tab
- [ ] Content sections:
  - SEO: slug, seoTitle, seoDescription
  - Short description (textarea, 160 char limit)
  - Description (rich text editor)
  - Features (dynamic list)
  - Specifications (key-value pairs based on product type)
  - Published/Featured toggles
- [ ] Translations section:
  - Language tabs (Dutch, English)
  - Edit per language
  - "Copy from Dutch" button
- [ ] Media gallery:
  - Drag-and-drop upload
  - Image previews
  - Set primary image
  - Reorder images
  - Delete images
  - Alt text fields
- [ ] Live preview button
- [ ] Validation: unique slug, short description max 160 chars
- [ ] Auto-save draft (localStorage)

**Technical Implementation:**
- Rich Text Editor: TipTap or markdown editor
- Drag-and-Drop: react-dropzone
- Image Sorting: dnd-kit
- Components: WebshopContentTab, SEOSection, DescriptionEditor, FeaturesList, SpecificationsEditor, TranslationsEditor, MediaGallery

**Dependencies:** User Story 6.1.1, 6.1.2, 6.1.3

**Testing Notes:**
- Test content editing
- Test translation editing
- Test media upload/management
- Test validation
- Test auto-save
- Test live preview
