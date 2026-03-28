# ADR 004: shadcn/ui for Component Library

## Status

Accepted

## Context

AnglerPass has two distinct UI surface areas:

1. **Homepage / Marketing pages**: Custom-designed with hand-authored CSS, unique animations, and a premium editorial feel. These are finished and stable.
2. **Dashboard / Admin / Auth pages**: Functional application UI with forms, tables, cards, tabs, sidebars, and data-dense layouts. These are under active development.

For the application UI, we needed a component library that provides:

- Accessible, keyboard-navigable primitives (modals, dropdowns, tabs, selects)
- Tailwind CSS integration (since dashboards use Tailwind)
- Customizable styling (our color palette and typography differ from any default theme)
- TypeScript support
- No runtime CSS-in-JS (conflicts with Server Components)

The contenders:

1. **shadcn/ui** (copy-paste Radix primitives styled with Tailwind)
2. **Radix UI** (unstyled primitives, style-it-yourself)
3. **Material UI (MUI)** (fully styled, opinionated design system)
4. **Headless UI** (Tailwind Labs' unstyled primitives)

## Decision

We chose **shadcn/ui** for all new application pages. The homepage retains its custom CSS components.

### Why shadcn/ui

- **Copy-paste, not npm dependency.** Components are added to `src/components/ui/` as source files. We own the code and can modify it freely. No waiting for upstream releases to fix bugs or adjust behavior. Components currently in the codebase: `accordion`, `avatar`, `badge`, `button`, `card`, `input`, `label`, `select`, `separator`, `sheet`, `tabs`, `textarea`.

- **Built on Radix primitives.** shadcn/ui wraps Radix UI under the hood, inheriting its accessibility (ARIA attributes, keyboard navigation, focus management). We get Radix's quality without the styling overhead.

- **Tailwind-native.** Components use `class-variance-authority` (CVA) for variant management and `tailwind-merge` for class deduplication. This matches our Tailwind-based dashboard styling approach. No conflicting styling systems.

- **Consistent with our stack.** The AnglerPass dashboard uses `clsx`, `tailwind-merge`, and `class-variance-authority` -- all tools that shadcn/ui is built on. Adding shadcn components feels native, not bolted-on.

- **Minimal bundle size.** Because components are source code (not a library import), tree-shaking is guaranteed. We only ship the components we actually use. No 200KB MUI bundle for a few buttons and cards.

- **Active ecosystem.** shadcn/ui has become the de facto standard in the Next.js community. Finding examples, patterns, and community extensions is straightforward.

### Why not bare Radix UI

- Radix provides unstyled primitives, which means we would write all the CSS/Tailwind classes ourselves for every component variant. shadcn/ui gives us a well-designed starting point that we customize.
- For a solo founder building fast, the styling boilerplate of bare Radix adds up. shadcn/ui eliminates that without sacrificing customization.

### Why not MUI

- MUI uses Emotion (CSS-in-JS) by default, which has compatibility issues with React Server Components. MUI v6 is working on this, but it is not yet stable.
- MUI's design language (Material Design) does not match AnglerPass's earthy, premium aesthetic. Overriding MUI's deeply nested styles is painful.
- MUI's bundle size is significantly larger. Even with tree-shaking, importing a few MUI components pulls in a substantial runtime.
- MUI's API surface is enormous and opinionated. For a small team, the learning curve is not worth it when simpler alternatives exist.

### Why not Headless UI

- Headless UI has a smaller component set than Radix (no tabs, no accordion, no toast, limited select). We would need to supplement with custom implementations or mix libraries.
- Headless UI is maintained by Tailwind Labs and updates less frequently than Radix. Some components have open accessibility issues.
- shadcn/ui already wraps Radix, which is more comprehensive. Choosing Headless UI would give us less for the same amount of work.

### Why the homepage stays custom

The homepage components (`HeroSection`, `BuiltForSection`, `FeaturesSection`, etc.) were built before shadcn/ui was introduced and use the custom `homepage.css` styling system. Converting them to shadcn/ui components would be a significant refactor with no user-facing benefit. See [ADR 002](./002-homepage-css-strategy.md) for the full rationale.

The boundary is clean: `src/components/homepage/` uses custom CSS, `src/components/ui/` uses shadcn/ui, and `src/components/shared/` uses Tailwind + shadcn/ui components for shared application chrome (sidebar, topbar).

## Consequences

### Positive

- Rapid UI development for dashboards. Adding a new form or data table takes minutes, not hours.
- Full control over component code. When a component does not fit our needs, we edit the source directly rather than fighting an API.
- Accessibility is built in via Radix primitives. We do not need to manually implement ARIA patterns.
- Consistent visual language across all dashboard and admin pages.
- No runtime CSS-in-JS overhead. All styles are compiled at build time via Tailwind.

### Negative

- Two component systems in the codebase: homepage custom components and shadcn/ui components. Developers must know which system to use where (though the directory structure makes this obvious).
- shadcn/ui components are not automatically updated. If Radix releases a security fix, we must manually update the affected component source files. Mitigated by monitoring Radix releases and the shadcn/ui changelog.
- The `cn()` utility function (`clsx` + `tailwind-merge`) is an additional abstraction that new developers need to understand, though it is simple and well-documented.

### Components in Use

As of Layer 1, the following shadcn/ui components have been added:

| Component   | Used In                              |
|-------------|--------------------------------------|
| `accordion` | FAQ page                             |
| `avatar`    | Dashboard topbar, user menus         |
| `badge`     | Status indicators, role labels       |
| `button`    | All application forms and actions    |
| `card`      | Dashboard widgets, property cards    |
| `input`     | All form fields                      |
| `label`     | All form labels                      |
| `select`    | Role picker, filter dropdowns        |
| `separator` | Visual dividers in sidebars/forms    |
| `sheet`     | Mobile sidebar overlay               |
| `tabs`      | Dashboard section navigation         |
| `textarea`  | Contact form, booking notes          |
