# Tech Stack

- **Backend**: Express.js + TypeScript + Drizzle ORM + PostgreSQL (Neon) + Supabase Auth
- **Frontend**: React 18 + TypeScript + Vite + Tailwind + Radix/shadcn + TanStack Query + Wouter
- **Testing**: Vitest (only 2 test files — expanding coverage is a priority)
- **Deployment**: Vercel (frontend) + Google Cloud Run (Docker, backend)
- **Schema**: `shared/schema.ts` — Drizzle tables with UUID PKs, Zod insert schemas

## Build & Test Commands
- `npm run dev` — start development server
- `npm run build` — production build (Vite for client, ESBuild for server)
- `npm run test` — run Vitest tests
- `npx drizzle-kit generate` — generate database migration
- `npx drizzle-kit push` — push schema changes to database
