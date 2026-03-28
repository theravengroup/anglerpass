# CLAUDE.md -- AnglerPass

## Project Overview

AnglerPass is a SaaS platform for private fly fishing access. It connects landowners, clubs, and anglers. Currently at Layer 1: marketing site, auth, dashboard shells, Supabase integration.

**Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (Auth + Postgres + Storage), React Hook Form + Zod.

## Key Conventions

### Styling
- **Homepage uses bespoke CSS** (`src/app/(marketing)/homepage.css`), NOT Tailwind. Do not convert homepage components to Tailwind. Do not add Tailwind classes to homepage components.
- All other pages use Tailwind CSS v4 + shadcn/ui components.
- Color tokens defined in `globals.css` via `@theme`: `forest`, `forest-deep`, `river`, `river-light`, `river-pale`, `stone`, `sand`, `parchment`, `offwhite`, `bronze`, `charcoal`.
- Font variables: `--font-heading` (Cormorant Garamond), `--font-body` (DM Sans), `--font-mono` (DM Mono).
- Audience color coding: **forest = landowners**, **river = clubs**, **bronze = anglers**.

### Route Groups
- `(marketing)` -- public pages, homepage, audience pages, legal
- `(auth)` -- login, signup, password flows
- `(dashboard)` -- role-based dashboards (landowner, club, angler)
- `(admin)` -- admin panel

### Forms
- React Hook Form + Zod for all forms.
- Validation schemas in `src/lib/validations/`.

### Supabase
- Four client utilities in `src/lib/supabase/`:
  - `client.ts` -- browser-side client (client components)
  - `server.ts` -- server components and server actions
  - `admin.ts` -- service-role client for API routes only
  - `middleware.ts` -- session refresh for middleware
- All database access uses Row Level Security. The service-role client (`admin.ts`) bypasses RLS and must only be used in API routes.
- Auth callback handler at `src/app/auth/callback/route.ts`.
- Root `middleware.ts` protects `/dashboard`, `/landowner`, `/club`, `/angler`, `/admin` routes.

### API
- Lead capture endpoint: `src/app/api/leads/route.ts` (POST).
- Uses Zod validation and the admin Supabase client.

## File Organization

```
src/components/homepage/    # Homepage-only components (bespoke CSS)
src/components/shared/      # Shared layouts: DashboardShell, MarketingLayout, nav, footer
src/components/icons/       # AnglerPassLogo
src/components/ui/          # shadcn/ui primitives (button, card, input, etc.)
src/hooks/                  # Custom React hooks
src/lib/supabase/           # Supabase client utilities
src/lib/validations/        # Zod schemas (leads.ts)
src/lib/constants.ts        # Site config (name, URLs, emails)
src/lib/utils.ts            # cn() helper
src/types/                  # TypeScript types, Supabase database types
middleware.ts               # Root middleware (auth route protection)
supabase/migrations/        # SQL migrations (leads, profiles, properties_stub, audit_log)
docs/architecture/          # Architecture docs
docs/adr/                   # Architecture decision records
```

## Important Warnings

- **Do NOT modify homepage CSS or homepage component class names** without understanding the `homepage.css` dependency chain. These components rely on custom CSS, not Tailwind.
- **Do NOT add Tailwind utility classes to homepage components.** They use bespoke CSS.
- **Do NOT install additional component libraries.** Use shadcn/ui and Radix primitives.
- **Do NOT create a separate backend server.** All server logic runs through Next.js API routes and server components.
- **Do NOT use the Supabase service-role client outside of API routes.** It bypasses RLS.

## Database Migrations

Four migrations in `supabase/migrations/`:
1. `00001_create_leads.sql` -- waitlist and contact form leads
2. `00002_create_profiles.sql` -- user profiles linked to auth
3. `00003_create_properties_stub.sql` -- property table placeholder
4. `00004_create_audit_log.sql` -- audit trail

## Testing

No test framework configured yet. Planned for Layer 2.

## Deployment

Vercel. Standard Next.js output. No custom server configuration.

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
