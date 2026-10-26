# Vivaahly Project Status

**Last updated:** 2026-10-26
**Current phase:** Organizer authentication foundation complete
**Active branch:** `dev`

## Purpose

This document is the living implementation record for Vivaahly. Update it whenever a major feature, architectural slice, or meaningful cross-cutting improvement is completed so that the repository retains a concise view of what has actually been built and verified.

The finalized PRD, System Design, Database Design, and API Design documents remain the source of truth for product requirements and architecture. This file records implementation progress; it does not replace or redefine those documents.

## Progress Summary

| Area | Status | Summary |
| --- | --- | --- |
| Project scaffold | Complete | Full-stack Next.js modular-monolith foundation created with pnpm, TypeScript, App Router, Tailwind CSS, linting, type checking, and test foundations. |
| Marketing homepage | Complete | The Stitch-based Vivaahly homepage has been implemented as a responsive, static marketing experience, including verified CTA contrast and responsive Guest Logistics controls. |
| Guest Logistics responsive correction | Complete | Guest-status filter controls were corrected so their labels remain contained and readable on small and medium screens. |
| Organizer authentication | Complete | Account creation, sign in, session restoration, protected `/app` access, and sign out are implemented as the first application vertical slice. |
| Organizer application | In progress | `/app` now has an authenticated account-ready state; wedding creation and planning features remain unimplemented. |
| Guest invitation experience | Not started | Invitation entry and invitation-scoped guest functionality have not been implemented. |
| Media Hub | Not started | Media access and Media Hub functionality have not been implemented. |
| Database and external providers | In progress | MongoDB native-driver infrastructure and explicit auth indexes are implemented. Cloudflare R2 and Resend remain deferred until their feature slices require them. |

## Completed Milestones

### 1. Initial project scaffold

**Status:** Complete  
**Reference commit:** `2855c44` (`chore: initialize Vivaahly scaffold`)

Delivered:

- A full-stack Next.js App Router project using TypeScript and Tailwind CSS.
- `pnpm` as the single package manager, with a committed lockfile and declared package-manager version.
- A modular-monolith directory foundation that separates application routes, shared UI, domain modules, and server-side infrastructure.
- Initial route boundaries for marketing, organizer, guest-invitation, and Media Hub experiences without prematurely implementing future features.
- Foundational lint, type-check, test, and production-build commands.
- Environment documentation through `.env.example`, without initializing databases or external services.

Architectural commitments carried forward:

- Wedding remains the tenant boundary.
- MongoDB infrastructure will live under `src/server/providers/mongodb`, while domain repositories will remain inside their owning modules.
- Organizer, Guest Invitation, and Media Hub access mechanisms must remain separate.
- Feature-specific dependencies are added only when the corresponding vertical slice is implemented.

### 2. Responsive marketing homepage

**Status:** Complete  
**Reference commit:** `3b77531` (`feat: build marketing homepage`)

Delivered:

- The complete long-form Vivaahly homepage based on the approved Google Stitch design.
- Thirteen cohesive marketing sections covering the product introduction and representative planning experiences.
- Responsive layouts for mobile, tablet, and desktop screens.
- A small client-side mobile navigation interaction while keeping the rest of the page static.
- Local brand assets under `public/brand/` and homepage-specific design tokens and styling.
- Typography using EB Garamond and Plus Jakarta Sans through `next/font`.
- Homepage copy aligned with the documented MVP scope rather than treating design mock data as implemented product behavior.

Intentional limitations:

- Homepage data is illustrative and is not connected to a database.
- At this milestone, **Start planning**, **Sign in**, **Privacy**, and **Terms** were intentionally inactive. The authentication milestone has since activated **Start planning** and **Sign in**; **Privacy** and **Terms** remain inactive until their content is implemented.
- The homepage does not imply that organizer authentication or application features are complete.

### 3. Guest Logistics filter responsiveness

**Status:** Complete

The Guest Logistics status controls—**All guests**, **Confirmed**, **Awaiting**, and **Declined**—were adjusted to prevent text overflow while preserving the approved visual design:

- At very narrow widths, each control receives a full row.
- On common mobile widths, controls use a two-column layout.
- On tablet and medium screens, controls wrap naturally at content-safe widths.
- The remainder of the Guest Logistics section was left unchanged.

Verified at representative widths of 320px, 390px, 768px, and 1024px.

### 4. Organizer authentication foundation

**Status:** Complete within the approved local scope

**Reference commit:** This feature commit (`feat: add organizer authentication foundation`)

Delivered:

- Responsive Stitch-aligned `/sign-up` and `/sign-in` experiences, with accessible fields, pending states, inline validation, password visibility controls, and cross-links between both flows.
- Organizer registration using normalized unique email addresses and required Argon2id password hashing.
- A passphrase-friendly password policy requiring at least 12 characters while rejecting leading, trailing, repeated, or whitespace-only spacing, with specific inline guidance for invalid input.
- Sign in with a generic invalid-credentials response and timing mitigation for unknown accounts.
- Opaque, server-stored organizer sessions with hashed tokens, fixed seven-day expiry, and an HttpOnly, SameSite=Lax cookie.
- Session restoration and server-side access enforcement for `/app`, plus session revocation and cookie removal on sign out.
- Versioned Route Handlers under `/api/v1/auth` for register, login, session, and logout.
- MongoDB native-driver infrastructure under `src/server/providers/mongodb`, while authentication repositories remain owned by `src/modules/auth`.
- An explicit, repeatable `db:indexes` command for unique email/session indexes and automatic session expiry through a MongoDB TTL index.
- Marketing-page Start planning and Sign in actions now lead into authentication.

Architectural boundaries preserved:

- No wedding is created during registration; wedding onboarding remains the next product slice.
- Organizer sessions are independent from future Guest Invitation and Media Hub access contexts.
- API validation and domain-input failures use HTTP 400, authentication failures use 401, and duplicate/state conflicts use 409.
- The authentication module owns its domain schemas and repository; MongoDB provider code only owns client/database infrastructure.

Intentional limitations:

- Password recovery, organizer invitations, social login, and persistent remember-me sessions are outside this slice.
- Production request throttling is not yet implemented and must be added before a public launch.
- The local Atlas development database and authentication indexes are configured; secrets remain local in the ignored `.env.local` file.
- The native Argon2 package has been verified in the local Node/Next.js build; a Vercel preview deployment remains required before declaring production runtime compatibility complete.

### 5. Atlas authentication connectivity correction

**Status:** Complete

A user-visible registration failure was traced to the local Node.js resolver rejecting MongoDB Atlas SRV queries even though Atlas and Compass connectivity were healthy. The failure returned HTTP 500 before inserting an organizer.

Delivered:

- Optional, local-only `MONGODB_DNS_SERVERS` support for environments affected by SRV resolver failures.
- Scoped SRV/TXT resolution inside the MongoDB provider, producing the equivalent standard multi-host connection string without exposing or rewriting credentials.
- Safer unexpected-error logging that records a non-sensitive error code alongside the request ID.
- An Atlas-backed regression run proving registration, sign in, protected `/app` access, and logout; temporary records were removed afterward.

### 6. Authentication hardening and homepage CTA contrast

**Status:** Complete

Final refinements completed before closing the authentication feature:

- Reduced the organizer password minimum from 15 to 12 characters while retaining passphrase support.
- Added validation and user-facing errors for whitespace-only passwords, leading or trailing spaces, and repeated spaces between words.
- Expanded automated coverage with password-policy edge cases and confirmed that valid single-space passphrases remain accepted.
- Corrected the global anchor-color cascade so the homepage header and hero CTAs render light text on burgundy, while the closing CTA renders burgundy text on white.
- Rechecked the affected homepage CTA colors in the live responsive browser preview.

## Current Verification State

At the completion of the authentication work:

- Linting passed.
- Type checking passed.
- The production build passed.
- The automated test suite passed with 23 tests covering auth validation—including password whitespace edge cases—service behavior, HTTP errors, and same-origin protections.
- A native Argon2id hash-and-verify smoke check passed.
- An Atlas-backed browser smoke test passed for registration, sign in, session restoration, protected-route enforcement, and logout; its temporary user was removed afterward.
- Desktop browser rendering of the authentication experience passed; final mobile and tablet visual checks should be rerun whenever the design changes.
- The homepage header, hero, and closing CTA foreground/background contrast passed live responsive browser verification.

Run the repository scripts again after future implementation changes; this section describes the latest completed milestone rather than guaranteeing the state of later unverified work.

## Current Implementation Boundary

The repository now proves the project foundation, marketing UI, and organizer authentication boundary. It does not yet contain wedding persistence, guest invitations and RSVP, planning modules, email delivery, media storage, or Media Hub access.

The recommended next milestone is wedding creation and initial organizer onboarding, implemented as a vertical slice: route/UI, validation, domain logic, persistence, access control, and tests should be added together only to the extent required by that feature.

## Maintenance Rules

Update this document when completing a major feature or architectural milestone. Each update should record:

1. What became usable or demonstrably complete.
2. The important architectural decisions or deviations introduced.
3. The routes, modules, or providers affected.
4. How the work was verified.
5. Known limitations and the clearest next boundary.
6. A commit or pull-request reference when one is available.

Do not record every small styling tweak or refactor as a separate milestone. Include one when it resolves a user-visible defect, changes an architectural contract, or materially affects future development—as with the Guest Logistics responsive correction above.
