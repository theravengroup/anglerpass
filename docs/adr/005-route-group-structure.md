# ADR 005: Route Group Structure

## Status

Accepted

## Context

AnglerPass has four distinct areas of the application, each with different layouts, authentication requirements, and styling:

1. **Marketing**: Public-facing homepage and landing pages. Custom CSS, no auth required.
2. **Auth**: Login, signup, forgot password, reset password. Centered card layout, no dashboard chrome.
3. **Dashboard**: Authenticated user dashboards for landowners, club admins, and anglers. Sidebar + topbar layout.
4. **Admin**: Platform administration console. Similar sidebar layout but with admin-specific navigation and an admin badge.

Next.js App Router supports **route groups** -- directories wrapped in parentheses like `(marketing)` -- that create layout boundaries without affecting the URL path. We needed to decide how to organize these areas.

### Options Considered

1. **Four route groups**: `(marketing)`, `(auth)`, `(dashboard)`, `(admin)`
2. **Two route groups** (`(public)`, `(app)`) with nested sub-layouts
3. **No route groups**, single layout with conditional rendering based on pathname
4. **Separate Next.js apps** per area (monorepo with shared packages)

## Decision

We use **four route groups** at the top level of `src/app/`:

```
src/app/
  (marketing)/       -- Public marketing pages
    layout.tsx       -- Imports homepage.css, wraps in ScrollRevealProvider
    page.tsx         -- Homepage
    anglers/
    clubs/
    landowners/
    faq/
    contact/
    privacy/
    terms/

  (auth)/            -- Authentication pages
    layout.tsx       -- Centered card layout with logo
    login/
    signup/
    forgot-password/
    reset-password/

  (dashboard)/       -- Authenticated user dashboards
    layout.tsx       -- DashboardShell with sidebar + topbar
    dashboard/       -- Main dashboard page
    landowner/       -- Landowner-specific pages
      properties/
    club/            -- Club admin pages
      members/
    angler/          -- Angler pages
      bookings/

  (admin)/           -- Admin console
    layout.tsx       -- DashboardShell with admin sidebar + badge
    admin/           -- Admin pages
      moderation/
      users/

  layout.tsx         -- Root layout (fonts, metadata, global CSS)
  api/               -- API routes (not in a route group)
    leads/
  auth/              -- Auth callback (not in a route group)
    callback/
```

### Why four groups

- **Each group has a genuinely different layout.** Marketing uses `ScrollRevealProvider` + `homepage.css`. Auth uses a centered card. Dashboard uses `DashboardShell` with user nav. Admin uses `DashboardShell` with admin nav and a badge. These are not minor variations -- they are structurally different page shells.

- **CSS isolation.** The `(marketing)` layout imports `homepage.css`, which defines styles that should not leak into dashboard or admin pages. Route groups ensure this CSS is only loaded when a user visits marketing pages.

- **Auth boundary clarity.** The `(dashboard)` and `(admin)` layouts will add auth checks (redirect to login if unauthenticated). The `(marketing)` and `(auth)` groups have no auth requirement. Separating them into groups makes the auth boundary explicit in the file structure.

- **Independent loading states.** Each route group can define its own `loading.tsx` and `error.tsx`. The marketing site shows a minimal skeleton, while the dashboard shows a sidebar + content area skeleton.

### Why `admin/` is nested inside `(admin)/` instead of being its own route group

The URL path for admin pages is `/admin/...`. In Next.js App Router, the route group `(admin)` provides the layout but does not affect the URL. The actual URL segment comes from the `admin/` directory inside it. This pattern gives us:

- URL: `/admin/moderation` (clean, expected)
- Layout: `(admin)/layout.tsx` (admin-specific shell)
- No conflict with the `(dashboard)` layout

If we put `admin/` at the top level without a route group, it would inherit the root layout directly, with no way to wrap it in the admin-specific `DashboardShell`.

### Why `api/` and `auth/callback/` are NOT in route groups

- `api/` contains API routes (`leads/route.ts`). These do not render HTML and do not need a layout. Putting them in a route group would add unnecessary nesting.
- `auth/callback/` is the Supabase OAuth callback handler. It redirects the user after authentication and does not render a visible page. It belongs at the root level so its URL is `/auth/callback`, matching Supabase's expected redirect path.

### Why not two groups (`(public)`, `(app)`)

- The auth pages need a different layout from both marketing and dashboard. With two groups, we would need conditional layout logic inside `(public)` to switch between the marketing layout and the auth layout. Three or four groups avoids conditionals entirely.

### Why not conditional rendering in a single layout

- A single `layout.tsx` that checks `pathname` to decide which shell to render is fragile, hard to test, and defeats the purpose of Next.js's layout system. Route groups exist precisely to solve this problem.

### Why not separate Next.js apps

- Overkill at this stage. The app is small enough that a single Next.js app with route groups provides clean separation without the complexity of a monorepo, shared packages, or cross-app authentication.
- Deploying one app is simpler than orchestrating multiple deploys.
- Shared components (`src/components/shared/`, `src/components/ui/`) are used across dashboard and admin. In a monorepo, these would need to be extracted into a package.

## Consequences

### Positive

- File structure mirrors the user experience. Looking at `src/app/` immediately reveals the four areas of the product.
- Layout inheritance is predictable. Each route group has exactly one layout, and it is obvious which layout applies to any given page.
- CSS is scoped. Homepage styles do not affect dashboards. Dashboard Tailwind classes do not conflict with marketing custom CSS.
- Auth requirements are enforced at the layout level, not sprinkled throughout individual pages.
- Adding new pages is straightforward: create a directory in the appropriate route group.

### Negative

- Four route groups mean four `layout.tsx` files to maintain. For a solo founder this is manageable; for a larger team, documentation is needed to explain the structure (this ADR serves that purpose).
- Some shared concepts (like the `DashboardShell` component) are used by both `(dashboard)` and `(admin)`, which creates a dependency between the two groups. This is managed via `src/components/shared/DashboardShell.tsx` rather than duplicating the component.
- The `(dashboard)` group contains role-specific directories (`landowner/`, `club/`, `angler/`) that may grow complex. If any role's pages become numerous, they could be elevated to their own route group. For now, the single `(dashboard)` group with sub-directories is sufficient.

### Route Map

| URL Path                 | Route Group    | Layout                                  |
|--------------------------|----------------|-----------------------------------------|
| `/`                      | `(marketing)`  | ScrollRevealProvider + homepage.css      |
| `/anglers`               | `(marketing)`  | Same                                    |
| `/clubs`                 | `(marketing)`  | Same                                    |
| `/landowners`            | `(marketing)`  | Same                                    |
| `/faq`                   | `(marketing)`  | Same                                    |
| `/contact`               | `(marketing)`  | Same                                    |
| `/privacy`               | `(marketing)`  | Same                                    |
| `/terms`                 | `(marketing)`  | Same                                    |
| `/login`                 | `(auth)`       | Centered card with logo                 |
| `/signup`                | `(auth)`       | Same                                    |
| `/forgot-password`       | `(auth)`       | Same                                    |
| `/reset-password`        | `(auth)`       | Same                                    |
| `/dashboard`             | `(dashboard)`  | DashboardShell (user sidebar)           |
| `/landowner/properties`  | `(dashboard)`  | Same                                    |
| `/club/members`          | `(dashboard)`  | Same                                    |
| `/angler/bookings`       | `(dashboard)`  | Same                                    |
| `/admin`                 | `(admin)`      | DashboardShell (admin sidebar + badge)  |
| `/admin/moderation`      | `(admin)`      | Same                                    |
| `/admin/users`           | `(admin)`      | Same                                    |
| `/api/leads`             | (none)         | API route, no layout                    |
| `/auth/callback`         | (none)         | Redirect handler, no layout             |
