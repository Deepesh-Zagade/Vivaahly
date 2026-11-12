# Vivaahly Project Status

**Last updated:** 2026-11-12
**Current phase:** Event Management complete; workspace loading and resilience improvements ready for QA deployment
**Active branch:** `dev`

## Purpose

This document is the living implementation record for Vivaahly. Update it whenever a major feature, architectural slice, or meaningful cross-cutting improvement is completed so that the repository retains a concise view of what has actually been built and verified.

The finalized PRD, System Design, Database Design, and API Design documents remain the source of truth for product requirements and architecture. This file records implementation progress; it does not replace or redefine those documents.

## Progress Summary

| Area | Status | Summary |
| --- | --- | --- |
| Project scaffold | Complete | Full-stack Next.js modular-monolith foundation created with pnpm, TypeScript, App Router, Tailwind CSS, linting, type checking, and test foundations. |
| Brand identity | Complete | The final two-stroke Vivaahly V mark, horizontal logo lockups, monochrome/reversed variants, and favicon/app icon are implemented under `public/brand` and `src/app/icon.svg`. |
| Deployment environments | Complete | Vivaahly Production runs from `main` at `vivaahly.bond` against `vivaahly_prod`; the public `dev`-branch QA environment runs at `qa.vivaahly.bond` against `vivaahly_dev`. Both use Node.js 22 and pinned pnpm 10. |
| Marketing homepage | Complete | The Stitch-based Vivaahly homepage has been implemented as a responsive, static marketing experience, including verified CTA contrast and responsive Guest Logistics controls. |
| Guest Logistics responsive correction | Complete | Guest-status filter controls were corrected so their labels remain contained and readable on small and medium screens. |
| Organizer authentication | Complete | Account creation, sign in, session restoration, protected `/app` access, and sign out are implemented as the first application vertical slice. |
| Wedding onboarding | Complete | Authenticated organizers can create the Wedding tenant and become its initial Admin through the responsive `/app/onboarding` flow. |
| Wedding details settings | Complete | Admins and Managers can update the essential onboarding details at `/app/settings` until the wedding's local date has passed. |
| Organizer invitations | Complete | Admins can invite, resend, and revoke organizer invitations; invited family members can securely join through the responsive acceptance flow. |
| Organizer membership management | Complete | Admins can promote, demote, and remove other organizers with final-Admin, self-management, tenant, and reactivation safeguards; automated verification and manual QA have passed. |
| Organizer application | Foundation complete | `/app` now provides the responsive organizer workspace shell and dashboard, backed by authoritative wedding and organizer context while clearly separating local preview data from unimplemented planning modules. |
| Event management | Complete | Active organizers can create, view, edit, and remove up to ten wedding events through the responsive organizer workspace, with authoritative tenant isolation and wedding-timezone date handling. |
| Workspace loading and resilience | Complete | Route-level skeletons, action-specific progress feedback, a functional database-recovery retry, and a clearer ceremony timeline now provide consistent responsive feedback throughout organizer workflows. |
| Guest invitation experience | Not started | Invitation entry and invitation-scoped guest functionality have not been implemented. |
| Media Hub | Not started | Media access and Media Hub functionality have not been implemented. |
| Database and external providers | In progress | MongoDB native-driver infrastructure and explicit authentication, wedding, membership, organizer-invitation, and event indexes are implemented. Resend organizer-invitation delivery is implemented; Cloudflare R2 remains deferred. |

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

### 9. Wedding details settings

**Status:** Complete

**Reference commit:** This feature commit (`feat: add wedding details settings`)

Delivered:

- A responsive, Stitch-aligned `/app/settings` form that deliberately reuses the onboarding page's typography, card, field, section, and action patterns.
- Prefilled editing for the existing bride and groom names, optional Marathi names, wedding title, main wedding date, timezone, and primary city/location.
- An **Edit wedding details** workspace action and Cancel/return flow.
- Successful saves return directly to the workspace. The workspace card always
  uses the current couple names as its primary heading and presents a genuinely
  custom wedding title above them without duplicating a generated name title.
- The wedding title is edited independently from the couple names, avoiding
  surprising title changes when an organizer corrects either person's name.
- Successful updates show an accessible confirmation for five seconds after
  returning to the workspace. Field errors now remain while a value is invalid
  and clear immediately once that field is corrected.
- Wedding-detail persistence uses leaf-level updates for the English title and
  English city, preserving custom Marathi title content, localized city data,
  and deferred venue name, address, and map fields.
- `PATCH /api/v1/wedding`, authenticated through the organizer session and active membership without accepting a browser-supplied `weddingId`.
- A domain update path that preserves the stable slug, Media Hub access key, website settings, counters, creator metadata, and other non-editable fields.
- Server-authoritative date rules: a proposed past date is invalid, editing remains available on the wedding's local date, and the form becomes read-only beginning the next local day.
- Admin and Manager compatibility, field-level validation, save confirmation, bounded request handling, controlled database-unavailable responses, and persisted workspace refresh.
- Automated coverage for update validation, immutable-field rejection, tenant derivation, stable slug behavior, localized-content preservation, wedding-day editing, post-wedding locking, routing, same-origin protection, and database outages.

Intentional limitations:

- Venue address, map link, description, cover image, website configuration, and other extended wedding settings remain deferred.
- Editing the essential wedding details does not regenerate the readable wedding slug.
- Post-wedding organizer and guest experiences are not disabled; only essential wedding-detail editing is locked.

### 10. Organizer invitations and acceptance

**Status:** Complete and verified

Delivered:

- A responsive, Stitch-aligned `/app/organizers` experience that lists active wedding organizers and gives Admins a focused invitation modal plus pending-invitation resend and revoke controls.
- Admin-only organizer invitation mutations, while Managers can still see the people collaborating in their wedding workspace without receiving invitation-management authority.
- Secure seven-day organizer invitations using cryptographically random bearer tokens, SHA-256 token hashes at rest, masked invitation email metadata, and tenant-scoped MongoDB lookups.
- Resend email delivery through a server-only adapter using the HTTP API and idempotency keys, without adding an otherwise unnecessary SDK dependency. The application URL, API key, and verified sender are server-only environment configuration.
- The responsive `/join/[token]` acceptance experience for new users, matching signed-in users, existing signed-out users, wrong-account sessions, successful acceptance, unavailable links, recoverable failures, and the V1 active-workspace conflict.
- Corrected account-switch behavior: a wrong account signs out and returns to the same invitation; an active-workspace conflict cannot be bypassed by signing into an unrelated account.
- Transactional invitation acceptance that revalidates the pending token, creates or resolves the organizer identity, enforces one active wedding membership, creates the membership, records acceptance, and creates the initial HttpOnly session for a new invited account.
- Safe sign-in return routing restricted to internal `/join/[token]` paths so existing invited accounts return to their invitation after authentication.
- API coverage for member listing; invitation creation, listing, revoke and resend; safe token metadata; and invitation acceptance. Organizer invitation indexes were added to the repeatable Atlas index setup.
- Automated coverage for normalized email input, role validation, password/passphrase rules, raw-token/hash separation, Admin authorization, duplicate invitations, all invitation access states, new and existing account acceptance, replay/conflict handling, session cookies, tenant-field rejection, and same-origin protection.
- Live Resend delivery through the verified Vivaahly domain, including the redesigned invitation email with wedding and couple context.
- Manual browser QA for create, resend, revoke, new-account acceptance, existing-account sign-in return, wrong-account recovery, accepted-link stability, and unavailable-link presentation.
- Clear resend success feedback with a temporary per-invitation cooldown, plus reliable invitation-modal reset after cancel, close, and successful completion.
- Security and concurrency hardening that redacts bearer tokens from error logs, prevents an expired request from invalidating a concurrently rotated token, and requires an explicit public HTTPS application origin in production.

Intentional limitations and remaining setup:

- Organizer role changes and member removal remain outside this invitation slice; final-Admin protection will be implemented with that later membership-management increment.
- The repository does not contain Resend credentials. Local email delivery requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `APP_BASE_URL` in the ignored `.env.local`; production requires an explicit public HTTPS `APP_BASE_URL` in deployment configuration.
- If delivery cannot be confirmed after an invitation record is created, the pending invitation remains visible so an Admin can safely resend a rotated link.

### 11. Organizer membership management

**Status:** Complete

Delivered:

- Admin-only role controls on `/app/organizers` for promoting a Manager to Admin and demoting another Admin to Manager.
- Admin-only removal of other organizers through soft membership removal, preserving the organizer account and historical attribution while immediately removing access to the wedding workspace.
- No self-demotion, self-role change, or self-removal controls; canonical ObjectId comparison in the service and an independent repository identity check enforce the same boundary against crafted case-variant requests.
- Atomic final-Admin protection for both demotion and removal. Membership transitions serialize through a wedding-scoped version update so concurrent Admin actions cannot leave a wedding without an Admin.
- Tenant-scoped `PATCH /api/v1/members/{memberId}` and `DELETE /api/v1/members/{memberId}` Route Handlers with strict role validation and same-origin protection.
- Stitch-aligned organizer controls use a compact, clearly recognizable settings button with a labelled tooltip and role-specific action menu, while confirmation dialogs and visible success/error feedback preserve deliberate role changes and removals across responsive layouts.
- Reinvitation support for previously removed organizers: accepting a fresh invitation reactivates the original membership record with the invitation's current role instead of inserting a duplicate membership.
- Cross-window stale-state reconciliation for the organizer screen: authoritative data refreshes when the tab regains focus or visibility and after every successful, rejected, timed-out, or uncertain organizer mutation. A remotely demoted Admin immediately loses open management dialogs and controls after reconciliation.
- Global server and network errors automatically dismiss after seven seconds, while actionable field-validation messages remain until their fields are corrected.

Verification:

- Linting and type checking passed.
- The complete automated suite passed with 125 tests across 28 files.
- Regression coverage includes Admin and Manager authorization, self-management rejection, final-Admin conflicts, tenant-field rejection, same-origin enforcement, serialized membership updates, and removed-membership reactivation.
- Manual browser QA passed for role changes, removal boundaries, reinvitation/reactivation, cross-window reconciliation, responsive organizer controls, and visible transient feedback.

### 12. Final Vivaahly brand identity

**Status:** Complete

Delivered:

- Replaced the temporary three-part mark with the final broad, asymmetric two-stroke V, using the approved burgundy and terracotta reference palette and a shared converging vertex.
- Added primary, monochrome, and reversed standalone marks plus corresponding horizontal Vivaahly wordmark lockups.
- Added a dedicated padded favicon asset and `src/app/icon.svg` so Next.js exposes the final mark as the application icon.
- Documented asset responsibilities and approved brand colors in `public/brand/README.md`.
- Kept application branding centralized: the existing shared `Brand` component continues to consume `/brand/vivaahly-mark.svg`, so every current header receives the final mark without duplicated component changes.

Verification:

- Every brand SVG and the App Router icon parse successfully as XML.
- Type checking passed.
- Git diff validation passed.
- A production-build attempt reached Next.js setup but could not clean `.next` because the active development server holds `.next/dev-launch.err.log`; the server was intentionally left running and this is an environment lock rather than a logo-asset failure.

### 13. Vercel runtime preparation

**Status:** Complete
**Reference commit:** `48191f4` (`chore(deploy): prepare Vercel runtime`)

Delivered:

- Pinned the deployment runtime to Node.js `22.x` so Vercel does not silently select a newer major version.
- Pinned the package manager to Vercel-supported pnpm `10.34.9` while preserving pnpm as the repository's only package manager.
- Regenerated `pnpm-lock.yaml` with pnpm 10, removing pnpm 12's package-manager self-install metadata without changing the application's declared dependency versions.
- Confirmed that `.env.local` remains ignored and untracked; deployment secrets have not been committed.
- Stopped the local development server during native dependency relinking and production verification. It was not restarted as part of this milestone.

Verification:

- A frozen-lockfile installation passed using pnpm `10.34.9`.
- Linting passed.
- Type checking passed.
- The complete automated suite passed with 125 tests across 28 files.
- The optimized Next.js 16.4.2 production build passed and compiled all current pages and Route Handlers successfully.

Historical boundary at completion (resolved by milestone 15):

- Vivaahly is not deployed yet. MongoDB Atlas production configuration, Vercel environment variables, the preview deployment, runtime QA, and Hostinger domain connection remain subsequent deployment steps.

### 14. MongoDB Atlas production preparation

**Status:** Complete

Delivered:

- Retained the existing free Atlas cluster and separated environments through the `vivaahly_dev` and `vivaahly_prod` logical databases.
- Created dedicated application database users with `readWrite` limited to their owning database and access restricted to the existing Vivaahly cluster.
- Replaced the development application's former broad `atlasAdmin` credential with a scoped `vivaahly_dev` credential.
- Updated MongoDB Compass to use the scoped development user and removed the obsolete broad database user.
- Kept production credentials in the ignored, untracked `.env.atlas-prod` bridge file pending Vercel environment configuration; no database secret entered Git.
- Initialized production through the repository-owned repeatable index script rather than inserting placeholder data manually.

Verification:

- The production credential authenticated with exactly `readWrite` on `vivaahly_prod`.
- The empty production database contains `users`, `sessions`, `weddings`, `weddingMembers`, and `organizerInvitations`, with every required unique, lookup, partial, and TTL index present.
- The new development credential authenticated with exactly `readWrite` on `vivaahly_dev`.
- Existing development records remained readable, every expected development collection and index remained present, and manual sign-in and sign-out passed after restarting the development server.

Historical boundary at completion:

- The Atlas IP access list has not yet been broadened for Vercel's dynamic outbound addresses. That free-tier connectivity tradeoff will be applied immediately before preview runtime verification.
- `.env.atlas-prod` remains temporary and must be deleted after the production values are securely configured and verified in Vercel.

### 15. Initial Vercel production deployment

**Status:** Complete

Delivered:

- Linked the repository to the `deepesh-zagades-projects/vivaahly` Vercel project under the intended `zagadedeepesh@gmail.com` account and Hobby plan.
- Configured the Vercel project to use Node.js `22.x`, matching the repository runtime contract, and verified Corepack installation of pinned pnpm `10.34.9` during the remote build.
- Added the required Production-only MongoDB, Resend, application-origin, timeout, and Corepack environment variables. Credentials are stored as Vercel secrets and remain absent from Git.
- Kept the local-only `MONGODB_DNS_SERVERS` override out of Vercel and allowed Vercel to own `NODE_ENV`.
- Connected `Deepesh-Zagade/Vivaahly`, set `main` as the Production branch, and enabled automatic Git deployments for future Production commits.
- Deployed the exact pushed `origin/main` commit rather than the locally modified development working tree.
- Connected and verified `vivaahly.bond` through Hostinger DNS using Vercel's recommended apex records.
- Added `www.vivaahly.bond` and configured a permanent HTTP 308 redirect to the canonical `https://vivaahly.bond` origin.

Verification:

- Vercel completed dependency installation, the optimized Next.js build, TypeScript validation, static generation, and server-function packaging on Node.js 22.
- The first Production deployment reached `READY` and was promoted successfully.
- `https://vivaahly.bond/` and `/sign-in` returned public HTTP 200 responses over HTTPS.
- `https://www.vivaahly.bond/` returned HTTP 308 to `https://vivaahly.bond/`.
- A read-only invalid organizer-invitation token request returned the expected `UNAVAILABLE` domain state rather than `503`, proving the Vercel runtime can reach the production MongoDB database.
- Vercel reports both apex and `www` domains as verified and correctly configured.

Remaining operational work:

- A manual Production smoke test passed for account registration, authentication, wedding management, organizer invitation email delivery and acceptance, and organizer management.
- Continue running focused release QA before future Production promotions; this smoke pass does not replace regression testing for later feature changes.
- The ignored `.env.atlas-prod` bridge file should be removed after confirming that its production credential is stored safely outside the repository and can be intentionally recovered or rotated.

### 16. Dev-branch QA deployment

**Status:** Complete

Delivered:

- Added `qa.vivaahly.bond` as a custom Vercel domain bound specifically to the `dev` Git branch Preview deployment.
- Configured Preview environment variables restricted to `dev`, using the scoped development MongoDB credential, `vivaahly_dev`, QA application origin, Resend configuration, MongoDB recovery windows, and Corepack setting.
- Preserved the Production aliases and environment: `vivaahly.bond`, `www.vivaahly.bond`, and `vivaahly.vercel.app` continue to resolve through Production and use `vivaahly_prod`.
- Disabled Vercel Authentication for Preview deployments so incognito browsers and organizer invitation recipients can access the QA flow without a Vercel account. Vivaahly's own authentication and tenant authorization remain authoritative.
- Rebuilt the `dev` Preview after applying its branch-scoped variables.

Verification:

- Vercel reports `qa.vivaahly.bond` as verified, correctly configured, and bound to `dev`.
- The rebuilt Preview reached `READY` using Node.js 22.
- Public unauthenticated requests to the QA homepage and a read-only database-backed invitation endpoint returned HTTP 200.
- The QA API returned the expected unavailable state for an invalid token rather than a database-connectivity error.
- Production continued returning HTTP 200 after the QA environment and access-policy changes.
- Vercel metadata confirms every QA variable targets Preview and is restricted to the `dev` branch; MongoDB and Resend credentials remain secret values.

Operational boundary:

- Disabling Vercel Authentication makes generated Preview URLs for this project publicly reachable. Do not place Production credentials in Preview, and continue relying on Vivaahly's server-side authentication and authorization for protected application data.
- Run user-flow QA at `qa.vivaahly.bond`; do not use `vivaahly.vercel.app` for QA because it is intentionally a Production alias.

### 17. Organizer workspace shell and dashboard

**Status:** Complete

Delivered:

- Replaced the temporary wedding summary at `/app` with the approved Stitch-aligned organizer dashboard and shared application shell.
- Added responsive navigation behavior: a mobile drawer below 768px, an icon rail with overlay expansion for tablet widths, and a collapsible full sidebar on desktop.
- Corrected the desktop shell so main content and sidebar navigation scroll independently, while the brand and organizer identity remain fixed; the collapse control now sits compactly on the sidebar edge without consuming navigation space.
- Corrected the tablet control to derive its expand/collapse label and icon from the effective responsive sidebar state.
- Reduced the wedding header and dashboard-above-the-fold spacing, added a compact family-workspace context indicator, and corrected sticky-header stacking over organizer action controls.
- Preserved the finalized shared Vivaahly logo rather than copying Stitch's temporary mark.
- Added the authoritative wedding header with couple names, optional custom wedding title, wedding date, location, and a countdown calculated in the wedding's configured timezone.
- Added workspace-wide reconciliation so saved wedding details and organizer-role changes refresh the persistent App Router layout after local mutations and when another tab or session becomes active.
- Connected the Active Organizers panel to real wedding membership data and retained working links for organizer management and wedding settings.
- Added the approved dashboard composition for quick actions, next ceremony, summary cards, priorities, ceremony timeline, RSVP response bars, guest-experience setup, organizers, and recent activity.
- Kept unfinished V1 navigation and actions non-interactive and visibly marked as coming soon rather than exposing misleading dead links.
- Limited illustrative ceremony, guest, task, expense, and activity figures to a clearly labelled local-development preview. Production and QA render honest empty states unless `DASHBOARD_DEMO_DATA=true` is deliberately configured.
- Kept wedding onboarding on its existing focused layout; the full workspace shell begins only after an active Wedding membership exists.

Verification:

- Type checking passed.
- Linting passed.
- The full automated suite passed with 137 tests across 31 files.
- The local `/app` route compiled successfully and returned its expected authenticated-route redirect for a signed-out request.
- Focused live browser inspection confirmed the compact above-the-fold dashboard, independent main-content scrolling, fixed sidebar brand/profile regions, correct tablet expand/collapse behavior, authoritative header refresh, and organizer settings controls remaining below the sticky wedding header.
- Manual responsive review and the follow-up desktop, tablet, scrolling, spacing, header, and stale-data corrections were completed locally.

### 18. Wedding Event Management

**Status:** Complete

Delivered:

- Added responsive organizer routes for the chronological event list, event creation, event details, event editing, and confirmed deletion under `/app/events`.
- Added authenticated `GET` and `POST /api/v1/events` plus `GET`, `PATCH`, and `DELETE /api/v1/events/[eventId]` Route Handlers, deriving the authoritative Wedding tenant from the active organizer membership rather than accepting a browser-supplied `weddingId`.
- Added an Events domain module with Zod input schemas, service rules, DTO mapping, MongoDB native-driver repository ownership, and explicit event indexes.
- Enforced the V1 maximum of ten active events atomically through the Wedding event counter, including conflict handling for concurrent creation attempts.
- Enforced a genuinely later end time while supporting overnight and multi-day events, and documented the strengthened `endAt > startAt` contract.
- Prevented creation of past-dated events using the Wedding's configured timezone while allowing events on the current local day. Existing historical events remain editable and are not silently removed.
- Added bilingual event titles and optional bilingual descriptions, venue details, secure map links, dress-code guidance, and private organizer notes with field-level validation.
- Added chronological wedding-local grouping, next-ceremony presentation, empty and not-found states, transient success feedback, and soft deletion with transactional counter maintenance.
- Rebuilt the event list and details experiences against the approved Stitch hierarchy, including compact date tiles, responsive metadata and actions, and distinct Vivaahly palette accents across ceremony days.
- Connected the workspace Events navigation, dashboard quick action, next-ceremony card, and active-event summary to authoritative Event data while retaining honest empty states.

Verification:

- Type checking passed.
- Linting passed.
- The complete automated suite passed with 150 tests across 34 files.
- Focused browser verification passed for the responsive event list and its authoritative persisted data.
- Code review and comprehensive manual QA completed without actionable findings after the past-date and Stitch-alignment corrections.

Intentional limitations:

- Event images remain deferred to a follow-up Event increment.
- Task, RSVP, vendor, and expense coordination summaries will be added to Event details as those owning verticals are implemented.

### 19. Workspace loading, recovery, and timeline polish

**Status:** Complete

Delivered:

- Added responsive route-level loading skeletons for the dashboard, event list, event details, event forms, onboarding, organizer management, and wedding settings while keeping the persistent workspace navigation and wedding header stable.
- Added a shared accessible loading indicator and explicit progress labels for registration, sign in, sign out, invitation acceptance, opening the workspace, wedding creation and updates, event creation, editing and deletion, invitation delivery and revocation, and organizer role or membership changes.
- Kept successful mutations visibly pending until their destination begins rendering, disabled duplicate submissions, and restored controls normally when a request fails.
- Corrected the organizer database-recovery action so **Try again** performs a fresh document request instead of resetting only the already-failed React boundary.
- Refined the dashboard ceremony timeline with wedding-palette accents shared by events on the same day, a clearer next-event treatment, a neutral connector, concise local time labels, and a five-event dashboard preview linked to the complete event schedule.
- Preserved reduced-motion and assistive-technology support through `aria-busy`, status announcements, and non-animated fallbacks without introducing artificial delays or blocking full-screen overlays.

Verification:

- Manual browser QA confirmed the loading experience across the implemented organizer flows and reported that the application now feels consistent and professional.
- Type checking and linting passed.
- The complete automated suite passed with 152 tests across 35 files.
- The optimized Next.js production build completed successfully with the supported webpack builder.

## Current Verification State

At the completion of the initial Vercel production-deployment milestone:

- Node.js is pinned to `22.x` and pnpm is pinned to `10.34.9` for predictable Vercel builds.
- A pnpm frozen-lockfile installation passed after regenerating the lockfile with pnpm 10.
- Linting, type checking, all 125 tests across 28 files, and the optimized Next.js production build passed.
- `.env.local` remains ignored and untracked; no deployment secret was added to the repository.
- Atlas development and production credentials now have `readWrite` only on their respective databases; the old broad `atlasAdmin` database user has been removed.
- `vivaahly_prod` is empty and contains all five current application collections with every required index verified through the native MongoDB driver.
- The Vercel project uses Node.js `22.x`, pinned pnpm `10.34.9`, `main` as its Production branch, and automatic Git deployments.
- The first Production deployment completed successfully and is publicly available at `https://vivaahly.bond`.
- The apex domain serves HTTPS with HTTP 200, while `www.vivaahly.bond` permanently redirects to the canonical apex origin.
- A read-only Production API smoke test reached MongoDB Atlas and returned the expected invitation-unavailable result without a database-availability error.
- The public `qa.vivaahly.bond` environment is bound to `dev`, receives only `dev`-restricted Preview variables, and connects through the `vivaahly_dev` configuration.
- A public QA homepage request and read-only database-backed API request returned HTTP 200 after Preview protection was deliberately disabled.
- Manual Production smoke testing passed registration, authentication, wedding management, invitation email delivery and acceptance, and organizer management.

- The finalized primary, monochrome, reversed, horizontal, and favicon SVG assets passed XML validation, and the repository passed type checking after the asset replacement.
- The organizer invitation and membership-management implementation passed linting, type checking, and the complete 125-test suite across 28 files.
- The Event Management implementation passed linting, type checking, and the complete 150-test suite across 34 files; code review and manual QA reported no remaining defects.
- The repeatable Atlas index command created the organizer invitation token, wedding/email/status, pending-email uniqueness, and expiration indexes successfully.
- Live Resend email delivery and end-to-end browser QA passed for the organizer invitation lifecycle, including accepted, revoked, wrong-account, and unavailable-link states.
- Linting passed.
- Type checking passed.
- The production build passed using Next.js's webpack builder. Turbopack reached a Windows worker/CSS panic after the sandboxed run was retried with font-network access; the supported webpack build completed successfully.
- The automated test suite passed with 125 tests covering authentication, password whitespace edge cases, wedding creation and updates, localized-title and venue-field preservation, title presentation, field-level correction feedback, redirected update confirmation, date-lock behavior, HTTP errors, persistent database-outage behavior, MongoDB client lifecycle, login membership contexts, cookie safety, operation ordering, request cancellation, route protection, same-origin protections, organizer error-boundary recovery UI, organizer-invitation security and concurrency boundaries, and organizer role/removal/reactivation safeguards including case-variant self-management rejection.
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
- An Atlas-backed disposable organizer passed registration, wedding onboarding, prefilled settings rendering, persisted detail updates, refresh verification, workspace reflection, and the post-wedding read-only UI. Its user, session, membership, and wedding records were removed after verification.

Run the repository scripts again after future implementation changes; this section describes the latest completed milestone rather than guaranteeing the state of later unverified work.

## Current Implementation Boundary

The repository now proves the project foundation, finalized brand identity, marketing UI, organizer authentication boundary, Wedding tenant creation, authenticated tenant resolution, essential wedding-detail editing, organizer invitation/acceptance, organizer membership management, the responsive organizer workspace/dashboard foundation, and Wedding Event Management. Transactional email delivery for organizer invitations is implemented and live-verified through Resend; credentials remain environment-only and untracked. The application does not yet contain guest invitations and RSVP, tasks, vendors, expenses, media storage, or Media Hub access.

Production and QA deployment boundaries are now operational. The recommended next step is to run future feature and regression testing through `qa.vivaahly.bond`, promote only reviewed `dev` changes to `main`, and resume planning the next vertical product increment.

## Maintenance Rules

Update this document when completing a major feature or architectural milestone. Each update should record:

1. What became usable or demonstrably complete.
2. The important architectural decisions or deviations introduced.
3. The routes, modules, or providers affected.
4. How the work was verified.
5. Known limitations and the clearest next boundary.
6. A commit or pull-request reference when one is available.

Do not record every small styling tweak or refactor as a separate milestone. Include one when it resolves a user-visible defect, changes an architectural contract, or materially affects future development—as with the Guest Logistics responsive correction above.
