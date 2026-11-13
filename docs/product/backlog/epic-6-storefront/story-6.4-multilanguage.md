# Story 6.4 — Multilanguage Infrastructure

## User Story 6.4.1: Language Switcher

**As a** customer
**I want to** switch between Dutch and English
**So that** I can read in my preferred language

**Priority:** HIGH
**Estimate:** 3 story points

**Acceptance Criteria:**
- [ ] Language switcher in header (NL / EN)
- [ ] Current language highlighted
- [ ] Click switches entire site
- [ ] Preference in cookie/localStorage
- [ ] Persists across navigation
- [ ] Affects: product content, UI labels, categories
- [ ] URL with lang: `/nl/shop/coffee` vs `/en/shop/coffee`
- [ ] Fallback to Dutch if translation missing

**Technical Implementation:**
- i18n: react-i18next
- Detection: URL -> cookie -> browser -> default Dutch
- Routes: `/:lang/shop/:category`
- Translation files: `/locales/nl/common.json`, `/locales/en/common.json`

**Dependencies:** User Story 6.1.2

**Testing Notes:**
- Test switching
- Test persistence
- Test URL param
- Test fallback
- Test UI translations
- Test product translations

---

## User Story 6.4.2: Static Content Translation

**As a** business manager
**I want to** manage translations for static pages
**So that** I provide consistent multilanguage content

**Priority:** MEDIUM
**Estimate:** 5 story points

**Acceptance Criteria:**
- [ ] `page_translations` table for CMS content
- [ ] Translatable pages: homepage, about, sustainability, FAQ, shipping, terms, privacy
- [ ] Admin UI to edit page translations
- [ ] Rich text editor
- [ ] Preview button
- [ ] Version history (optional)

**Database:**
```sql
CREATE TABLE pages (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  template TEXT NOT NULL,
  published BOOLEAN DEFAULT TRUE,
  creation_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE page_translations (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES pages(id),
  language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  creation_date TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(page_id, language_code)
);
```

**Dependencies:** User Story 6.4.1

**Testing Notes:**
- Test page editing
- Test content rendering
- Test SEO fields
- Test preview
