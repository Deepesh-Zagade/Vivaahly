# Vivaahly

## API Design - MVP v1.0

**Product:** Vivaahly  
**Architecture:** Full-stack Next.js modular monolith  
**Runtime:** Node.js + TypeScript  
**API Style:** HTTP/JSON using Next.js Route Handlers  
**Base Path:** `/api/v1`  
**Tenant:** Wedding  
**Version:** 1.0  
**Status:** API Design Baseline  
**Date:** 16 October 2026

---

# 1. Purpose

This document defines the application API contract for Vivaahly MVP after the Product Requirements, High-Level System Design, and Database Design phases.

It defines:

- API conventions and versioning
- Organizer authentication and session APIs
- Wedding and organizer-management APIs
- Event, guest, invitation, RSVP, task, vendor, and expense APIs
- Guest wedding website APIs
- Media Hub APIs
- Direct-to-Cloudflare-R2 upload flows
- Email campaign APIs using Resend
- Pagination, filtering, validation, and errors
- Multi-tenant authorization rules
- Idempotency and concurrency rules
- HTTP caching and security behavior
- API-specific edge cases and failure modes

This document does **not** define React component implementation, visual UX, MongoDB repository code, or final folder scaffolding.

---

# 2. API Architecture Decision

Vivaahly uses Next.js Route Handlers as the canonical HTTP boundary.

```text
Browser
   |
   v
Next.js Route Handler
   |
   v
Zod Validation
   |
   v
Auth / Guest / Media Context
   |
   v
Domain Service
   |
   v
Repository / Provider Adapter
   |
   +--> MongoDB Atlas
   +--> Cloudflare R2
   +--> Resend
```

The canonical API lives under:

```text
/api/v1
```

Server Actions may be used later as thin organizer-UI adapters, but they must call the same domain-service layer and must not create a second set of business rules.

The HTTP API is an internal product API in V1. Vivaahly does not expose a public developer API.

---

# 3. Design Principles

## 3.1 Tenant-safe by default

Every organizer operation resolves `weddingId` from the authenticated organizer membership.

The browser must never be allowed to choose the tenant by sending an arbitrary `weddingId`.

Bad:

```json
{
  "weddingId": "another-wedding-id",
  "title": "Expense"
}
```

Preferred:

```text
Session -> active WeddingMember -> weddingId -> domain operation
```

## 3.2 Explicit trust models

Vivaahly has three independent access models:

1. Organizer session
2. Personalized guest invitation session
3. Shared Media Hub access session

No API should silently treat one access model as another.

## 3.3 Server validation is authoritative

All externally supplied request data is validated with Zod before it reaches business logic.

## 3.4 Resource-oriented HTTP contract

Use standard HTTP methods:

- `GET` - read
- `POST` - create or perform a command
- `PATCH` - partial update
- `PUT` - replace a bounded relationship/set where appropriate
- `DELETE` - request logical deletion/removal

## 3.5 Domain commands are allowed where CRUD is not enough

Examples:

```text
POST /email-campaigns/{id}/send-next
POST /media/uploads/{id}/finalize
POST /organizer-invitations/{token}/accept
```

These operations represent meaningful state transitions and should not be forced into artificial CRUD shapes.

---

# 4. API Versioning

All JSON APIs use path versioning:

```text
/api/v1/...
```

Breaking changes require a future version such as:

```text
/api/v2/...
```

V1 should prefer backward-compatible additions whenever possible.

Examples of normally non-breaking changes:

- adding an optional response field
- adding a new optional query parameter
- adding a new enum value only when clients are designed to tolerate it

Examples of breaking changes:

- renaming an existing field
- changing field meaning
- changing required request structure
- changing response data type

---

# 5. Content Type and Character Encoding

Normal API requests and responses use:

```http
Content-Type: application/json; charset=utf-8
```

UTF-8 is required so English and Marathi/Devanagari content is preserved correctly.

File bytes are never uploaded through ordinary Vivaahly JSON endpoints. The browser uploads directly to Cloudflare R2 using presigned URLs.

---

# 6. Standard Success Response

Single-resource response:

```json
{
  "data": {
    "id": "...",
    "title": "Sangeet"
  }
}
```

Collection response:

```json
{
  "data": [
    { "id": "..." },
    { "id": "..." }
  ],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

Command response:

```json
{
  "data": {
    "status": "SENT"
  }
}
```

A `204 No Content` response may be used when an operation succeeds and no representation is useful.

---

# 7. Standard Error Contract

All application errors use a consistent shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed.",
    "details": {
      "fieldErrors": {
        "email": ["Invalid email address"]
      }
    },
    "requestId": "req_..."
  }
}
```

`message` should be user-safe.

Internal stack traces, database errors, provider secrets, and bearer tokens must never be returned.

---

# 8. Error Codes

| Code | Typical HTTP Status | Meaning |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Zod/request validation failed |
| `UNAUTHENTICATED` | 401 | Valid organizer session not present |
| `GUEST_ACCESS_REQUIRED` | 401 | Personalized guest context missing/invalid |
| `MEDIA_ACCESS_REQUIRED` | 401 | Media Hub context missing/invalid |
| `FORBIDDEN` | 403 | Authenticated but operation not allowed |
| `NOT_FOUND` | 404 | Tenant-scoped resource not found |
| `CONFLICT` | 409 | State conflict/duplicate/invariant violation |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | Required database connectivity is temporarily unavailable |
| `EXTERNAL_SERVICE_ERROR` | 502/503 | R2/Resend/provider problem |
| `INTERNAL_ERROR` | 500 | Unexpected server failure |

For cross-tenant object probing, prefer a generic `404 NOT_FOUND` when possible so resource existence is not leaked.

---

# 9. HTTP Status Guidelines

| Status | Usage |
|---|---|
| `200` | Successful read/update/command |
| `201` | Resource created |
| `204` | Successful delete/remove with no body |
| `400` | Invalid request |
| `401` | Required access context missing/invalid |
| `403` | Known user/context but insufficient permission |
| `404` | Resource not found within active tenant/context |
| `409` | Duplicate/state/invariant conflict |
| `413` | File metadata exceeds allowed upload size |
| `422` | Optional for semantically invalid domain input; V1 may standardize on 400 instead |
| `429` | Rate limited |
| `500` | Unexpected application error |
| `502/503` | Temporary provider dependency failure |

MongoDB server-selection and network failures return `503 SERVICE_UNAVAILABLE` with a user-safe message. Responses and logs must not expose replica-set hosts, connection strings, credentials, session tokens, or raw driver errors.

V1 should choose one consistent policy for semantic validation. This document recommends using `400` for Zod and domain validation unless `409` better represents the conflict.

---

# 10. Organizer Session Authentication

Organizer authentication is cookie-based, not JWT-in-localStorage.

Cookie conceptually:

```text
vivaahly_session=<opaque-random-token>
```

Production cookie properties:

```text
HttpOnly
Secure
SameSite=Lax (or stricter where possible)
Path=/
```

The server hashes the raw session token for lookup.

Every organizer API request resolves:

```text
Session
  -> User
  -> ACTIVE WeddingMember
  -> role
  -> weddingId
```

That context is passed into domain services.

---

# 11. Organizer Authorization Roles

V1 roles:

```text
ADMIN
MANAGER
```

Both roles can manage normal wedding operations and view expenses.

Only Admin may:

- invite organizer members
- remove organizer members
- promote/demote roles

The API must prevent removal/demotion of the final Admin.

---

# 12. Personalized Guest Access

The email invitation contains an opaque personalized link such as:

```text
/i/<access-key>
```

`/i/{accessKey}` is an application entry route, not a normal JSON API route.

Flow:

```text
GET /i/<accessKey>
        |
        v
Validate GuestInvitation
        |
        v
Resolve guest + wedding
        |
        v
Set HttpOnly guest-access cookie
        |
        v
Redirect to /w/deepesh-and-priya-14022027
```

The wedding slug is only a human-readable URL label. It never determines authorization.

The guest cookie conceptually represents:

```text
guestInvitationId
weddingId
```

but should be implemented as an opaque server-managed token/session rather than trusting browser-readable values.

Forwarding the original invitation link intentionally grants the same family invitation context in V1.

---

# 13. Wedding Slug Rule in APIs

Wedding pages may use:

```text
/w/deepesh-and-priya-14022027
```

Two weddings may have the same slug.

Therefore API operations must **never** resolve the authoritative tenant using the slug alone.

Correct:

```text
Guest session -> weddingId -> Wedding
```

Incorrect:

```text
slug -> findOne Wedding -> authorize
```

The slug may be checked for canonical-display purposes, but it is never a security identifier.

---

# 14. Media Hub Access

Shared Media Hub link:

```text
/m/<mediaAccessKey>
```

Recommended flow:

```text
GET /m/<mediaAccessKey>
        |
        v
Validate Wedding mediaAccessKey
        |
        v
Create short-lived media-access session/cookie
        |
        v
Redirect to clean Media Hub route
```

This avoids repeatedly sending the media key in API calls and limits accidental leakage through referrers/logging.

Anyone possessing the original media link may intentionally establish this access context in V1.

Media access grants only Media Hub operations. It does not grant guest RSVP or organizer permissions.

---

# 15. CSRF and Same-Origin Policy

Cookie-authenticated state-changing organizer APIs must validate same-origin expectations in addition to SameSite cookie protection.

Recommended checks:

- expected `Origin`
- expected `Host`
- reject cross-origin mutation requests

Vivaahly application APIs should be same-origin only in V1.

Cloudflare R2 has a separate CORS policy for presigned browser uploads.

---

# 16. Request Validation with Zod

Every route handler follows this shape:

```text
Parse route/query/body
        |
        v
Zod validation
        |
        v
Access-context resolution
        |
        v
Domain-service validation
        |
        v
Persistence/provider call
```

Zod should validate:

- route params
- query params
- request bodies
- enums
- email formats
- localized strings
- pagination limits
- dates
- expense amounts
- file metadata
- RSVP attendee count

Cross-resource rules remain domain-service responsibilities.

Example:

```text
Zod can verify vendorId is a valid ObjectId-shaped string.
Domain service must verify that vendorId belongs to this wedding.
```

---

# 17. Identifier Representation

MongoDB `ObjectId` values are serialized as strings in the API.

Example:

```json
{
  "id": "6710f1d5c9187a..."
}
```

Do not expose internal database field names such as `_id` in public DTOs.

Prefer:

```text
id
```

instead of:

```text
_id
```

---

# 18. Date and Time Contract

Timestamps are returned as ISO 8601 UTC strings.

Example:

```json
{
  "startAt": "2027-02-13T13:30:00.000Z"
}
```

The wedding response includes its IANA timezone:

```json
{
  "timezone": "Asia/Kolkata"
}
```

Clients render date/time for the wedding timezone and selected locale.

The API never returns formatted presentation strings as the authoritative time value.

---

# 19. Money Contract

Money is exchanged as integer minor units.

Example:

```json
{
  "amountMinor": 3000000,
  "currency": "INR"
}
```

This represents:

```text
INR 30,000.00
```

Do not accept floating-point currency amounts as authoritative API values.

---

# 20. Localized Content DTO

Organizer-authored bilingual text uses:

```json
{
  "en": "Wedding Ceremony",
  "mr": "शुभविवाह"
}
```

English is required where the Database Design defines it as required.

Marathi is optional and the guest application falls back to English when absent.

The API stores canonical values; it does not machine-translate wedding content in V1.

---

# 21. Pagination Convention

Potentially large collections use cursor pagination.

Request:

```text
GET /api/v1/guests?limit=50&cursor=<opaque-cursor>
```

Response:

```json
{
  "data": [],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

Rules:

- default limit: `25`
- recommended maximum limit: `100`
- cursor is opaque to the client
- client must not construct cursors

Media pagination should use stable ordering based on `createdAt + id` internally.

---

# 22. Sorting and Filtering Convention

Query parameters use simple field-specific filters instead of a generic query language.

Examples:

```text
GET /api/v1/tasks?status=IN_PROGRESS&assignee=me
GET /api/v1/expenses?paymentStatus=UNPAID&eventId=...
GET /api/v1/guests?tag=GROOM_SIDE&rsvpStatus=ATTENDING
```

Sorting example:

```text
?sort=dueAt&order=asc
```

Only documented sort fields are accepted.

Unknown or unsupported filter/sort values return validation errors rather than being silently ignored.

---

# 23. Search Convention

Simple V1 search uses:

```text
?q=<search-text>
```

Examples:

```text
GET /api/v1/guests?q=sharma
GET /api/v1/vendors?q=decorator
```

V1 search is bounded to tenant-scoped fields and does not require Atlas Search.

---

# 24. Authentication API

Base:

```text
/api/v1/auth
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create organizer account |
| `POST` | `/auth/login` | Public | Create organizer session |
| `POST` | `/auth/logout` | Organizer | Revoke current session |
| `GET` | `/auth/session` | Organizer | Return current organizer identity/context |
| `POST` | `/auth/forgot-password` | Public | Send password-reset email |
| `POST` | `/auth/reset-password` | Reset token | Set new password |
| `POST` | `/auth/change-password` | Organizer | Change password while logged in |

---

# 25. Register

```text
POST /api/v1/auth/register
```

Request:

```json
{
  "name": "Deepesh Sharma",
  "email": "deepesh@example.com",
  "password": "..."
}
```

Response `201`:

```json
{
  "data": {
    "user": {
      "id": "...",
      "name": "Deepesh Sharma",
      "email": "deepesh@example.com"
    }
  }
}
```

Registration alone does not create the Wedding. The user creates a wedding with the Wedding API afterward.

V1 does not require email verification.

Duplicate normalized email returns `409 CONFLICT`.

---

# 26. Login

```text
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "deepesh@example.com",
  "password": "..."
}
```

On success, the server sets the secure session cookie.

Response:

```json
{
  "data": {
    "user": {
      "id": "...",
      "name": "Deepesh Sharma",
      "email": "deepesh@example.com"
    },
    "membership": {
      "role": "ADMIN",
      "weddingId": "..."
    }
  }
}
```

If the user has registered but not yet created/joined a wedding, `membership` may be `null`.

Login errors should not reveal whether an email exists.

---

# 27. Current Session

```text
GET /api/v1/auth/session
```

Example response:

```json
{
  "data": {
    "user": {
      "id": "...",
      "name": "Deepesh Sharma",
      "email": "deepesh@example.com"
    },
    "membership": {
      "id": "...",
      "role": "ADMIN",
      "weddingId": "..."
    }
  }
}
```

This endpoint is useful for bootstrapping the organizer app.

---

# 28. Forgot and Reset Password

Forgot:

```text
POST /api/v1/auth/forgot-password
```

Request:

```json
{
  "email": "deepesh@example.com"
}
```

Always return a generic success response whether or not the account exists.

Reset:

```text
POST /api/v1/auth/reset-password
```

Request:

```json
{
  "token": "raw-reset-token",
  "newPassword": "..."
}
```

Successful reset consumes the token and revokes relevant prior sessions according to the authentication policy.

---

# 29. Wedding API

Base:

```text
/api/v1/wedding
```

Because an organizer belongs to at most one wedding in V1, organizer APIs do not require `weddingId` in the URL.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/wedding` | Organizer without active wedding | Create wedding/tenant |
| `GET` | `/wedding` | Organizer | Get current wedding |
| `PATCH` | `/wedding` | Admin/Manager | Update wedding details |
| `PATCH` | `/wedding/website` | Admin/Manager | Update guest-site settings |
| `PATCH` | `/wedding/livestream` | Admin/Manager | Update YouTube livestream settings |

---

# 30. Create Wedding

```text
POST /api/v1/wedding
```

Request example:

```json
{
  "couple": {
    "bride": {
      "name": {
        "en": "Priya Sharma",
        "mr": "प्रिया शर्मा"
      }
    },
    "groom": {
      "name": {
        "en": "Deepesh Patil",
        "mr": "दीपेश पाटील"
      }
    }
  },
  "title": {
    "en": "Deepesh & Priya",
    "mr": "दीपेश आणि प्रिया"
  },
  "mainWeddingDate": "2027-02-14",
  "timezone": "Asia/Kolkata",
  "primaryVenue": {
    "city": {
      "en": "Pune, Maharashtra"
    }
  }
}
```

Initial onboarding captures the primary wedding city or location so the
workspace can display meaningful location context immediately. Full venue
name, bilingual address, and map URL remain part of later wedding setup.
English is required for `primaryVenue.city`; Marathi may be added later and
uses the normal localized-content fallback rule.

The service transaction:

1. verifies user has no active membership
2. creates Wedding
3. creates initial `ADMIN` membership
4. generates the readable date-based slug
5. generates the media access key

Example slug:

```text
deepesh-and-priya-14022027
```

Slug uniqueness is not required for authorization.

---

# 31. Wedding Read/Update DTO

`GET /api/v1/wedding` may return:

```json
{
  "data": {
    "id": "...",
    "slug": "deepesh-and-priya-14022027",
    "couple": {},
    "title": {},
    "description": {},
    "mainWeddingDate": "2027-02-14",
    "timezone": "Asia/Kolkata",
    "primaryVenue": {},
    "website": {
      "themeId": "THEME_01",
      "defaultLocale": "en",
      "supportedLocales": ["en", "mr"],
      "livestream": {
        "enabled": false,
        "youtubeUrl": null
      }
    }
  }
}
```

The normal Wedding DTO must not expose `mediaAccessKey` unless an explicit Admin/Manager operation requires generating/displaying the Media Hub link.

---

# 32. Organizer Member API

Base:

```text
/api/v1/members
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/members` | Organizer | List active/removed members |
| `PATCH` | `/members/{memberId}` | Admin | Change role/status |
| `DELETE` | `/members/{memberId}` | Admin | Remove member |

All lookups include the authenticated wedding context.

Final-Admin protection applies to role change and removal.

---

# 33. Organizer Invitation API

Base:

```text
/api/v1/organizer-invitations
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/organizer-invitations` | Admin | Invite Admin/Manager |
| `GET` | `/organizer-invitations` | Admin | List invitations |
| `DELETE` | `/organizer-invitations/{id}` | Admin | Revoke pending invitation |
| `GET` | `/organizer-invitations/access/{token}` | Public bearer link | Read safe invite metadata |
| `POST` | `/organizer-invitations/access/{token}/accept` | Invite holder | Accept invitation |

Create request:

```json
{
  "email": "rahul@example.com",
  "role": "MANAGER"
}
```

The raw invitation token is sent through email and must not be returned in organizer-list APIs.

---

# 34. Organizer Invitation Acceptance Rules

New-account invitee may submit:

```json
{
  "name": "Rahul Sharma",
  "password": "..."
}
```

Existing account:

- must authenticate as the invited email before acceptance
- cannot already belong to another active wedding under V1 rules

Acceptance is transactional:

```text
validate invite
+ resolve/create user
+ create membership
+ mark invite accepted
```

Repeated acceptance returns a conflict rather than creating a duplicate membership.

---

# 35. Dashboard API

```text
GET /api/v1/dashboard
```

Access: Organizer.

Returns an aggregated organizer summary rather than forcing the browser to make many initial requests.

Example:

```json
{
  "data": {
    "upcomingEvents": [],
    "tasks": {
      "notStarted": 12,
      "inProgress": 5,
      "completed": 20,
      "overdue": 3,
      "assignedToMe": 4
    },
    "guests": {
      "total": 320
    },
    "expenses": {
      "paidMinor": 12000000,
      "unpaidMinor": 3000000,
      "currency": "INR"
    },
    "recentActivity": []
  }
}
```

Attendance counts should be derived from authoritative guest-event invitation/RSVP state.

---

# 36. Event API

Base:

```text
/api/v1/events
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/events` | Organizer | List wedding events |
| `POST` | `/events` | Organizer | Create event |
| `GET` | `/events/{eventId}` | Organizer | Get event |
| `PATCH` | `/events/{eventId}` | Organizer | Update event |
| `DELETE` | `/events/{eventId}` | Organizer | Soft-delete event |

V1 maximum of 10 active events is enforced by the domain service.

---

# 37. Event Create/Update Request

Example:

```json
{
  "title": {
    "en": "Sangeet",
    "mr": "संगीत"
  },
  "description": {
    "en": "An evening of music and dance.",
    "mr": "..."
  },
  "startAt": "2027-02-13T13:30:00.000Z",
  "endAt": "2027-02-13T17:30:00.000Z",
  "venue": {
    "name": {
      "en": "Royal Banquet Hall",
      "mr": "..."
    },
    "address": {
      "en": "Pune, Maharashtra",
      "mr": "..."
    },
    "mapUrl": "https://..."
  },
  "dressCode": {
    "en": "Traditional",
    "mr": "..."
  },
  "privateNotes": "Decorator arrives at 3 PM"
}
```

Domain validation includes:

- `endAt >= startAt`
- same-wedding references
- event count <= 10
- deleted event cannot be updated through normal endpoint

---

# 38. Event Image API

Event images use direct-to-R2 upload.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/events/{eventId}/image/upload-url` | Create presigned upload slot |
| `POST` | `/events/{eventId}/image/finalize` | Attach uploaded object after verification |
| `DELETE` | `/events/{eventId}/image` | Remove event image |

The image file never passes through Vercel application memory.

---

# 39. Guest API

Base:

```text
/api/v1/guests
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/guests` | Organizer | Paginated/filterable guest list |
| `POST` | `/guests` | Organizer | Create individual/family guest |
| `GET` | `/guests/{guestId}` | Organizer | Guest detail |
| `PATCH` | `/guests/{guestId}` | Organizer | Update guest |
| `DELETE` | `/guests/{guestId}` | Organizer | Remove guest and revoke access |
| `PUT` | `/guests/{guestId}/events` | Organizer | Replace active invited-event set |

---

# 40. Guest List Filters

Supported examples:

```text
GET /api/v1/guests?q=sharma
GET /api/v1/guests?tag=GROOM_SIDE
GET /api/v1/guests?eventId=...
GET /api/v1/guests?rsvpStatus=AWAITING_RESPONSE
```

Multiple documented filters may be combined.

All queries remain tenant-scoped.

---

# 41. Create Guest

```text
POST /api/v1/guests
```

Example:

```json
{
  "guestType": "FAMILY",
  "displayName": {
    "en": "Sharma Family",
    "mr": "शर्मा परिवार"
  },
  "primaryContact": {
    "name": {
      "en": "Rajesh Sharma",
      "mr": "राजेश शर्मा"
    },
    "email": "rajesh@example.com",
    "phone": "+919876543210"
  },
  "tags": ["GROOM_SIDE", "RELATIVES"],
  "organizerNotes": "Uncle's family"
}
```

The service creates or ensures the guest's personalized `GuestInvitation` capability record.

The normal response must not expose the raw invitation access key.

---

# 42. Assign Guest Events

```text
PUT /api/v1/guests/{guestId}/events
```

Request:

```json
{
  "eventIds": ["event1", "event2", "event3"]
}
```

This endpoint represents the complete desired active event set.

The service diffs current relationships:

- missing current event -> mark relationship `REMOVED`
- new event -> create `ACTIVE` relationship with `AWAITING_RESPONSE`
- re-added removed event -> reactivate and reset RSVP to `AWAITING_RESPONSE`

All supplied events must belong to the authenticated wedding.

---

# 43. Organizer RSVP Read APIs

Organizers view RSVP but do not need a separate duplicate RSVP model.

Recommended endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/events/{eventId}/rsvps` | Event guest/attendance view |
| `GET` | `/guests/{guestId}/rsvps` | One guest/family across invited events |
| `GET` | `/rsvp-summary` | Wedding-level RSVP summary |

Example event RSVP response:

```json
{
  "data": [
    {
      "guest": {
        "id": "...",
        "displayName": { "en": "Sharma Family" }
      },
      "rsvpStatus": "ATTENDING",
      "attendeeCount": 5,
      "respondedAt": "2027-01-10T10:00:00.000Z"
    }
  ]
}
```

---

# 44. Guest Wedding Context API

Guest-facing authenticated-by-invitation endpoints live under:

```text
/api/v1/guest
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/guest/context` | Guest invitation session | Wedding + guest bootstrap |
| `GET` | `/guest/events` | Guest invitation session | Only invited active events |
| `PATCH` | `/guest/events/{eventId}/rsvp` | Guest invitation session | Submit/edit event RSVP |
| `GET` | `/guest/schedule` | Guest invitation session | Chronological invited schedule |

No endpoint accepts a caller-supplied `weddingId` or `guestId`.

Both are derived from the guest session.

---

# 45. Guest Context Response

Example:

```json
{
  "data": {
    "wedding": {
      "id": "...",
      "slug": "deepesh-and-priya-14022027",
      "title": {
        "en": "Deepesh & Priya",
        "mr": "दीपेश आणि प्रिया"
      },
      "description": {
        "en": "...",
        "mr": "..."
      },
      "timezone": "Asia/Kolkata",
      "website": {
        "themeId": "THEME_01",
        "supportedLocales": ["en", "mr"],
        "livestream": {
          "enabled": true,
          "youtubeUrl": "https://youtube.com/..."
        }
      }
    },
    "guest": {
      "id": "...",
      "guestType": "FAMILY",
      "displayName": {
        "en": "Sharma Family",
        "mr": "शर्मा परिवार"
      }
    }
  }
}
```

Private organizer notes and financial/vendor/task information are never present.

---

# 46. Guest RSVP Mutation

```text
PATCH /api/v1/guest/events/{eventId}/rsvp
```

Attending family request:

```json
{
  "rsvpStatus": "ATTENDING",
  "attendeeCount": 5
}
```

Not attending:

```json
{
  "rsvpStatus": "NOT_ATTENDING",
  "attendeeCount": 0
}
```

Rules:

- event must be ACTIVE
- guest-event invitation must be ACTIVE
- individual guest attendee count normally equals 1 when attending
- family count must be >= 1 when attending
- not-attending count must equal 0
- duplicate submissions update the same relationship
- V1 concurrency policy is last successful write wins

---

# 47. Task API

Base:

```text
/api/v1/tasks
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/tasks` | Organizer | Filtered/paginated tasks |
| `POST` | `/tasks` | Organizer | Create task |
| `GET` | `/tasks/{taskId}` | Organizer | Task detail |
| `PATCH` | `/tasks/{taskId}` | Organizer | Update task |
| `DELETE` | `/tasks/{taskId}` | Organizer | Soft-delete task |
| `GET` | `/tasks/{taskId}/comments` | Organizer | List comments |
| `POST` | `/tasks/{taskId}/comments` | Organizer | Add comment |

Filters:

```text
status
eventId
assigneeMembershipId
assignee=me
dueFrom
dueTo
```

---

# 48. Task Create Example

```json
{
  "title": "Confirm Sangeet Decoration",
  "description": "Finalize stage design with decorator.",
  "eventId": "...",
  "assigneeMembershipId": "...",
  "dueAt": "2027-02-01T12:00:00.000Z",
  "status": "NOT_STARTED"
}
```

The service verifies event and assignee belong to the same wedding.

---

# 49. Attachment API

Generic attachments support tasks, task comments, vendors, and expenses.

Base:

```text
/api/v1/attachments
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/attachments/upload-url` | Organizer | Create attachment metadata + presigned PUT |
| `POST` | `/attachments/{attachmentId}/finalize` | Organizer | Verify object and mark READY |
| `GET` | `/attachments/{attachmentId}/download-url` | Organizer | Generate temporary GET URL |
| `DELETE` | `/attachments/{attachmentId}` | Organizer | Remove logical attachment/object |

Create upload request:

```json
{
  "ownerType": "EXPENSE",
  "ownerId": "...",
  "attachmentType": "RECEIPT",
  "file": {
    "name": "receipt.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 483922
  }
}
```

---

# 50. Vendor API

Base:

```text
/api/v1/vendors
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/vendors` | Organizer | List/filter vendors |
| `POST` | `/vendors` | Organizer | Create vendor |
| `GET` | `/vendors/{vendorId}` | Organizer | Vendor detail |
| `PATCH` | `/vendors/{vendorId}` | Organizer | Update vendor |
| `DELETE` | `/vendors/{vendorId}` | Organizer | Soft-remove vendor |

Filters:

```text
vendorType
eventId
q
```

Vendor `eventIds` are bounded by the wedding's maximum 10 events.

---

# 51. Expense API

Base:

```text
/api/v1/expenses
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/expenses` | Organizer | List/filter expenses |
| `POST` | `/expenses` | Organizer | Record expense |
| `GET` | `/expenses/{expenseId}` | Organizer | Expense detail |
| `PATCH` | `/expenses/{expenseId}` | Organizer | Update expense |
| `DELETE` | `/expenses/{expenseId}` | Organizer | Void expense record |

Both Admin and Manager have access in V1.

---

# 52. Expense Create Example

```json
{
  "title": "Stage Decoration",
  "amountMinor": 3000000,
  "currency": "INR",
  "category": "DECORATION",
  "eventId": "...",
  "vendorId": "...",
  "paymentStatus": "PAID",
  "paidByMembershipId": "...",
  "expenseDate": "2027-01-20T00:00:00.000Z",
  "notes": "Advance payment"
}
```

Rules:

- `amountMinor` positive integer
- V1 currency normally `INR`
- `PAID` requires valid same-wedding `paidByMembershipId`
- `UNPAID` should not carry a payer
- event/vendor/payer references must belong to the same wedding

`DELETE` changes the record to `VOIDED`; it does not physically delete financial history.

The optional payment receipt is intentionally **not** included in `POST /expenses`. Expense creation remains a JSON business-data operation, while receipt bytes use the generic Attachment API and are uploaded directly to Cloudflare R2.

## 52.1 Expense Receipt Upload Flow

V1 supports **one active receipt attachment per expense**.

A receipt is optional even when the expense is `PAID`.

`UNPAID` expenses should normally not have a receipt.

The user experience may still present this as one **Save Expense** action, but internally the frontend performs separate API/storage operations:

```text
1. POST /api/v1/expenses
      |
      v
   Expense created -> expenseId
      |
      v
2. POST /api/v1/attachments/upload-url
   ownerType = EXPENSE
   ownerId = expenseId
   attachmentType = RECEIPT
      |
      v
3. Browser PUTs receipt directly to Cloudflare R2
      |
      v
4. POST /api/v1/attachments/{attachmentId}/finalize
      |
      v
   Receipt becomes READY
```

Example attachment-upload request:

```json
{
  "ownerType": "EXPENSE",
  "ownerId": "expense_123",
  "attachmentType": "RECEIPT",
  "file": {
    "name": "receipt.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 834221
  }
}
```

The attachment metadata is stored in MongoDB and the receipt file bytes are stored in R2.

The Expense document does not store the binary file.

When reading an expense detail, the Expense DTO may include safe receipt metadata such as:

- attachment ID
- filename
- MIME type
- file size

It should not expose a permanent R2 object URL.

To open or download the receipt, the organizer uses:

```text
GET /api/v1/attachments/{attachmentId}/download-url
```

If expense creation succeeds but receipt upload or finalization fails, the expense remains valid and saved.

The UI should show the expense without a receipt and allow the organizer to retry only the receipt upload.

This prevents:

- duplicate expense records
- duplicate financial amounts
- unnecessary rollback of valid expense information

If a receipt is replaced, the service must ensure that only **one active `RECEIPT` attachment** exists for that expense according to the attachment lifecycle policy.

---

# 53. Calendar API

```text
GET /api/v1/calendar?from=<ISO>&to=<ISO>
```

Access: Organizer.

Response merges events and task deadlines at the API/service layer:

```json
{
  "data": [
    {
      "type": "EVENT",
      "id": "...",
      "title": "Sangeet",
      "startsAt": "...",
      "endsAt": "..."
    },
    {
      "type": "TASK_DUE",
      "id": "...",
      "title": "Confirm decorator",
      "startsAt": "...",
      "endsAt": null
    }
  ]
}
```

This avoids creating a duplicate Calendar collection.

---

# 54. Media Album API

Organizer endpoints:

```text
/api/v1/media/albums
```

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/media/albums` | List wedding albums |
| `POST` | `/media/albums` | Create album |
| `PATCH` | `/media/albums/{albumId}` | Rename/reorder album |
| `DELETE` | `/media/albums/{albumId}` | Remove album grouping according to domain policy |

Deleting an album must not silently delete media unless the operation explicitly requests media deletion.

---

# 55. Organizer Media API

Base:

```text
/api/v1/media
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/media/items` | Organizer | Paginated gallery metadata |
| `POST` | `/media/uploads` | Organizer | Create media upload slot |
| `POST` | `/media/uploads/{mediaId}/finalize` | Organizer | Finalize direct R2 upload |
| `GET` | `/media/items/{mediaId}/download-url` | Organizer | Temporary original download URL |
| `DELETE` | `/media/items/{mediaId}` | Organizer | Start deletion flow |
| `GET` | `/media/access-link` | Organizer | Return Media Hub URL/QR payload data |

Normal wedding DTOs should not expose the raw media key.

---

# 56. Media Hub API

Media-access-session endpoints:

```text
/api/v1/media-hub
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/media-hub/context` | Media session | Basic wedding/media context |
| `GET` | `/media-hub/albums` | Media session | Browse albums |
| `GET` | `/media-hub/items` | Media session | Paginated photos/videos |
| `POST` | `/media-hub/uploads` | Media session | Create anonymous guest upload slot |
| `POST` | `/media-hub/uploads/{mediaId}/finalize` | Media session | Finalize guest upload |
| `GET` | `/media-hub/items/{mediaId}/download-url` | Media session | Download original |
| `POST` | `/media-hub/downloads` | Media session | Request multiple individual download URLs |

No personalized guest identity is required.

---

# 57. Media Upload Request

Example:

```text
POST /api/v1/media-hub/uploads
```

```json
{
  "albumId": "...",
  "eventId": "...",
  "file": {
    "name": "IMG_1024.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 12849503
  }
}
```

Response:

```json
{
  "data": {
    "mediaId": "...",
    "upload": {
      "method": "PUT",
      "url": "https://presigned-r2-url...",
      "headers": {
        "Content-Type": "image/jpeg"
      },
      "expiresAt": "2026-10-16T12:05:00.000Z"
    }
  }
}
```

The application stores `PENDING_UPLOAD` metadata before issuing the URL.

---

# 58. Media Upload Validation

Before presigning:

- validate active organizer or Media Hub context
- validate file classification
- image max = 20 MB
- video max = 100 MB
- allow approved MIME types/extensions
- generate opaque R2 object key
- validate target album/event belongs to same wedding

The presigned URL grants access only to the intended R2 object/operation for a short period.

---

# 59. Media Finalize

```text
POST /api/v1/media-hub/uploads/{mediaId}/finalize
```

or organizer equivalent.

Server verifies:

- media metadata belongs to access-context wedding
- state is `PENDING_UPLOAD`
- expected R2 object exists
- object size/content metadata is acceptable

Then atomically changes:

```text
PENDING_UPLOAD -> READY
```

Repeated finalize requests should be idempotent:

```text
READY -> return current READY representation
```

rather than creating duplicates.

---

# 60. Gallery Delivery DTO

Gallery metadata should return optimized-display URLs separately from original-download behavior.

Example:

```json
{
  "id": "...",
  "mediaType": "IMAGE",
  "albumId": "...",
  "createdAt": "...",
  "display": {
    "thumbnailUrl": "https://media.vivaahly.com/...optimized...",
    "gridUrl": "https://media.vivaahly.com/...optimized..."
  }
}
```

Do not use the 10-15 MB original object as the gallery grid source.

Original download is obtained separately using a temporary download URL/API operation.

---

# 61. Multi-file Download API

```text
POST /api/v1/media-hub/downloads
```

Request:

```json
{
  "mediaIds": ["id1", "id2", "id3"]
}
```

Response:

```json
{
  "data": {
    "downloads": [
      {
        "mediaId": "id1",
        "url": "https://temporary-download-url..."
      }
    ]
  }
}
```

V1 does not generate a ZIP archive.

The UI initiates individual downloads in manageable batches.

---

# 62. Email Campaign API

Base:

```text
/api/v1/email-campaigns
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/email-campaigns` | Organizer | Create guest invitation/reminder campaign |
| `GET` | `/email-campaigns/{campaignId}` | Organizer | Campaign progress |
| `GET` | `/email-campaigns/{campaignId}/recipients` | Organizer | Recipient states |
| `POST` | `/email-campaigns/{campaignId}/send-next` | Organizer | Send next pending batch |
| `POST` | `/email-campaigns/{campaignId}/retry-failed` | Organizer | Move retryable failed recipients back to pending/send |

V1 intentionally has no external queue service.

---

# 63. Create Email Campaign

Example:

```text
POST /api/v1/email-campaigns
```

```json
{
  "campaignType": "GUEST_INVITATION",
  "guestIds": ["guest1", "guest2", "guest3"]
}
```

The service:

1. verifies guests belong to current wedding
2. ensures each has an email and active invitation
3. creates campaign
4. creates recipient rows with email snapshots
5. returns campaign status

A campaign is immutable in recipient membership once sending starts.

---

# 64. Send Next Email Batch

```text
POST /api/v1/email-campaigns/{campaignId}/send-next
```

The server selects the next bounded set of `PENDING` recipients and sends them through Resend.

V1 should keep each provider batch at or below the supported Resend batch size.

Response example:

```json
{
  "data": {
    "processed": 100,
    "sent": 98,
    "failed": 2,
    "remaining": 147,
    "campaignStatus": "PARTIAL"
  }
}
```

Stable idempotency keys protect against repeated browser calls/network retries.

---

# 65. Manual RSVP Reminder

Manual reminder uses the same email campaign subsystem.

Example campaign creation:

```json
{
  "campaignType": "RSVP_REMINDER",
  "guestIds": ["guest1", "guest2"]
}
```

The service should normally reject or skip guests who:

- are removed
- have no email
- have no active personalized invitation

Whether already-complete RSVP guests are excluded can be controlled by UI selection/domain rules.

---

# 66. Activity API

If Recent Activity is enabled in V1:

```text
GET /api/v1/activity?limit=20&cursor=...
```

Access: Organizer.

Only safe presentation metadata is returned.

No passwords, access keys, invitation tokens, session tokens, or provider secrets appear in activity DTOs.

---

# 67. Localization API Behavior

There is no translation API in V1.

Organizer APIs return authored localized objects:

```json
{
  "title": {
    "en": "Wedding",
    "mr": "शुभविवाह"
  }
}
```

Guest APIs may also return both authored locales so the client can switch instantly.

System-controlled translations remain application translation resources rather than database API content.

---

# 68. Resource Deletion Semantics

`DELETE` does not always mean physical deletion.

| Resource | V1 API behavior |
|---|---|
| Event | Soft-delete |
| Guest | Remove + revoke invitation + deactivate event access |
| Task | Soft-delete |
| Vendor | Soft-remove |
| Expense | Void record |
| Member | Mark membership removed |
| Organizer invitation | Revoke pending invitation |
| Media | Mark deletion pending, delete R2 object, then deleted |
| Session | Hard revoke/delete |

APIs should return current logical state rather than pretending historical records were erased.

---

# 69. Idempotency Policy

Operations where a retry could produce duplicate side effects should be idempotent.

Required/important cases:

- media finalize
- email batch send
- organizer invitation acceptance
- guest event RSVP update
- password reset token consumption

For provider calls such as email sending, use stable server-generated idempotency keys.

A future generic `Idempotency-Key` request header can be added if needed, but V1 does not require it on every create operation.

---

# 70. Concurrency Policy

V1 does not implement ETags or optimistic-lock versions for normal forms.

Normal updates:

> Last successful write wins.

Examples:

- two organizers editing one event
- two organizers editing one task

Critical invariants are handled server-side using atomic operations/transactions:

- event maximum 10
- final Admin cannot be removed
- organizer invite acceptance
- guest removal cascading state changes

RSVP remains one guest-event relationship, so simultaneous updates cannot create duplicate records.

---

# 71. Caching Policy

Organizer and personalized guest APIs contain private tenant data.

Default recommendation:

```http
Cache-Control: private, no-store
```

for authentication, organizer, RSVP, invitation-context, and sensitive guest endpoints unless a specific safe caching strategy is deliberately introduced.

Do not allow shared/CDN cache keys to accidentally mix:

- different organizers
- different invitations
- different wedding tenants

Media image bytes are separately cached by Cloudflare CDN/image delivery.

---

# 72. Rate Limiting Targets

Rate limiting mechanism/provider is an implementation decision, but the API contract identifies endpoints that require protection:

High priority:

- `/auth/login`
- `/auth/forgot-password`
- `/auth/reset-password`
- organizer invitation token resolution/acceptance
- guest invitation entry resolution
- guest RSVP mutation
- media access resolution
- media upload-url creation
- Media Hub anonymous uploads
- email campaign send command

Responses use:

```http
429 Too Many Requests
```

with error code:

```text
RATE_LIMITED
```

---

# 73. Logging and Request IDs

Every request should receive a correlation/request ID.

Example error response:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong.",
    "requestId": "req_01..."
  }
}
```

Structured logs may include:

- request ID
- route name
- HTTP status
- duration
- non-sensitive internal resource IDs
- provider request IDs

Never log:

- passwords
- session raw tokens
- password reset raw tokens
- organizer invitation raw tokens
- guest invitation access keys
- media access keys
- R2 presigned URLs in full
- provider API secrets

---

# 74. API Authorization Matrix

| Domain | Admin | Manager | Guest Invitation | Media Access |
|---|:---:|:---:|:---:|:---:|
| Wedding organizer details | Yes | Yes | No | No |
| Manage organizers | Yes | No | No | No |
| Events CRUD | Yes | Yes | No | No |
| Guests CRUD | Yes | Yes | No | No |
| Send invitations | Yes | Yes | No | No |
| RSVP organizer reports | Yes | Yes | No | No |
| Submit own invitation RSVP | No | No | Yes | No |
| Tasks | Yes | Yes | No | No |
| Vendors | Yes | Yes | No | No |
| Expenses | Yes | Yes | No | No |
| Wedding website invited events | No | No | Yes | No |
| Media browse | Yes | Yes | Optional through organizer API | Yes |
| Media upload | Yes | Yes | No special right | Yes |
| Media download | Yes | Yes | No special right | Yes |

The three access contexts remain intentionally separate.

---

# 75. Tenant Isolation Requirements

Every tenant-owned repository query invoked by organizer APIs must include authenticated `weddingId`.

Examples:

```text
findEvent({ id, weddingId })
findExpense({ id, weddingId })
findTask({ id, weddingId })
```

Never:

```text
findEvent({ id })
```

for an organizer-facing operation.

Guest APIs resolve wedding from guest session.

Media Hub APIs resolve wedding from media session.

The browser never supplies authoritative tenant context.

---

# 76. Cross-resource Validation

When a request references another resource, the API/domain layer validates same-tenant ownership.

Examples:

```text
Task.eventId -> same wedding
Task.assigneeMembershipId -> same wedding
Expense.eventId -> same wedding
Expense.vendorId -> same wedding
Expense.paidByMembershipId -> same wedding
Vendor.eventIds -> same wedding
Media.albumId -> same wedding
Guest event assignment -> same wedding
```

A valid MongoDB ObjectId from another wedding still returns `NOT_FOUND`/`FORBIDDEN` according to the endpoint policy.

---

# 77. API Naming Rules

Use plural resource nouns:

```text
/events
/guests
/tasks
/vendors
/expenses
```

Use kebab-case for multiword paths:

```text
/organizer-invitations
/email-campaigns
/media-hub
```

JSON fields use camelCase:

```json
{
  "attendeeCount": 5,
  "paymentStatus": "PAID"
}
```

Enums use uppercase snake case:

```text
AWAITING_RESPONSE
IN_PROGRESS
PENDING_UPLOAD
```

---

# 78. Endpoint Summary

## Authentication

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/session
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/change-password
```

## Wedding

```text
POST   /api/v1/wedding
GET    /api/v1/wedding
PATCH  /api/v1/wedding
PATCH  /api/v1/wedding/website
PATCH  /api/v1/wedding/livestream
GET    /api/v1/dashboard
GET    /api/v1/calendar
```

## Members

```text
GET    /api/v1/members
PATCH  /api/v1/members/{memberId}
DELETE /api/v1/members/{memberId}
```

## Organizer Invitations

```text
POST   /api/v1/organizer-invitations
GET    /api/v1/organizer-invitations
DELETE /api/v1/organizer-invitations/{id}
GET    /api/v1/organizer-invitations/access/{token}
POST   /api/v1/organizer-invitations/access/{token}/accept
```

## Events

```text
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/{eventId}
PATCH  /api/v1/events/{eventId}
DELETE /api/v1/events/{eventId}
POST   /api/v1/events/{eventId}/image/upload-url
POST   /api/v1/events/{eventId}/image/finalize
DELETE /api/v1/events/{eventId}/image
GET    /api/v1/events/{eventId}/rsvps
```

## Guests

```text
GET    /api/v1/guests
POST   /api/v1/guests
GET    /api/v1/guests/{guestId}
PATCH  /api/v1/guests/{guestId}
DELETE /api/v1/guests/{guestId}
PUT    /api/v1/guests/{guestId}/events
GET    /api/v1/guests/{guestId}/rsvps
GET    /api/v1/rsvp-summary
```

## Guest Website

```text
GET    /api/v1/guest/context
GET    /api/v1/guest/events
GET    /api/v1/guest/schedule
PATCH  /api/v1/guest/events/{eventId}/rsvp
```

## Tasks

```text
GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/{taskId}
PATCH  /api/v1/tasks/{taskId}
DELETE /api/v1/tasks/{taskId}
GET    /api/v1/tasks/{taskId}/comments
POST   /api/v1/tasks/{taskId}/comments
```

## Vendors

```text
GET    /api/v1/vendors
POST   /api/v1/vendors
GET    /api/v1/vendors/{vendorId}
PATCH  /api/v1/vendors/{vendorId}
DELETE /api/v1/vendors/{vendorId}
```

## Expenses

```text
GET    /api/v1/expenses
POST   /api/v1/expenses
GET    /api/v1/expenses/{expenseId}
PATCH  /api/v1/expenses/{expenseId}
DELETE /api/v1/expenses/{expenseId}
```

Expense receipt uploads use the generic Attachment API after expense creation.

## Attachments

```text
POST   /api/v1/attachments/upload-url
POST   /api/v1/attachments/{attachmentId}/finalize
GET    /api/v1/attachments/{attachmentId}/download-url
DELETE /api/v1/attachments/{attachmentId}
```

## Organizer Media

```text
GET    /api/v1/media/albums
POST   /api/v1/media/albums
PATCH  /api/v1/media/albums/{albumId}
DELETE /api/v1/media/albums/{albumId}
GET    /api/v1/media/items
POST   /api/v1/media/uploads
POST   /api/v1/media/uploads/{mediaId}/finalize
GET    /api/v1/media/items/{mediaId}/download-url
DELETE /api/v1/media/items/{mediaId}
GET    /api/v1/media/access-link
```

## Media Hub

```text
GET    /api/v1/media-hub/context
GET    /api/v1/media-hub/albums
GET    /api/v1/media-hub/items
POST   /api/v1/media-hub/uploads
POST   /api/v1/media-hub/uploads/{mediaId}/finalize
GET    /api/v1/media-hub/items/{mediaId}/download-url
POST   /api/v1/media-hub/downloads
```

## Email Campaigns

```text
POST   /api/v1/email-campaigns
GET    /api/v1/email-campaigns/{campaignId}
GET    /api/v1/email-campaigns/{campaignId}/recipients
POST   /api/v1/email-campaigns/{campaignId}/send-next
POST   /api/v1/email-campaigns/{campaignId}/retry-failed
```

## Optional Activity

```text
GET    /api/v1/activity
```

---

# 79. Important API Edge Cases

## Duplicate registration email

Return `409 CONFLICT` using normalized email uniqueness.

## Login with unknown email vs wrong password

Return the same generic authentication failure.

## Organizer account has no wedding yet

Auth session is valid; wedding-protected endpoints return an onboarding-specific conflict/not-found state rather than treating the user as unauthenticated.

## User tries to create second wedding

Return `409 CONFLICT` because V1 allows one active wedding membership.

## Cross-wedding object ID

Return `404 NOT_FOUND` after tenant-scoped lookup.

## Final Admin removal

Return `409 CONFLICT`.

## Eleventh event

Return `409 CONFLICT` or domain validation error; do not create it.

## Event deleted after guest RSVP

Guest API no longer returns the event. Historical RSVP remains server-side.

## Guest event removed then re-added

RSVP resets to `AWAITING_RESPONSE` according to Database Design.

## Guest submits RSVP twice

Update same guest-event invitation record; do not add attendance counters blindly.

## Invitation link forwarded

Accepted V1 behavior; forwarded holder obtains the same guest context.

## Invalid/expired/revoked organizer invitation

Return safe invalid-invitation response without exposing unnecessary account information.

## Expense created but receipt upload fails

Keep the expense record.

Do not roll it back or create another expense automatically.

The organizer can retry the receipt upload through the Attachment API.

## Second active receipt uploaded for one expense

Reject or replace according to the explicit receipt-replacement policy.

V1 must never leave more than one active `RECEIPT` attachment for the same expense.

## Media file too large

Reject before presigning with `413` or standardized validation response.

## R2 upload succeeds but finalize fails

Media remains invisible until a successful finalize call.

## Finalize called twice

Return existing READY result idempotently.

## Media item deleted while download URL exists

Short-lived URL may remain usable briefly depending on storage semantics; logical gallery access disappears immediately. This is accepted V1 behavior.

## Browser blocks many file downloads

Return individual download URLs; client should process them in manageable groups.

## Email Send button clicked twice

Campaign/recipient state + stable idempotency prevents duplicate logical sends.

## Browser closes while bulk emails are sending

Persisted campaign state allows the organizer to resume using `send-next`.

## Resend temporary failure

Mark affected recipients `FAILED`/retryable and return campaign progress; do not roll back already-sent recipients.

## Same couple names/date and duplicate slug

No API authorization issue. Guest session resolves `weddingId`; slug is not used as tenant identity.

## Marathi value missing

API may return `mr: null`/omit optional field according to final DTO schema; client falls back to English consistently.

---

# 80. Security-Sensitive Endpoint Rules

Token-bearing entry routes and APIs require special treatment.

Never place raw values into analytics/logs for:

- organizer invitation token
- password reset token
- guest invitation access key
- media access key
- session token

Where token lookup is necessary:

- consume token from route/request
- resolve access
- establish server-side access context
- redirect to clean URL where practical

This reduces accidental leakage through browser history/referrers/log pipelines.

---

# 81. Public vs Private API Surface

Public/unauthenticated endpoints are intentionally few:

```text
POST /auth/register
POST /auth/login
POST /auth/forgot-password
POST /auth/reset-password
GET/POST organizer invite access routes
```

Guest and Media Hub endpoints are not "public data" endpoints. They require possession-derived access context.

Organizer endpoints require an authenticated organizer session.

---

# 82. API Testing Requirements

Each domain should include tests for:

1. happy path
2. Zod validation failure
3. unauthenticated request
4. cross-tenant ID attempt
5. removed/deleted resource behavior
6. duplicate/retry behavior where relevant
7. authorization role restrictions

Tenant-isolation tests are mandatory for every organizer resource API.

Critical flow tests:

- register -> create wedding -> become Admin
- Admin invite -> Manager accept
- guest creation -> assign events -> send invitation
- invitation access -> guest RSVP
- anonymous Media Hub upload -> finalize -> gallery browse
- expense paid-by validation
- expense creation -> receipt upload -> finalize
- expense saved + receipt failure -> retry receipt without duplicate expense
- bulk email partial failure/resume

---

# 83. Route Handler Organization

Recommended conceptual Next.js layout:

```text
src/app/api/v1/
  auth/
  wedding/
  members/
  organizer-invitations/
  events/
  guests/
  guest/
  tasks/
  vendors/
  expenses/
  attachments/
  media/
  media-hub/
  email-campaigns/
  dashboard/
  calendar/
```

Route files should remain thin.

Example responsibility split:

```text
route.ts
  -> parse + validate
  -> resolve context
  -> call service
  -> map response/error

service.ts
  -> business rules
  -> authorization decisions
  -> transaction orchestration

repository.ts
  -> MongoDB queries

provider adapter
  -> R2 / Resend
```

---

# 84. DTO Separation

Database documents should not be returned directly from Route Handlers.

Use explicit DTO mapping.

Reasons:

- hide internal fields
- hide sensitive access keys
- convert `_id` to `id`
- prevent accidental future field exposure
- keep response contracts stable if persistence changes

Example:

```text
Wedding Mongo Document
        |
        v
mapWeddingOrganizerDto()
        |
        v
JSON response
```

Guest Wedding DTO and Organizer Wedding DTO should be separate because their visibility rules differ substantially.

---

# 85. Provider Failure Policy

MongoDB failure:

- return service unavailable/internal error
- no provider-specific details to client

Resend failure:

- preserve campaign recipient state
- mark failure with safe code
- allow retry

R2 presign failure:

- no upload slot is returned

R2 object verification failure:

- media/attachment does not become READY

YouTube is only an embedded guest URL; Vivaahly does not proxy livestream traffic.

---

# 86. API Observability

Minimum V1 API diagnostics:

- route
- request ID
- response status
- latency
- safe organizer/wedding internal identifiers where useful
- Mongo/provider error category
- Resend provider message/request IDs where available
- media finalization state

Avoid expensive full request-body logging, especially for PII and secrets.

---

# 87. Non-Goals for V1 API

The API does not include:

- public third-party developer API
- OAuth provider integrations
- GraphQL
- WebSocket realtime API
- WhatsApp/SMS APIs
- accommodation/transport APIs
- advanced permissions API
- reimbursement/settlement API
- photographer/vendor portal API
- face recognition/media AI API
- ZIP-generation API
- native livestream API
- multi-wedding tenant-selection API
- webhook platform for external developers

---

# 88. Future Extension Points

The V1 API leaves clear expansion paths.

## Multiple weddings per user

Add active-tenant selection and `/weddings/{weddingId}` organizer routes while preserving service-level tenant context.

## Queue/workflow service

Replace `send-next` implementation behind the email module without changing campaign semantics.

## WhatsApp notifications

Add provider adapters/campaign channel types.

## More languages

Localized DTO expands with additional locale keys.

## Larger/resumable video uploads

Extend upload API to multipart upload lifecycle.

## Media privacy modes

Media access context can support open/invitation/PIN policies without changing organizer auth.

---

# 89. API Decision Register

| ID | Decision | Reason |
|---|---|---|
| API-001 | Use `/api/v1` Route Handlers | Explicit testable HTTP contract inside Next.js monolith |
| API-002 | Cookie/server sessions for organizers | Revocable secure custom auth |
| API-003 | Separate guest and media access sessions | Preserve independent trust boundaries |
| API-004 | Never accept authoritative organizer `weddingId` | Tenant isolation |
| API-005 | Zod at every external boundary | Consistent runtime validation |
| API-006 | Cursor pagination for large resources | Stable scalable collection reads |
| API-007 | Direct-to-R2 uploads | Keep media bytes off Vercel |
| API-008 | Explicit media finalize step | Prevent incomplete files appearing in gallery |
| API-009 | Resend campaign `send-next` flow without queue | Keep V1 simple while preserving resumability |
| API-010 | Integer minor-unit money | Avoid floating-point errors |
| API-011 | Slug never authorizes wedding | Duplicate readable date-based slugs are safe |
| API-012 | Soft-delete/void via resource APIs | Preserve wedding history |
| API-013 | Database docs mapped to DTOs | Prevent sensitive/internal field leakage |
| API-014 | Last-write-wins normal edits | Avoid V1 collaboration complexity |
| API-015 | Expense receipts use Attachment API + R2 | Keep expense JSON separate from binary storage and make failed uploads retry-safe |

---

# 90. API Phase Completion

With this document finalized, Vivaahly has:

```text
PRD
  ✓

System Design / High-Level Architecture
  ✓

Database Design
  ✓

API Design
  ✓
```

The API is now defined around the same architectural boundaries as the rest of Vivaahly:

```text
Organizer Session
Guest Invitation Session
Media Hub Session
        |
        v
/api/v1 Route Handlers
        |
        v
Zod Validation
        |
        v
Domain Services
        |
        v
MongoDB / R2 / Resend
```

The next engineering phase should be implementation planning/project scaffolding, where these contracts are translated into the actual Next.js directory structure, shared Zod schemas, database adapters/models, authentication utilities, and domain modules.

---

# Appendix A. External Capability References

The following provider/framework capabilities are relied upon by this design:

- Next.js Route Handlers support standard HTTP methods inside the App Router.
- Cloudflare R2 presigned URLs allow temporary direct browser operations without exposing R2 credentials.
- Resend Batch Email API supports sending multiple individual messages in one batch request; Vivaahly keeps each V1 batch within the provider-supported limit.

These provider details are implementation dependencies; the Vivaahly domain contract remains defined by this document.
