# Vivaahly Project Status

**Last updated:** 2026-10-28
**Current phase:** Wedding creation and organizer onboarding complete
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
| Wedding onboarding | Complete | Authenticated organizers can create the Wedding tenant and become its initial Admin through the responsive `/app/onboarding` flow. |
| Organizer application | In progress | `/app` resolves and displays the authoritative wedding context; planning features such as events, guests, and tasks remain unimplemented. |
| Guest invitation experience | Not started | Invitation entry and invitation-scoped guest functionality have not been implemented. |
| Media Hub | Not started | Media access and Media Hub functionality have not been implemented. |
| Database and external providers | In progress | MongoDB native-driver infrastructure plus explicit authentication, wedding, and membership indexes are implemented. Cloudflare R2 and Resend remain deferred until their feature slices require them. |

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
- Node resolver configuration inside the MongoDB provider while preserving the original `mongodb+srv` URI for native-driver discovery.
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

### 7. Wedding creation and organizer onboarding

**Status:** Complete

**Reference commit:** This feature commit (`feat: add wedding onboarding and resilience`)

Delivered:

- A responsive Stitch-aligned `/app/onboarding` form for couple names, optional Marathi names, wedding title, main wedding date, timezone, and primary city/location.
- Accessible client and server validation, including rejection of impossible or past dates and clear field-level errors.
- `POST /api/v1/wedding` and `GET /api/v1/wedding` Route Handlers using authenticated organizer context rather than browser-supplied tenant identifiers.
- A wedding domain module with schemas, service rules, DTO mapping, and a MongoDB native-driver repository.
- Atomic Wedding plus initial `ADMIN` membership creation using a MongoDB transaction.
- A partial unique active-membership index that enforces the V1 rule of one active wedding per organizer even under concurrent submissions.
- Stable readable slug generation from English couple names and the main date; duplicate slugs remain allowed and never authorize access.
- A cryptographically random, unique Media Hub access key generated during creation and excluded from ordinary Wedding responses and logs.
- A responsive post-creation success state followed by an authenticated `/app` workspace summary backed by persisted wedding data.
- A refined success transition that returns the viewport to the top, moves accessibility focus to the confirmation heading, uses a decorative wedding-rings motif, adds meaningful date/location/role icons, and omits the implementation-only timezone from the summary card.
- Session/bootstrap membership resolution so returning organizers are routed directly to their authoritative wedding workspace.
- Session-aware marketing CTAs: visitors with an organizer-session cookie are offered direct `/app` workspace actions in the header, hero, and closing section instead of sign-up or sign-in prompts. The public homepage only checks cookie presence; `/app` remains responsible for authoritative session and wedding resolution.

Intentional limitations:

- Exact venue name/address, contacts, description, cover media, theme selection, and website configuration remain deferred to Wedding Settings and Wedding Website slices.
- The initial onboarding collects the English city/location; optional Marathi location content may be added later through settings.
- The organizer workspace currently shows the wedding foundation only. Events, guests, invitations, tasks, vendors, expenses, and dashboard aggregations are not represented as working features.

### 8. Organizer authentication availability correction

**Status:** Complete for the local development environment

Confirmed root cause:

- The application records, MongoDB native driver, Atlas replica set, and TCP route were healthy.
- Atlas rejected the TLS handshake from every replica-set member because this machine's current public IPv4 address was not present in the project's IP Access List.
- The local ISP had assigned several different public addresses over successive development sessions. Older `/32` entries remained active, which explains why the same authentication flow passed on one session and returned `503 SERVICE_UNAVAILABLE` on another.
- Atlas surfaced the rejected handshake to the driver as `MongoNetworkError` and `ReplicaSetNoPrimary`; those messages were symptoms of the access-list mismatch, not evidence that the Node.js driver or the elected primary was defective.

Delivered:

- Added the current development-machine address to Atlas as a least-privilege `/32` entry. Broad `0.0.0.0/0` access was not enabled.
- Preserved the original `mongodb+srv` URI so the native driver remains responsible for Atlas discovery and topology handling.
- Retained optional `MONGODB_DNS_SERVERS` support by configuring Node's resolver rather than reconstructing an Atlas host list in application code.
- Restored the native driver's 30-second connection and server-selection recovery windows and ten-second topology heartbeat, with validated environment overrides.
- Cached one `MongoClient` promise on `globalThis` so Next.js route bundles and development reloads reuse the pool while the runtime remains warm. A rejected connection is evicted so a later request can recover.
- Kept the driver's retryable reads and writes, and removed the additional route/service retry layer so authentication operations have one clear retry owner and do not amplify an outage.
- Extended browser mutation cancellation to 40 seconds so the driver's bounded recovery window can finish before the UI cancels the request.
- Kept controlled `503 SERVICE_UNAVAILABLE` responses and safe request diagnostics for genuine sustained MongoDB failures.
- Added provider regressions covering SRV preservation, DNS configuration, global promise reuse, failed-promise eviction, and explicit client closure.
- Moved the organizer recovery boundary above the fallible `/app` layout so database errors raised while resolving the current organizer are handled by Vivaahly's workspace-unavailable UI instead of escaping to the root error handler.
- Made the organizer recovery screen independent of the layout that may have failed, and added regression coverage for its full-height recovery state and retry action.

Operational limitation:

- A future ISP address change can legitimately block local Atlas access again. The correct response is to add the new current address as a `/32` Atlas entry or use a stable development egress IP; application retries cannot repair an Atlas access-policy rejection.
- Old IP entries should be reviewed and removed manually when they are no longer needed. They were not deleted during this correction because they may belong to other authorized development networks.

## Current Verification State

At the completion of the wedding-onboarding work:

- Linting passed.
- Type checking passed.
- The production build passed using Next.js's webpack builder. Turbopack reached a Windows worker/CSS panic after the sandboxed run was retried with font-network access; the supported webpack build completed successfully.
- The automated test suite passed with 57 tests covering authentication, password whitespace edge cases, wedding validation and domain behavior, HTTP errors, persistent database-outage behavior, MongoDB client lifecycle, login membership contexts, cookie safety, operation ordering, request cancellation, route protection, same-origin protections, and organizer error-boundary recovery UI.
- The Atlas wedding and membership indexes were created successfully through the repeatable database-index command.
- Initial temporary-account checks could not reach registration while the Atlas primary was unavailable. No wedding data was created by those attempts.
- A live unknown-account login during the outage returned `503 SERVICE_UNAVAILABLE` in approximately 6.9 seconds and did not set a session cookie.
- After connectivity recovered, a disposable Atlas-backed end-to-end regression passed registration, the no-wedding onboarding redirect, Wedding plus Admin membership creation, persisted workspace rendering, logout and session revocation, signed-out route protection, incorrect-password 401, and successful sign-in after logout. All temporary records were removed afterward.
- After the current IP entry became effective, the corrected provider passed 10 consecutive forced cold Atlas connections in 497–1,552 ms with no failures.
- A disposable organizer then passed 10 consecutive full login/logout API cycles (`200` followed by `204` each time). Every response set or cleared the expected session cookie, and the disposable user and sessions were removed afterward.
- The previously supplied organizer credentials now receive a prompt, normal `401` response rather than a database `503`; no existing account or password was modified while verifying the connectivity boundary.
- Live in-app browser inspection confirmed that the previous MongoDB error overlay clears after reload once Atlas access is restored and that normal authentication feedback is rendered again. The onboarding and workspace screens should still receive a manual responsive pass whenever their design changes.
- A native Argon2id hash-and-verify smoke check passed.
- An Atlas-backed browser smoke test passed for registration, sign in, session restoration, protected-route enforcement, and logout; its temporary user was removed afterward.
- Desktop browser rendering of the authentication experience passed; final mobile and tablet visual checks should be rerun whenever the design changes.
- The homepage header, hero, and closing CTA foreground/background contrast passed live responsive browser verification.
- The authenticated homepage passed live mobile-width verification with **Go to workspace**, **Continue planning**, and **Go to your workspace** actions all targeting `/app`.

Run the repository scripts again after future implementation changes; this section describes the latest completed milestone rather than guaranteeing the state of later unverified work.

## Current Implementation Boundary

The repository now proves the project foundation, marketing UI, organizer authentication boundary, Wedding tenant creation, and authenticated tenant resolution. It does not yet contain wedding events, guest invitations and RSVP, planning modules, email delivery, media storage, or Media Hub access.

The recommended next milestone is wedding-event management as a vertical slice. Events establish the ceremony structure required by later guest invitation and RSVP work.

## Maintenance Rules

Update this document when completing a major feature or architectural milestone. Each update should record:

1. What became usable or demonstrably complete.
2. The important architectural decisions or deviations introduced.
3. The routes, modules, or providers affected.
4. How the work was verified.
5. Known limitations and the clearest next boundary.
6. A commit or pull-request reference when one is available.

Do not record every small styling tweak or refactor as a separate milestone. Include one when it resolves a user-visible defect, changes an architectural contract, or materially affects future development—as with the Guest Logistics responsive correction above.
