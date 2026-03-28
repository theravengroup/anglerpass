# AnglerPass -- Private Water Access, Modernized

## What is AnglerPass

AnglerPass is the operating platform for private fly fishing access. It connects landowners who control premium water, clubs that manage memberships and access, and anglers seeking quality fishing experiences. One platform to manage properties, bookings, memberships, and fishing days.

## Current Status

**Layer 1 is complete.** The foundation is in place: a premium marketing site, authentication system, role-based dashboard shells, Supabase integration, and full architecture documentation. The platform is ready for Layer 2 feature buildout.

## Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Framework, SSR, routing |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui (Radix primitives) | Component library |
| Supabase | Auth, Postgres database, Storage |
| React Hook Form + Zod | Form handling and validation |
| Lucide React | Icons |
| Vercel | Deployment target |

## Project Structure

```
src/
  app/
    (marketing)/          # Public pages: homepage, audience pages, FAQ, legal
    (auth)/               # Login, signup, forgot/reset password
    (dashboard)/          # Role-based dashboards: landowner, club, angler
    (admin)/              # Admin panel: users, moderation
    api/leads/            # Lead capture API route
    auth/callback/        # Supabase auth callback handler
    layout.tsx            # Root layout (fonts, metadata)
    globals.css           # Design tokens, base styles
  components/
    homepage/             # Homepage-specific components (bespoke CSS)
    shared/               # Shared layout components (nav, footer, dashboard shell)
    icons/                # Brand icons (AnglerPass logo)
    ui/                   # shadcn/ui primitives
  hooks/                  # Custom React hooks
  lib/
    supabase/             # Supabase client utilities (client, server, admin, middleware)
    validations/          # Zod schemas
    constants.ts          # Site config
    utils.ts              # Utility functions (cn helper)
  types/                  # TypeScript types and Supabase DB types
middleware.ts             # Auth middleware (route protection)
supabase/
  migrations/             # SQL migrations (leads, profiles, properties, audit_log)
docs/
  architecture/           # Architecture decision documents
  adr/                    # Architecture decision records
```

## Getting Started

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd AnglerPass
   npm install
   ```

2. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Copy `.env.example` to `.env.local` and fill in your Supabase credentials

3. **Run migrations**
   ```bash
   supabase db push
   ```
   Or apply the SQL files in `supabase/migrations/` manually through the Supabase dashboard.

4. **Run the dev server**
   ```bash
   npm run dev
   ```

5. **Visit** [http://localhost:3000](http://localhost:3000)

## Routes

| Route | Description |
|---|---|
| `/` | Homepage (premium marketing landing page) |
| `/landowners` | Landowner audience page |
| `/clubs` | Club audience page |
| `/anglers` | Angler audience page |
| `/faq` | Frequently asked questions |
| `/contact` | Contact form |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Password recovery |
| `/reset-password` | Set new password |
| `/dashboard` | General dashboard (authenticated) |
| `/landowner` | Landowner dashboard |
| `/landowner/properties` | Property management |
| `/club` | Club dashboard |
| `/club/members` | Member management |
| `/angler` | Angler dashboard |
| `/angler/bookings` | Booking management |
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/moderation` | Content moderation |
| `/api/leads` | Lead capture endpoint (POST) |
| `/auth/callback` | Supabase auth callback |

## Layer 1 (Complete)

- Premium homepage with scroll-driven animations and waitlist capture
- Audience-specific marketing pages (landowners, clubs, anglers)
- FAQ, contact, privacy, and terms pages
- Supabase authentication (email/password, magic link, OAuth-ready)
- Auth middleware protecting dashboard and admin routes
- Role-based dashboard shells (landowner, club, angler)
- Admin panel shell (users, moderation)
- Lead capture API with Zod validation
- Supabase database migrations (leads, profiles, properties stub, audit log)
- Shared layout system (marketing nav/footer, dashboard sidebar/topbar)
- Full design token system (colors, fonts, spacing)
- Architecture documentation structure

## Layer 2 (Planned)

- Property management (CRUD, photos, maps, availability calendars)
- Booking engine (search, reserve, confirm, manage)
- Payments via Stripe Connect (landowner payouts, platform fees)
- Club membership management (tiers, invitations, rosters)
- Angler profiles (preferences, trip history, reviews)
- Search and discovery (filters, map-based browsing)
- Maps integration (Mapbox for property boundaries, access points)
- Moderation workflows (property approval, content review)
- Notifications (Resend for email, Twilio for SMS)
- Documents and e-signatures (waivers, agreements)
- Analytics dashboards (property owners, platform admin)

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

Copy `.env.example` to `.env.local` and fill in your values. Never commit `.env.local`.

## Deployment

AnglerPass is configured for Vercel deployment.

1. Push the repository to GitHub
2. Connect the repo in Vercel
3. Add environment variables in the Vercel dashboard
4. Deploy

The standard Next.js build output works out of the box. No custom server required.

## Architecture Docs

Architecture documentation lives in `/docs/architecture/` and `/docs/adr/`. These directories are structured for the following planned documents:

- System architecture overview
- Database schema design
- Authentication and authorization model
- API design patterns
- Frontend architecture
- Deployment and infrastructure
- Architecture decision records (ADRs)

## Contributing

AnglerPass is a private project. This repository is not open to outside contributions.
