# ADR 002: Homepage CSS Strategy

## Status

Accepted

## Context

The AnglerPass homepage was designed and built as a high-fidelity marketing page with custom animations, scroll-reveal effects, and a distinct visual identity (Cormorant Garamond headings, DM Sans body, earthy color palette). The CSS was authored as a single `homepage.css` file (~400 lines) using CSS custom properties, keyframe animations, and hand-tuned responsive breakpoints.

When we introduced Tailwind CSS (v4) for the dashboard and admin pages, we had to decide what to do with the existing homepage CSS:

1. **Convert homepage.css to Tailwind utility classes** across all homepage components
2. **Keep homepage.css as-is** and use Tailwind only for new pages
3. **Gradually migrate** homepage CSS to Tailwind over time

## Decision

We chose to **keep `homepage.css` verbatim** and scope it to the `(marketing)` route group via its layout. New pages (dashboard, admin, auth) use Tailwind exclusively.

### Why preserve the homepage CSS

- **The homepage works.** It was designed pixel-perfect with specific animations (scroll reveals, cinematic dividers, hero mockup) that would be tedious and error-prone to recreate in Tailwind. Converting 400 lines of hand-authored CSS into utility classes across 15+ components risks visual regressions with no user-facing benefit.

- **Custom animations are cleaner in CSS.** The homepage uses `@keyframes` for scroll-triggered reveals, gradient transitions, and staggered entrance animations. These are more readable and maintainable as named keyframes in a CSS file than as Tailwind `animate-[...]` arbitrary values.

- **CSS custom properties drive the design system.** The homepage defines `--color-forest`, `--color-gold`, `--color-parchment`, `--color-river`, etc. These are referenced by both the homepage CSS and the Tailwind theme (via `theme.extend`). Keeping the source of truth in CSS custom properties means both systems share the same palette without duplication.

- **Scoped loading.** The `(marketing)/layout.tsx` imports `homepage.css`. Because of Next.js route group isolation, this CSS is only loaded on marketing pages. Dashboard users never download it. There is no performance cost to keeping it separate.

- **Time is better spent on Layer 2 features.** Converting CSS is pure refactoring with zero product value. The homepage is stable and rarely changes. Developer time is better spent building the booking engine, payment flows, and moderation tools.

### Why not gradually migrate

- Partial migration creates a worse situation than either extreme: some homepage components use Tailwind, others use CSS classes, and developers have to check both systems when making changes.
- The homepage is a cohesive unit. It either all uses Tailwind or all uses custom CSS. Mixing creates confusion about which approach to use for new homepage sections.

## Consequences

### Positive

- Zero risk of visual regression on the homepage during the Tailwind adoption.
- Clear boundary: marketing pages use `homepage.css`, everything else uses Tailwind.
- Faster development -- no time spent on cosmetic refactoring.
- CSS custom properties (`--color-*`, `--font-*`) serve as a shared design token layer between both approaches.

### Negative

- Developers working on homepage components need to read CSS files rather than Tailwind utilities. This is a different mental model than the rest of the app.
- If the homepage design evolves significantly, the CSS file may grow unwieldy. At that point, a Tailwind conversion may be warranted.
- Two styling systems in one codebase increases the learning curve for new contributors.

### Migration Trigger

If the homepage needs a significant redesign (new sections, layout overhaul), we will convert to Tailwind at that time rather than patching the existing CSS. Until then, leave it alone.
