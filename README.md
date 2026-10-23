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

The first implementation slice after scaffold verification is the Vivaahly marketing landing page. Its final UI and visual system will be implemented only after the approved design context is available.
