# Vivaahly

Vivaahly is a full-stack Next.js modular monolith for planning and coordinating Indian weddings.

The finalized product, system, database, and API designs live in [`docs/`](docs/). Those documents are the source of truth for MVP behavior and boundaries.

## Local development

Use the package manager declared in `package.json`:

```bash
corepack pnpm install
corepack pnpm dev
```

Quality checks:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Architecture

- `src/app` owns App Router pages, layouts, and future `/api/v1` Route Handlers.
- `src/modules` will contain domain schemas, services, DTOs, and domain-specific repositories as slices are implemented.
- `src/server` contains server-only cross-cutting infrastructure such as access contexts, provider clients, HTTP errors, configuration, and logging.
- `src/components` contains shared UI primitives and layouts.
- `src/app/globals.css` contains the minimal global styling foundation. Shared components and additional style organization will be introduced only when approved designs require them.

## Marketing homepage

The complete responsive homepage lives in `src/app/(marketing)`. Its private `_components` directory contains the header, footer, and 13 static sections adapted from the approved Stitch design. Only the mobile navigation requires client-side state.

The scoped design tokens and responsive refinements live in `marketing.css`, imported through `globals.css` so Tailwind can generate the matching utilities. EB Garamond and Plus Jakarta Sans are self-hosted by `next/font`; the first build requires network access to fetch the fonts. Fixed assets live in `public/brand`.

Product previews use illustrative data. Start planning, Sign in, Privacy, and Terms intentionally have no action until their features are implemented. In-page navigation and the mobile menu work; Escape closes the menu. No database, authentication, or external provider setup is required to view the homepage.

The source design is Stitch project `13173363454773118986`, homepage screen `5a36094f39e44bb383114a0c7599e023`. Copy about food preferences, accommodation, transport, budgeting, and real-time synchronization was adjusted to match the documented MVP scope.
