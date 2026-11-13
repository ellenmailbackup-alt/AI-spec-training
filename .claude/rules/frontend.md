---
paths:
  - "client/**/*.{ts,tsx}"
---

# Frontend Rules for React Code

Reference: `docs/design/design_guidelines.md`

## Design System
- **Brand colors**: Primary Brown #8A6959, Soft Peach #E8BF9C, Golden Beige #CCA693, Off-White #F1F2ED
- **Typography**: Inter (UI), Playfair Display (headers), JetBrains Mono (data)
- **Components**: shadcn/ui with Radix UI primitives
- **Layout**: AdminLTE for admin, premium e-commerce for storefront, touch-optimized for POS

## Formatting
- **Numbers**: nl-BE locale (comma as decimal separator)
- **Currency**: `€ 26,40` (euro symbol, space, amount)
- **Dates**: Use locale-aware formatting

## Component Patterns
- Use shadcn/ui components (Button, Dialog, Card, Table, etc.)
- Delete confirmations: AlertDialog with AlertTriangle icon (text-destructive)
- Edit buttons: yellow background
- Delete buttons: destructive variant
- Forms: React Hook Form + Zod validation
- Data fetching: TanStack Query (`useQuery`, `useMutation`)
- Routing: Wouter (NOT React Router)

## State Management
- Server state: TanStack Query
- Form state: React Hook Form
- Local state: React hooks (useState, useReducer)
- No global state libraries

## Three SPAs
- Admin: `client/src/pages/admin/` — business management
- Storefront: `client/src/pages/storefront/` — customer-facing e-commerce
- POS: `client/src/pages/pos/` — in-store point of sale
