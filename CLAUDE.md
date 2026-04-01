# CLAUDE.md -- AnglerPass

## Project Overview

AnglerPass is a SaaS platform for private fly fishing access. It connects landowners, clubs, and anglers. Currently at Layer 1: marketing site, auth, dashboard shells, Supabase integration.

**Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (Auth + Postgres + Storage), React Hook Form + Zod.

## Key Conventions

### Styling — STRICT RULES
- **NEVER use inline `style={{}}` attributes.** All styling must use Tailwind CSS classes. This is non-negotiable for every file except homepage components.
- **NEVER use raw color values** (`#hex`, `rgb()`, `rgba()`). Use Tailwind design tokens: `text-forest`, `bg-bronze`, `border-parchment`, etc. For opacity variants use `bg-forest/10`, `text-white/50`.
- **Homepage uses bespoke CSS** (`src/app/(marketing)/homepage.css`), NOT Tailwind. Do not convert homepage components to Tailwind. Do not add Tailwind classes to homepage components.
- All other pages use Tailwind CSS v4 + shadcn/ui components.
- Color tokens defined in `globals.css` via `@theme`: `forest`, `forest-deep`, `river`, `river-light`, `river-pale`, `stone`, `stone-light`, `sand`, `parchment`, `parchment-light`, `offwhite`, `bronze`, `bronze-light`, `charcoal`, `text-primary`, `text-secondary`, `text-light`.
- Font tokens as Tailwind classes: `font-heading` (Cormorant Garamond), `font-body` (DM Sans), `font-mono` (DM Mono).
- Audience color coding: **forest = landowners**, **river = clubs**, **bronze = anglers**, **charcoal = guides**.
- Use Tailwind v4 syntax: `bg-linear-to-r` (not `bg-gradient-to-r`), `shrink-0` (not `flex-shrink-0`), `grow` (not `flex-grow`).

### Route Groups
- `(marketing)` -- public pages, homepage, audience pages, legal
- `(auth)` -- login, signup, password flows
- `(dashboard)` -- role-based dashboards (landowner, club, angler)
- `(admin)` -- admin panel

### React 19 / Next.js 16 Standards
- **Server Components by default.** Only add `"use client"` when the component needs event handlers, hooks, or browser APIs.
- **`ref` is a regular prop** in React 19. Never use `React.forwardRef` in custom components.
- **`useActionState`** for form submission state (not the deprecated `useFormState`).
- **`use(promise)`** in server components for data fetching instead of `useEffect` + `useState`.
- **Prefer Server Actions** for mutations over client-side fetch to API routes where appropriate.
- React Compiler (supported in Next.js 16) auto-memoizes — don't add `useMemo`/`useCallback` unless genuinely needed for expensive computations or external API referential stability.

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

### API Routes
- Use helpers from `src/lib/api/helpers.ts`: `jsonOk()`, `jsonCreated()`, `jsonError()`, `requireAuth()`, `requirePropertyOwner()`, `requireClubManager()`, `escapeIlike()`.
- Always validate inputs with Zod schemas.
- Use `createClient()` (server) for auth checks, `createAdminClient()` for data operations in API routes.
- **Never use `as any` or `as never`** to work around Supabase types. Use the admin client instead.
- Always escape user input in `ilike` queries with `escapeIlike()`.
- Return consistent response shapes: `jsonOk({ resource })` for success, `jsonError("message", status)` for errors.

## File Organization

```
src/components/homepage/    # Homepage-only components (bespoke CSS)
src/components/shared/      # Shared: DashboardShell, EmptyState, StatusBadge, LoadingSpinner, nav, footer
src/components/angler/      # Angler-specific: BookingForm, ClubBrowser, FeeBreakdown, GuidesSection
src/components/clubs/       # Club-specific: ClubFaqSection, MigrationForm, MemberCard, InviteForm
src/components/guide/       # Guide-specific: GuideProfileForm, GuideCredentials
src/components/properties/  # Property: PropertyForm, PhotoUpload, PhotoLightbox, CalendarSubscription
src/components/map/         # Map: PropertyMap, PropertyCard, SearchFilters
src/components/icons/       # AnglerPassLogo
src/components/ui/          # shadcn/ui primitives (button, card, input, etc.)
src/hooks/                  # Custom React hooks
src/lib/supabase/           # Supabase client utilities
src/lib/api/helpers.ts      # API response helpers, auth helpers, escapeIlike
src/lib/validations/        # Zod schemas
src/lib/constants/          # Centralized constants (fees.ts, status.ts, water-types.ts)
src/lib/constants.ts        # Site config (name, URLs, emails)
src/lib/utils.ts            # cn() helper
src/types/                  # TypeScript types, Supabase database types
middleware.ts               # Root middleware (auth route protection)
supabase/migrations/        # SQL migrations
docs/architecture/          # Architecture docs
docs/adr/                   # Architecture decision records
```

### Code Quality Rules
- **No component over ~300 lines.** Extract sub-components into the relevant `src/components/` directory.
- **No duplicated constants.** Check `src/lib/constants/` before defining labels, configs, or mappings inline.
- **Use shared components:** `EmptyState`, `StatusBadge`, `LoadingSpinner` instead of repeating patterns.
- **All error messages must be accessible:** `role="alert" aria-live="polite"` on error containers.
- **All modals need:** `role="dialog" aria-modal="true" aria-label="..."`.
- **All icon-only buttons need:** `aria-label="..."`.
- **Strict TypeScript.** No `any`, no `never` casts, no `// @ts-ignore`. Fix the types properly.

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
