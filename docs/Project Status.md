# Vivaahly Project Status

**Last updated:** 2026-10-25  
**Current phase:** Foundation and marketing homepage complete  
**Active branch:** `dev`

## Purpose

This document is the living implementation record for Vivaahly. Update it whenever a major feature, architectural slice, or meaningful cross-cutting improvement is completed so that the repository retains a concise view of what has actually been built and verified.

The finalized PRD, System Design, Database Design, and API Design documents remain the source of truth for product requirements and architecture. This file records implementation progress; it does not replace or redefine those documents.

## Progress Summary

| Area | Status | Summary |
| --- | --- | --- |
| Project scaffold | Complete | Full-stack Next.js modular-monolith foundation created with pnpm, TypeScript, App Router, Tailwind CSS, linting, type checking, and test foundations. |
| Marketing homepage | Complete | The Stitch-based Vivaahly homepage has been implemented as a responsive, static marketing experience. |
| Guest Logistics responsive correction | Complete | Guest-status filter controls were corrected so their labels remain contained and readable on small and medium screens. |
| Organizer application | Not started | `/app` exists only as part of the scaffold; organizer features and authentication have not been implemented. |
| Guest invitation experience | Not started | Invitation entry and invitation-scoped guest functionality have not been implemented. |
| Media Hub | Not started | Media access and Media Hub functionality have not been implemented. |
| Database and external providers | Not started | MongoDB, Cloudflare R2, Resend, and production authentication integrations are intentionally deferred until their feature slices require them. |

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
- **Start planning**, **Sign in**, **Privacy**, and **Terms** are intentionally inactive until their respective flows are implemented.
- The homepage does not imply that organizer authentication or application features are complete.

### 3. Guest Logistics filter responsiveness

**Status:** Complete

The Guest Logistics status controls—**All guests**, **Confirmed**, **Awaiting**, and **Declined**—were adjusted to prevent text overflow while preserving the approved visual design:

- At very narrow widths, each control receives a full row.
- On common mobile widths, controls use a two-column layout.
- On tablet and medium screens, controls wrap naturally at content-safe widths.
- The remainder of the Guest Logistics section was left unchanged.

Verified at representative widths of 320px, 390px, 768px, and 1024px.

## Current Verification State

At the completion of the homepage work:

- Linting passed.
- The production build passed.
- The automated test suite passed with 2 tests.
- Responsive visual checks found no page-level horizontal overflow at the tested viewport widths.

Run the repository scripts again after future implementation changes; this section describes the latest completed milestone rather than guaranteeing the state of later unverified work.

## Current Implementation Boundary

The repository currently proves the UI and project foundation only. It does not yet contain completed production flows for organizer authentication, wedding persistence, guest invitations and RSVP, planning modules, email delivery, media storage, or Media Hub access.

The next milestone should be selected and implemented as a vertical slice: route/UI, validation, domain logic, persistence, access control, and tests should be added together only to the extent required by that feature.

## Maintenance Rules

Update this document when completing a major feature or architectural milestone. Each update should record:

1. What became usable or demonstrably complete.
2. The important architectural decisions or deviations introduced.
3. The routes, modules, or providers affected.
4. How the work was verified.
5. Known limitations and the clearest next boundary.
6. A commit or pull-request reference when one is available.

Do not record every small styling tweak or refactor as a separate milestone. Include one when it resolves a user-visible defect, changes an architectural contract, or materially affects future development—as with the Guest Logistics responsive correction above.
