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

Organizer authentication requires MongoDB. Copy `.env.example` to `.env.local`, set `MONGODB_URI` and `MONGODB_DB_NAME`, and create the documented indexes before using the flow:

```bash
corepack pnpm db:indexes
```

The authentication routes are `/sign-up` and `/sign-in`; authenticated organizers are sent to the protected `/app` workspace. Organizers without an active wedding are redirected to `/app/onboarding`. Sign out is available throughout the organizer application.

MongoDB uses the native driver's 30-second connection and server-selection recovery windows with its normal ten-second topology heartbeat. The original `mongodb+srv` URI is preserved; `MONGODB_DNS_SERVERS` configures Node's resolver when the local ISP resolver cannot answer Atlas SRV records. A single `MongoClient` promise is cached on `globalThis` so Next.js route bundles and development reloads reuse the connection pool whenever the runtime remains warm. Retryable reads and writes remain enabled, while sustained connectivity failures return a user-safe `503 SERVICE_UNAVAILABLE`. Browser mutations use a separate forty-second cancellation timeout so the driver can finish its recovery window and controls still recover.

## Architecture

- `src/app` owns App Router pages, layouts, and `/api/v1` Route Handlers.
- `src/modules` contains domain schemas, services, DTOs, and domain-specific repositories as slices are implemented.
- `src/server` contains server-only cross-cutting infrastructure such as access contexts, provider clients, HTTP errors, configuration, and logging.
- `src/components` contains shared UI primitives and layouts.
- `src/app/globals.css` contains the minimal global styling foundation. Shared components and additional style organization will be introduced only when approved designs require them.

## Marketing homepage

The complete responsive homepage lives in `src/app/(marketing)`. Its private `_components` directory contains the header, footer, and 13 static sections adapted from the approved Stitch design. Only the mobile navigation requires client-side state.

The scoped design tokens and responsive refinements live in `marketing.css`, imported through `globals.css` so Tailwind can generate the matching utilities. EB Garamond and Plus Jakarta Sans are self-hosted by `next/font`; the first build requires network access to fetch the fonts. Fixed assets live in `public/brand`.

Product previews use illustrative data. Start planning and Sign in now lead to organizer authentication; Privacy and Terms remain intentionally inactive until their content is defined. In-page navigation and the mobile menu work; Escape closes the menu. No database or external provider setup is required to view the homepage itself.

The source design is Stitch project `13173363454773118986`, homepage screen `5a36094f39e44bb383114a0c7599e023`. Copy about food preferences, accommodation, transport, budgeting, and real-time synchronization was adjusted to match the documented MVP scope.

## Organizer authentication

Organizer authentication is an application-owned vertical slice under `src/modules/auth`. It uses MongoDB's native driver, Argon2id password hashing, opaque 7-day server-side sessions, and a sealed-down HttpOnly cookie. Route Handlers stay thin and delegate validation and behavior to the auth module.

During sign in, Vivaahly verifies credentials, resolves the organizer's active wedding membership, and only then creates the server session. This ordering prevents a failed membership lookup from leaving an unused session record or setting a misleading cookie.

The database index setup is explicit and idempotent rather than occurring during requests. It creates unique indexes for normalized organizer email and hashed session tokens, plus a TTL index for expired sessions.

Current authentication scope is deliberately limited to account creation, sign in, session restoration, protection of `/app`, and sign out. Password recovery, organizer invitations, and production rate limiting belong to later slices.

## Wedding onboarding

The wedding onboarding vertical slice lives under `src/modules/wedding` and `/app/onboarding`. It creates the Wedding tenant and the creator's initial `ADMIN` membership in one MongoDB transaction. The organizer supplies bilingual couple names, a wedding title, main date, timezone, and primary city/location. A readable slug and high-entropy Media Hub access key are generated server-side; the access key is never returned by the ordinary Wedding DTO.

`POST /api/v1/wedding` creates the tenant for an authenticated organizer without an active membership, while `GET /api/v1/wedding` returns the wedding resolved from authenticated membership context. Browser-supplied wedding identifiers are never authoritative.

The explicit `db:indexes` command now prepares both authentication and wedding indexes, including the partial unique active-membership constraint required for one active wedding per organizer in V1.

Organizers can update the essential onboarding fields at `/app/settings` through the wedding's local calendar date. `PATCH /api/v1/wedding` derives the authoritative wedding from active membership, preserves the stable slug and non-editable configuration, and rejects past-date or post-wedding mutations.
