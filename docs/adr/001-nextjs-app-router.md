# ADR 001: Next.js App Router

## Status

Accepted

## Context

AnglerPass is a SaaS platform with three distinct surface areas: a marketing site (homepage, landing pages), authenticated dashboards (landowner, club admin, angler), and an admin console. We needed a full-stack React framework that supports:

- Server-side rendering for SEO on marketing pages
- Authenticated server components for dashboards (no client-side data fetching waterfalls)
- API routes for form submissions, webhook handlers, and Stripe integration
- Route-level code splitting and layouts
- Strong TypeScript support
- A large ecosystem and active maintenance

The main contenders were:

1. **Next.js App Router** (React Server Components, nested layouts, server actions)
2. **Next.js Pages Router** (stable, well-documented, but legacy architecture)
3. **Remix** (loader/action model, nested routes, strong data conventions)
4. **Vite + React Router** (lightweight, no SSR by default)

## Decision

We chose **Next.js App Router** (Next.js 15+, React 19).

### Why App Router over Pages Router

- **Server Components by default.** Dashboard pages fetch data on the server without shipping Supabase client code to the browser. This reduces bundle size and eliminates loading spinners for initial data.
- **Nested layouts.** The `(marketing)`, `(auth)`, `(dashboard)`, and `(admin)` route groups each have their own layout. In Pages Router, this requires `getLayout` patterns that are awkward and poorly typed.
- **Streaming and Suspense.** Long-running queries (e.g., the admin moderation queue) can stream partial results without blocking the entire page.
- **Server Actions.** Form mutations (booking requests, profile updates) can use server actions instead of manually wiring API routes, reducing boilerplate.
- **Future-proof.** The React team has signaled that Server Components are the future of React. Building on App Router avoids a migration later.

### Why not Remix

- Remix has excellent data-loading conventions, but its ecosystem is smaller than Next.js. Finding examples, libraries, and deployment guides is harder.
- Supabase's official SSR package (`@supabase/ssr`) has first-class Next.js middleware support. Remix integration exists but is less documented.
- Vercel deployment (our hosting choice) is optimized for Next.js with zero-config edge middleware, ISR, and image optimization.
- At the time of decision (2024), Remix was mid-transition to React Router v7, creating uncertainty about its API stability.

### Why not Vite + React Router

- No built-in SSR means the marketing site would not be indexed well by search engines without additional setup (or a separate static site).
- No API routes means we would need a separate backend service for webhooks and form handling.
- AnglerPass is a full-stack application, not a SPA. A framework that handles both frontend and backend concerns reduces operational complexity.

## Consequences

### Positive

- Single codebase for marketing, dashboards, admin, API routes, and webhooks.
- Server Components reduce client bundle size and eliminate most loading states for authenticated pages.
- Route groups provide clean separation between public and authenticated areas.
- Middleware handles auth token refresh for every request automatically.
- Vercel deployment is zero-config with preview deployments on every PR.

### Negative

- App Router is newer and has a steeper learning curve than Pages Router. Some patterns (caching, revalidation) have changed multiple times across Next.js versions.
- The `"use client"` boundary requires careful thought about where to place interactive components. Dashboard layouts use `"use client"` for sidebar state, which means all child components are also client components unless structured carefully.
- Error handling in Server Components is less intuitive than in client-side React (no try/catch around JSX).
- Some third-party libraries are not yet fully compatible with Server Components and require wrapper components with `"use client"`.

### Risks

- If Next.js makes breaking changes to App Router APIs, we may need to update code across many files. Mitigated by pinning the Next.js version and updating deliberately.
- Vendor lock-in to Vercel for optimal performance. Mitigated by the fact that Next.js can be self-hosted, and we do not use Vercel-specific features beyond deployment.
