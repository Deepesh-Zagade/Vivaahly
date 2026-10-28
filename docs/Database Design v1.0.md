# Vivaahly

## Database Design — MVP v1.0

**Product:** Vivaahly  
**Database:** MongoDB Atlas  
**Architecture:** Multi-tenant Modular Monolith  
**Tenant:** Wedding  
**Version:** 1.0  
**Status:** Database Design Baseline  
**Date:** 14 October 2026

# 1. Purpose

This document translates the Vivaahly PRD and High-Level System Design
into an explicit MongoDB data model.

It defines:

- MongoDB collections
- Document responsibilities
- Relationships
- Embedded vs referenced data
- Multi-tenant isolation
- Authentication persistence
- Guest invitation modeling
- Event-level RSVP modeling
- Tasks and comments
- Vendor and expense relationships
- Media metadata
- File attachments
- Email campaign persistence
- Localization representation
- Indexing strategy
- Deletion and historical-data behavior
- Atomicity and transaction requirements
- Important database edge cases

This document intentionally does **not** define final API endpoints,
request/response DTOs, React components, or UI implementation.

# 2. Database Design Principles

Vivaahly will follow the following database principles.

## 2.1 Wedding Is the Tenant

Every wedding-owned document must contain:

    weddingId

Examples:

    Event
    Guest
    Task
    Vendor
    Expense
    Media
    Invitation
    RSVP

All organizer queries must be scoped using the wedding resolved from the
authenticated organizer session.

An object ID by itself must never grant access.

Example:

    BAD

    findExpense({
      _id: expenseId
    })

Preferred:

    GOOD

    findExpense({
      _id: expenseId,
      weddingId: authenticatedWeddingId
    })

## 2.2 Internal IDs

MongoDB `ObjectId` will be used for internal entity identifiers.

Example:

    _id: ObjectId(...)

References between collections also use `ObjectId`.

Externally shareable invitation/media links do not expose predictable
database IDs as access credentials.

# 3. Multi-Tenant Model

The database is architected as multi-tenant even though V1 follows:

> One user account → one wedding.

The relationship is:

    User
      │
      ▼
    Wedding Membership
      │
      ▼
    Wedding (Tenant)
      │
      ├── Events
      ├── Guests
      ├── Guest Invitations
      ├── Event Invitations / RSVP
      ├── Tasks
      ├── Vendors
      ├── Expenses
      ├── Media
      └── Email Campaigns

The `User` document itself should **not contain a permanent**
`weddingId` **field**.

Instead, membership is modeled separately.

This prevents the core user model from becoming coupled to the current
one-wedding-per-user product restriction.

If Vivaahly later supports:

    One user → multiple weddings

the database model remains valid.

# 4. Collection Overview

The proposed V1 collections are:

| Collection                | Responsibility                       |
|---------------------------|--------------------------------------|
| `users`                   | Organizer identities                 |
| `sessions`                | Authenticated organizer sessions     |
| `passwordResetTokens`     | Forgot-password recovery             |
| `organizerInvitations`    | Inviting Admins/Managers             |
| `weddings`                | Tenant and wedding configuration     |
| `weddingMembers`          | User ↔ wedding membership and role   |
| `events`                  | Wedding ceremonies/events            |
| `guests`                  | Individual/family guest records      |
| `guestInvitations`        | Personalized guest invitation access |
| `guestEventInvitations`   | Guest ↔ event invitation + RSVP      |
| `tasks`                   | Wedding tasks                        |
| `taskComments`            | Task discussions                     |
| `vendors`                 | Wedding vendors                      |
| `expenses`                | Wedding expenses                     |
| `attachments`             | Task/vendor/expense files            |
| `mediaAlbums`             | Wedding media grouping               |
| `mediaItems`              | Gallery photo/video metadata         |
| `emailCampaigns`          | Bulk invitation/reminder campaign    |
| `emailCampaignRecipients` | Per-recipient email delivery state   |
| `activityLogs`            | Optional recent activity feed        |

# 5. Relationship Overview

Conceptually:

    User
     │
     ├── Session
     ├── PasswordResetToken
     │
     ▼
    WeddingMember
     │
     ▼
    Wedding
     │
     ├──────── Event
     │           │
     │           ├── GuestEventInvitation
     │           ├── Task
     │           ├── Vendor
     │           ├── Expense
     │           └── MediaAlbum
     │
     ├──────── Guest
     │           │
     │           ├── GuestInvitation
     │           └── GuestEventInvitation
     │
     ├──────── Task
     │           └── TaskComment
     │
     ├──────── Vendor
     │           └── Expense
     │
     ├──────── Expense
     │
     ├──────── MediaAlbum
     │           └── MediaItem
     │
     └──────── EmailCampaign
                 └── EmailCampaignRecipient

# 6. Common Field Conventions

Most domain documents should use:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      createdAt: Date,
      updatedAt: Date
    }

Where deletion needs to preserve history:

    deletedAt: Date | null

All dates are stored as UTC timestamps.

The wedding itself stores its timezone:

    timezone: "Asia/Kolkata"

The UI converts timestamps into the appropriate local representation.

# 7. Localized Text Model

The guest website supports English and Marathi, including
organizer-authored wedding content.

Reusable localized text should use a structure similar to:

    {
      en: "Wedding Ceremony",
      mr: "शुभविवाह"
    }

English is required.

Marathi is optional.

If Marathi does not exist:

    Marathi requested
            ↓
    Marathi value available?
          /       \
        YES        NO
         ↓          ↓
     Marathi     English fallback

This structure can later become:

    {
      en: "...",
      mr: "...",
      hi: "...",
      gu: "..."
    }

without changing the surrounding entity design.

# 8. `users`

Represents an organizer identity.

It does not represent wedding guests.

Example:

    {
      _id: ObjectId,

      name: "Deepesh Sharma",

      email: "deepesh@example.com",
      emailNormalized: "deepesh@example.com",

      passwordHash: "...",

      status: "ACTIVE",

      createdAt: Date,
      updatedAt: Date
    }

Possible statuses:

    ACTIVE
    DISABLED

Passwords are never stored directly.

Only an Argon2id-generated password hash is persisted.

## 8.1 User Indexes

    UNIQUE:
    emailNormalized

This prevents duplicate organizer accounts using the same normalized
email.

# 9. `sessions`

Stores authenticated organizer sessions.

Example:

    {
      _id: ObjectId,

      userId: ObjectId,

      tokenHash: "...",

      expiresAt: Date,

      createdAt: Date,
      lastSeenAt: Date
    }

The raw session token exists only inside the secure browser cookie.

Only a non-reversible token hash is stored.

## 9.1 Session Indexes

    UNIQUE:
    tokenHash

    INDEX:
    userId

    TTL INDEX:
    expiresAt

Expired sessions are automatically removed.

# 10. `passwordResetTokens`

Used by the Forgot Password flow.

Example:

    {
      _id: ObjectId,

      userId: ObjectId,

      tokenHash: "...",

      expiresAt: Date,

      usedAt: null,

      createdAt: Date
    }

Reset tokens are:

- high entropy
- single-use
- short-lived
- hashed before storage

## 10.1 Password Reset Indexes

    UNIQUE:
    tokenHash

    INDEX:
    userId

    TTL:
    expiresAt

A token with `usedAt != null` cannot be used again.

# 11. `weddings`

The Wedding document represents the tenant itself.

Example:

    {
      _id: ObjectId,

      slug: "deepesh-and-priya-14022027",

      status: "ACTIVE",

      couple: {
        bride: {
          name: {
            en: "Priya Sharma",
            mr: "प्रिया शर्मा"
          }
        },

        groom: {
          name: {
            en: "Deepesh Patil",
            mr: "दीपेश पाटील"
          }
        }
      },

      title: {
        en: "Deepesh & Priya",
        mr: "दीपेश आणि प्रिया"
      },

      description: {
        en: "...",
        mr: "..."
      },

      mainWeddingDate: Date,

      timezone: "Asia/Kolkata",

      primaryVenue: {
        city: {
          en: "Pune, Maharashtra",
          mr: "पुणे, महाराष्ट्र"
        },

        name: {
          en: "Shree Mangal Karyalay",
          mr: "श्री मंगल कार्यालय"
        },

        address: {
          en: "...",
          mr: "..."
        },

        mapUrl: "..."
      },

      website: {
        themeId: "THEME_01",

        defaultLocale: "en",

        supportedLocales: ["en", "mr"],

        livestream: {
          enabled: true,
          youtubeUrl: "..."
        }
      },

      mediaAccessKey: "...",

      counters: {
        eventCount: 5
      },

      createdByUserId: ObjectId,

      createdAt: Date,
      updatedAt: Date
    }

`primaryVenue.city.en` is captured during initial wedding onboarding.
`primaryVenue.city.mr`, venue name, full address, and map URL may be added
later through wedding settings. This keeps first-time setup short without
placing location data in an unrelated root-level field.

# 12. Wedding Slug

A wedding receives a human-readable URL slug generated from the couple
names and main wedding date.

Recommended format:

    <couple-names>-<DDMMYYYY>

Example:

    deepesh-and-priya-14022027

Conceptually:

    Deepesh & Priya
    14 February 2027
            ↓
    deepesh-and-priya-14022027

The slug is intended only to make the wedding URL readable and
meaningful.

Example:

    /w/deepesh-and-priya-14022027

The slug does **not grant access** and is not the authoritative tenant
identifier.

The entire guest wedding website already requires personalized
invitation access. The authenticated guest context resolves the correct
`weddingId` before wedding data is loaded.

Conceptually:

    Personalized Invitation
            ↓
    Guest Access Context
            ↓
    weddingId
            ↓
    Wedding Website

Therefore the application must never authorize or resolve private
wedding data solely by slug.

Avoid:

    slug
      ↓
    Find wedding
      ↓
    Authorize access

Instead:

    Guest invitation/session
            ↓
    weddingId
            ↓
    Load wedding
            ↓
    Use slug as readable route label

## 12.1 Duplicate Slugs Are Acceptable

It is possible for two weddings to have:

- the same bride/groom names
- the same wedding date

For example:

    Wedding A
    Deepesh & Priya
    14 February 2027

    Wedding B
    Deepesh & Priya
    14 February 2027

Both may therefore produce:

    deepesh-and-priya-14022027

This is acceptable in the V1 design because the slug does not
independently determine the tenant. The personalized guest
invitation/session already identifies the authoritative `weddingId`.

The route therefore operates conceptually as:

    Guest Session
         ↓
    weddingId
         ↓
    Load Wedding
         ↓
    Validate/display readable slug

rather than:

    Slug
      ↓
    Find one globally unique wedding

This keeps the URL simple without adding a random identifier solely for
uniqueness.

## 12.2 Slug Generation

Slug generation should:

1.  Take the English couple display names.
2.  Normalize them for URLs.
3.  Remove unsupported characters.
4.  Convert spaces to hyphens.
5.  Append the main wedding date in `DDMMYYYY` format.
6.  Convert the final value to lowercase.

Example:

    Deepesh & Priya
    14 February 2027

becomes:

    deepesh-and-priya-14022027

The date portion improves readability and practical differentiation. It
is not a security control.

## 12.3 Slug Stability

Once created, the slug should remain stable by default.

If the organizer later corrects:

- bride name
- groom name
- wedding date

Vivaahly should **not automatically regenerate the existing slug**,
because invitation URLs may already have been shared.

The displayed wedding information may change while the existing URL
remains valid.

Manual slug changes and redirect handling may be considered in a future
version.

# 13. Media Access Key

Each wedding contains one high-entropy random media access key.

Example conceptually:

    8sAqHc7K.......

This powers:

    /media/<media-access-key>

and the venue QR.

Possession of this key intentionally provides access to the Wedding
Media Hub.

Because Vivaahly must repeatedly reproduce the QR/media link in V1, this
key is persisted.

It must:

- be cryptographically random
- never be sequential
- never be logged
- never appear in ordinary organizer list queries
- never be exposed through unrelated APIs

This is an accepted V1 capability-link trade-off.

# 14. Wedding Indexes

    INDEX:
    slug

    UNIQUE:
    mediaAccessKey

    INDEX:
    status

`slug` is intentionally **not globally unique**.

Wedding authorization and tenant resolution never depend on slug
uniqueness.

# 15. `weddingMembers`

Represents an organizer's membership in a wedding.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,
      userId: ObjectId,

      role: "ADMIN",

      status: "ACTIVE",

      joinedAt: Date,

      removedAt: null,

      createdAt: Date,
      updatedAt: Date
    }

Supported roles:

    ADMIN
    MANAGER

Supported statuses:

    ACTIVE
    REMOVED

# 16. Why Membership Is Separate from User

We intentionally avoid:

    user.weddingId
    user.role

because these are wedding-specific properties.

Instead:

    User
      ↓
    WeddingMembership
      ↓
    Wedding

This creates a clean path toward future multi-wedding support.

# 17. Wedding Member Indexes

    UNIQUE:
    (weddingId, userId)

    INDEX:
    (weddingId, status)

    INDEX:
    (weddingId, role, status)

For V1, only one active wedding membership is allowed per user.

This can additionally be protected with a partial unique constraint
conceptually equivalent to:

    UNIQUE userId
    WHERE status = ACTIVE

If multi-wedding accounts are introduced later, that restriction can be
removed without restructuring documents.

# 18. Final Admin Rule

A wedding must always contain at least one active Admin.

Therefore this operation:

    Remove Admin

must check whether another active Admin remains.

If not:

    REJECT

Admin removal/demotion should be performed transactionally because the
invariant involves multiple membership documents.

# 19. `organizerInvitations`

Used when an Admin invites another Admin or Manager.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      email: "rahul@example.com",
      emailNormalized: "rahul@example.com",

      role: "MANAGER",

      tokenHash: "...",

      status: "PENDING",

      invitedByMembershipId: ObjectId,

      expiresAt: Date,

      acceptedAt: null,

      createdAt: Date,
      updatedAt: Date
    }

Statuses:

    PENDING
    ACCEPTED
    REVOKED
    EXPIRED

Organizer invite tokens should be stored hashed.

Resending an organizer invitation may rotate the invitation token.

# 20. Organizer Invitation Indexes

    UNIQUE:
    tokenHash

    INDEX:
    (weddingId, emailNormalized, status)

    TTL:
    expiresAt while invitation is pending

If accepted invitation history needs to remain available, `expiresAt`
can be unset after acceptance so TTL cleanup does not remove the
accepted record.

# 21. `events`

Represents wedding ceremonies.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      title: {
        en: "Sangeet",
        mr: "संगीत"
      },

      description: {
        en: "...",
        mr: "..."
      },

      startAt: Date,
      endAt: Date,

      venue: {
        name: {
          en: "...",
          mr: "..."
        },

        address: {
          en: "...",
          mr: "..."
        },

        mapUrl: "..."
      },

      dressCode: {
        en: "...",
        mr: "..."
      },

      privateNotes: "...",

      imageObjectKey: "...",

      sortOrder: 3,

      status: "ACTIVE",

      deletedAt: null,

      createdByMembershipId: ObjectId,

      createdAt: Date,
      updatedAt: Date
    }

# 22. Maximum 10 Events

The V1 product rule is:

    Maximum 10 events per wedding

The Wedding document maintains:

    counters.eventCount

Event creation should protect the limit atomically.

Conceptual transaction:

    1. Check wedding.eventCount < 10
    2. Increment eventCount
    3. Insert event
    4. Commit

This prevents two organizers creating event \#10 and \#11
simultaneously.

# 23. Event Indexes

    INDEX:
    (weddingId, status, startAt)

    INDEX:
    (weddingId, sortOrder)

All organizer event queries begin with `weddingId`.

# 24. Event Deletion

Events should not be physically deleted immediately once other records
reference them.

Instead:

    status = DELETED
    deletedAt = timestamp

Historical references from:

- expenses
- tasks
- vendors
- old RSVP information

remain intact.

Guests no longer receive deleted events.

# 25. `guests`

Represents an invited individual or family.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      guestType: "FAMILY",

      displayName: {
        en: "Sharma Family",
        mr: "शर्मा परिवार"
      },

      primaryContact: {
        name: {
          en: "Rajesh Sharma",
          mr: "राजेश शर्मा"
        },

        email: "rajesh@example.com",
        emailNormalized: "rajesh@example.com",

        phone: "+919876543210"
      },

      tags: [
        "GROOM_SIDE",
        "RELATIVES"
      ],

      organizerNotes: "...",

      status: "ACTIVE",

      deletedAt: null,

      createdByMembershipId: ObjectId,

      createdAt: Date,
      updatedAt: Date
    }

Supported guest types:

    INDIVIDUAL
    FAMILY

# 26. Guest Tags

Tags remain embedded because they are small, bounded attributes of a
guest.

Example:

    tags: [
      "BRIDE_SIDE",
      "OFFICE",
      "VIP"
    ]

A separate tags collection is unnecessary in V1.

# 27. Guest Email and Phone

Guest phone numbers are stored for information only.

Phone numbers are not used for:

- authentication
- WhatsApp
- SMS
- OTP

Guest emails are required when the invitation is being sent by email.

Guest email is **not globally unique**.

The same email address may theoretically be associated with multiple
records, so no unique constraint should be placed on guest email.

# 28. Guest Indexes

Recommended:

    INDEX:
    (weddingId, status)

    INDEX:
    (weddingId, primaryContact.emailNormalized)

    INDEX:
    (weddingId, tags)

    INDEX:
    (weddingId, displayName.en)

A normalized searchable name may also be maintained if prefix searching
is needed.

Atlas Search is not required for V1.

# 29. `guestInvitations`

Each Guest/Family receives one personalized wedding invitation.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,
      guestId: ObjectId,

      accessKey: "...",

      status: "ACTIVE",

      lastSentAt: Date,

      revokedAt: null,

      createdAt: Date,
      updatedAt: Date
    }

The access key powers:

    /invite/<access-key>

# 30. Guest Invitation Access Key

The invitation access key must be:

- random
- high entropy
- unguessable
- non-sequential
- unique

Because invitation emails and RSVP reminders must be able to reproduce
the guest's invitation URL, the V1 model persists the access key.

This key must be excluded from:

- normal guest-list responses
- logs
- analytics payloads
- activity logs
- error messages

An invitation can be revoked through:

    status = REVOKED

without deleting its historical data.

# 31. Guest Invitation Indexes

    UNIQUE:
    accessKey

    UNIQUE:
    (weddingId, guestId)

    INDEX:
    (weddingId, status)

# 32. Event Invitation + RSVP Modeling

This is one of the most important database decisions.

Vivaahly should **not** store:

    guest.invitedEvents[]

and then maintain an unrelated RSVP collection.

Instead, the relationship itself becomes a document:

    Guest
       │
       │ invited to
       ▼
    Event

represented by:

    guestEventInvitations

That document contains both:

1.  event access
2.  event RSVP state

# 33. `guestEventInvitations`

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      guestId: ObjectId,
      guestInvitationId: ObjectId,
      eventId: ObjectId,

      invitationStatus: "ACTIVE",

      rsvpStatus: "ATTENDING",

      attendeeCount: 5,

      respondedAt: Date,

      removedAt: null,

      createdAt: Date,
      updatedAt: Date
    }

Invitation statuses:

    ACTIVE
    REMOVED

RSVP statuses:

    AWAITING_RESPONSE
    ATTENDING
    NOT_ATTENDING

# 34. Why RSVP Lives Here

This directly models:

> Sharma Family is invited to the Sangeet and 5 people are attending.

Instead of separating:

    Guest
    Invitation
    Invited-event array
    RSVP

into redundant states.

Benefits:

- event guest lists are straightforward
- RSVP updates are atomic
- event attendance summaries are straightforward
- guest-specific schedule queries are straightforward
- removing an event from a guest does not destroy RSVP history
- duplicate RSVPs are prevented structurally

# 35. RSVP Rules

For:

    AWAITING_RESPONSE

use:

    attendeeCount = null

For:

    NOT_ATTENDING

use:

    attendeeCount = 0

For:

    ATTENDING

an Individual Guest should normally have:

    attendeeCount = 1

A Family Guest may supply:

    attendeeCount >= 1

Vivaahly does not impose a culturally restrictive invitation limit.

Technical validation can still reject absurd or malicious values.

# 36. Guest Event Invitation Indexes

Critical unique index:

    UNIQUE:
    (weddingId, guestId, eventId)

Additional indexes:

    INDEX:
    (weddingId, eventId, invitationStatus)

    INDEX:
    (weddingId, eventId, rsvpStatus)

    INDEX:
    (weddingId, guestId, invitationStatus)

    INDEX:
    guestInvitationId

This guarantees that one guest cannot accidentally have two independent
RSVP records for the same event.

# 37. Removing a Guest from an Event

Suppose Sharma Family originally had:

    Sangeet → ATTENDING → 5

and an organizer removes Sangeet from their invitation.

Do not delete the relationship.

Use:

    invitationStatus = REMOVED
    removedAt = Date

The guest can no longer see or modify the event.

The old RSVP state remains available historically.

# 38. Re-Adding an Event

If an event is later re-added to the same guest:

    invitationStatus = ACTIVE

Recommended V1 behavior:

    rsvpStatus = AWAITING_RESPONSE
    attendeeCount = null
    respondedAt = null

The guest should consciously respond again rather than silently reusing
an old RSVP.

# 39. `tasks`

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      title: "Confirm Sangeet Decoration",

      description: "...",

      eventId: ObjectId | null,

      assigneeMembershipId: ObjectId,

      status: "IN_PROGRESS",

      dueAt: Date,

      completedAt: null,

      createdByMembershipId: ObjectId,

      deletedAt: null,

      createdAt: Date,
      updatedAt: Date
    }

Task statuses:

    NOT_STARTED
    IN_PROGRESS
    COMPLETED

# 40. Task Indexes

    INDEX:
    (weddingId, status)

    INDEX:
    (weddingId, assigneeMembershipId, status)

    INDEX:
    (weddingId, dueAt)

    INDEX:
    (weddingId, eventId)

These support:

- My Tasks
- Upcoming Tasks
- Overdue Tasks
- Event-specific Tasks
- Calendar

# 41. Removed Task Assignee

If an organizer is removed from the wedding, their historical membership
record remains.

Tasks still reference:

    assigneeMembershipId

Therefore:

> Assigned to Rahul Sharma

can still be displayed historically even after Rahul no longer has
application access.

The task may later be reassigned.

# 42. `taskComments`

Comments are stored separately instead of embedding an indefinitely
growing comments array inside the task.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,
      taskId: ObjectId,

      authorMembershipId: ObjectId,

      body: "Decorator shared the final design.",

      createdAt: Date,
      updatedAt: Date
    }

Index:

    (taskId, createdAt)

and preferably:

    (weddingId, taskId, createdAt)

# 43. Why Comments Are Referenced

Comments can grow over time.

Embedding them would make the Task document continuously larger and
create unnecessary write contention.

The Task document should remain small.

# 44. `vendors`

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      name: "ABC Decorators",

      vendorType: "DECORATOR",

      contactPerson: "Amit",

      phone: "...",
      email: "...",

      eventIds: [
        ObjectId,
        ObjectId
      ],

      notes: "...",

      status: "ACTIVE",

      deletedAt: null,

      createdByMembershipId: ObjectId,

      createdAt: Date,
      updatedAt: Date
    }

Possible vendor types:

    PHOTOGRAPHER
    CATERER
    DECORATOR
    DJ
    MAKEUP_ARTIST
    MEHENDI_ARTIST
    FLORIST
    VENUE
    PANDIT
    ENTERTAINMENT
    OTHER

# 45. Why `eventIds` Can Be Embedded in Vendor

A wedding contains a maximum of 10 events.

Therefore:

    eventIds: []

is naturally bounded.

A separate vendor-event junction collection is unnecessary for V1.

# 46. Vendor Indexes

    INDEX:
    (weddingId, status)

    INDEX:
    (weddingId, vendorType)

    INDEX:
    (weddingId, eventIds)

# 47. Vendor Deletion

Vendor records referenced by historical expenses should not be
physically removed.

Use soft deletion:

    status = REMOVED
    deletedAt = Date

Expenses retain their `vendorId`.

# 48. `expenses`

Money must **not** be stored using floating-point values.

Instead use integer minor units.

For INR:

    ₹30,000.00

becomes:

    amountMinor: 3000000
    currency: "INR"

This prevents floating-point rounding errors.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      title: "Stage Decoration",

      amountMinor: 3000000,
      currency: "INR",

      category: "DECORATION",

      eventId: ObjectId | null,
      vendorId: ObjectId | null,

      paymentStatus: "PAID",

      paidByMembershipId: ObjectId,

      expenseDate: Date,

      notes: "...",

      recordedByMembershipId: ObjectId,

      recordStatus: "ACTIVE",

      voidedAt: null,

      createdAt: Date,
      updatedAt: Date
    }

# 49. Expense Status

Payment status:

    PAID
    UNPAID

Separate record state:

    ACTIVE
    VOIDED

This is important.

An incorrect financial record should preferably be:

    VOIDED

rather than silently deleted.

# 50. Expense Paid-By Rule

If:

    paymentStatus = PAID

then:

    paidByMembershipId

should be present.

If:

    paymentStatus = UNPAID

`paidByMembershipId` should normally be null.

This allows future reimbursement functionality without building
reimbursement calculations in V1.

# 51. Expense Indexes

    INDEX:
    (weddingId, paymentStatus)

    INDEX:
    (weddingId, eventId)

    INDEX:
    (weddingId, vendorId)

    INDEX:
    (weddingId, paidByMembershipId)

    INDEX:
    (weddingId, expenseDate)

    INDEX:
    (weddingId, recordStatus, expenseDate)

# 52. Historical Expense Safety

If:

- an organizer leaves
- a vendor is removed
- an event is deleted

the Expense remains valid.

Therefore references should remain.

Example:

    Expense
    Paid by: Rahul
    Vendor: ABC Decorators
    Event: Sangeet

may still be displayed even when those related records are inactive.

# 53. Generic File Attachments

Vivaahly needs binary attachments for:

- Tasks
- Task comments
- Vendor documents
- Expense receipts

Instead of duplicating file metadata in every collection, use:

    attachments

Files themselves live in Cloudflare R2.

# 54. `attachments`

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      ownerType: "EXPENSE",
      ownerId: ObjectId,

      attachmentType: "RECEIPT",

      objectKey: "weddings/.../attachments/...",

      originalFileName: "receipt.pdf",

      mimeType: "application/pdf",

      sizeBytes: 483922,

      status: "READY",

      uploadedByMembershipId: ObjectId,

      createdAt: Date,
      updatedAt: Date
    }

Owner types:

    TASK
    TASK_COMMENT
    VENDOR
    EXPENSE

Attachment types might include:

    GENERAL
    RECEIPT
    QUOTATION
    CONTRACT
    REFERENCE

# 55. Attachment Indexes

    INDEX:
    (weddingId, ownerType, ownerId)

    INDEX:
    (weddingId, status)

# 56. Attachment Storage Keys

R2 paths should be wedding-scoped and opaque.

Example:

    weddings/
      <weddingId>/
        attachments/
          <generated-id>

Do not use:

    rahul-receipt-final-final-2.pdf

as the actual storage key.

The original filename exists only as metadata.

# 57. `mediaAlbums`

Represents a logical wedding gallery album.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      name: {
        en: "Sangeet",
        mr: "संगीत"
      },

      eventId: ObjectId | null,

      sortOrder: 2,

      createdByMembershipId: ObjectId | null,

      createdAt: Date,
      updatedAt: Date
    }

An album may optionally correspond to an event.

# 58. Media Album Indexes

    INDEX:
    (weddingId, sortOrder)

    INDEX:
    (weddingId, eventId)

# 59. `mediaItems`

MongoDB stores media metadata.

Cloudflare R2 stores actual media bytes.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      albumId: ObjectId | null,
      eventId: ObjectId | null,

      mediaType: "IMAGE",

      source: "GUEST",

      uploadedByMembershipId: null,

      objectKey: "weddings/.../media/...",

      originalFileName: "IMG_1024.jpg",

      mimeType: "image/jpeg",

      sizeBytes: 12849503,

      status: "READY",

      createdAt: Date,

      finalizedAt: Date,

      deletedAt: null
    }

Media types:

    IMAGE
    VIDEO

Sources:

    ORGANIZER
    GUEST

# 60. Organizer vs Guest Media

For organizer uploads:

    source: "ORGANIZER"
    uploadedByMembershipId: ObjectId

For anonymous QR uploads:

    source: "GUEST"
    uploadedByMembershipId: null

No guest identity needs to be collected for Media Hub uploads.

# 61. Media Upload States

Recommended states:

    PENDING_UPLOAD
    READY
    FAILED
    DELETION_PENDING
    DELETED

Flow:

    Create metadata
          ↓
    PENDING_UPLOAD
          ↓
    Presigned R2 upload
          ↓
    Finalize
          ↓
    READY

Only:

    READY

media appears in the gallery.

# 62. Incomplete Media Uploads

Case:

    Mongo metadata created
    R2 upload never occurs

Result:

    PENDING_UPLOAD

It remains invisible.

Case:

    R2 upload succeeds
    Finalize request fails

The R2 object may temporarily become orphaned.

V1 accepts this.

A maintenance process can later remove stale pending records/orphaned
objects.

# 63. Media Indexes

Core gallery index:

    (weddingId, status, createdAt DESC)

Additional:

    (weddingId, albumId, status, createdAt)

    (weddingId, eventId, status)

    (weddingId, mediaType, status)

These allow incremental/paginated gallery loading.

# 64. Media Storage Limits

Database metadata should record:

    sizeBytes

The upload service enforces:

    Images: maximum 20 MB

    Videos: maximum 100 MB

MongoDB never stores the binary media itself.

# 65. `emailCampaigns`

Bulk guest invitation/reminder sending requires persisted campaign
state.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      campaignType: "GUEST_INVITATION",

      status: "SENDING",

      totalRecipients: 347,

      createdByMembershipId: ObjectId,

      startedAt: Date,

      completedAt: null,

      createdAt: Date,
      updatedAt: Date
    }

Campaign types:

    GUEST_INVITATION
    RSVP_REMINDER

Statuses:

    DRAFT
    SENDING
    PARTIAL
    COMPLETED
    FAILED

# 66. Why Recipients Are Separate

Do not store:

    campaign.recipients = [
       ...hundreds or thousands...
    ]

inside one document.

Recipients have their own state, retry information, provider IDs, and
errors.

Therefore use:

    emailCampaignRecipients

# 67. `emailCampaignRecipients`

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      campaignId: ObjectId,

      guestId: ObjectId,
      guestInvitationId: ObjectId,

      emailSnapshot: "rajesh@example.com",

      status: "SENT",

      attemptCount: 1,

      idempotencyKey: "...",

      providerMessageId: "...",

      lastErrorCode: null,
      lastErrorMessage: null,

      lastAttemptAt: Date,

      sentAt: Date,

      createdAt: Date,
      updatedAt: Date
    }

Recipient statuses:

    PENDING
    SENT
    FAILED

# 68. Why Email Uses a Snapshot

Suppose:

1.  Invitation is sent to `old@example.com`.
2.  Organizer later changes the guest email to `new@example.com`.

The historical email campaign should still say:

> This specific message was sent to `old@example.com`.

Therefore:

    emailSnapshot

is intentionally copied into the campaign-recipient document.

This is appropriate denormalization.

# 69. Email Recipient Indexes

    UNIQUE:
    (campaignId, guestId)

    INDEX:
    (campaignId, status)

    INDEX:
    (weddingId, guestInvitationId)

    INDEX:
    (weddingId, status)

# 70. Campaign Progress

Campaign progress can be derived using recipient state.

Example:

    347 recipients

    218 SENT
    119 PENDING
    10 FAILED

V1 does not require complex distributed counters.

`totalRecipients` may remain cached on the campaign because it never
changes after campaign creation.

Sent/failed/pending counts can be queried from recipient documents.

# 71. Resend Retry Safety

Each email recipient/batch should have stable idempotency information.

If:

    Send clicked twice

or:

    network times out after Resend accepted request

Vivaahly must be able to safely determine/retry the intended recipients
rather than creating duplicate sends.

# 72. `activityLogs` — Optional V1

The PRD marks Recent Activity as useful but lower priority.

If implemented, use an append-only collection.

Example:

    {
      _id: ObjectId,

      weddingId: ObjectId,

      actorType: "ORGANIZER",

      actorMembershipId: ObjectId,

      action: "TASK_COMPLETED",

      entityType: "TASK",
      entityId: ObjectId,

      metadata: {
        title: "Confirm DJ"
      },

      createdAt: Date
    }

Possible actors:

    ORGANIZER
    GUEST
    SYSTEM

# 73. Activity Log Safety

Never put these inside activity metadata:

- passwords
- session tokens
- reset tokens
- invitation access keys
- media access key
- sensitive provider secrets

The activity system is not an audit dump of complete requests.

# 74. Activity Log Index

    (weddingId, createdAt DESC)

This directly supports the Recent Activity dashboard widget.

# 75. Embed vs Reference Decisions

The following data should be **embedded**:

| Data                    | Reason                               |
|-------------------------|--------------------------------------|
| Wedding localized names | Small and always loaded with wedding |
| Venue                   | Small value object                   |
| Guest primary contact   | Belongs exclusively to guest         |
| Guest tags              | Small bounded array                  |
| Vendor `eventIds`       | Max 10 events                        |
| Website settings        | One-to-one with wedding              |
| Couple names            | One-to-one with wedding              |

The following should be **referenced**:

| Data             | Reason                           |
|------------------|----------------------------------|
| Wedding members  | Independent lifecycle            |
| Events           | Frequently queried independently |
| Guests           | Potentially large collection     |
| Guest-event RSVP | Many-to-many relationship        |
| Task comments    | Potentially unbounded            |
| Expenses         | Independent filtering/reporting  |
| Media            | Potentially thousands of items   |
| Email recipients | Per-recipient state              |
| Attachments      | Shared file pattern              |

# 76. Avoid Unbounded Arrays

MongoDB documents have a finite document-size limit and large arrays
create update/contention problems.

Therefore avoid structures such as:

    wedding: {
      guests: [ thousands... ],
      media: [ thousands... ],
      tasks: [ thousands... ]
    }

Likewise avoid:

    task.comments = [ unlimited... ]

or:

    campaign.recipients = [ unlimited... ]

These belong in separate collections.

# 77. Core Database Access Patterns

The database model must optimize for real application queries rather
than theoretical normalization.

Important V1 access patterns include:

### Organizer Dashboard

Retrieve:

- upcoming events
- overdue tasks
- assigned tasks
- guest count
- RSVP totals
- paid/unpaid expense totals

### Guest Invitation

Resolve:

    accessKey
      ↓
    GuestInvitation
      ↓
    Guest
      ↓
    Active GuestEventInvitations
      ↓
    Events

### RSVP Update

Update exactly one:

    guest + event relationship

### Calendar

Query:

    events by startAt
    +
    tasks by dueAt

and merge them at application level.

### Expense Page

Filter by:

    event
    vendor
    paid by
    payment status
    date

### Media Gallery

Query:

    weddingId
    status = READY
    createdAt descending

using pagination.

# 78. Dashboard Counts

Do not blindly maintain counters such as:

    confirmedGuests += 5

because RSVP can be edited repeatedly.

Instead attendance totals should be derived from authoritative:

    guestEventInvitations

Example:

    Wedding Event: Sangeet

    SUM attendeeCount
    WHERE:
      eventId = Sangeet
      invitationStatus = ACTIVE
      rsvpStatus = ATTENDING

This makes duplicate submissions safe.

# 79. Search Strategy

V1 does not require Elasticsearch or Atlas Search.

Basic search/filtering can use:

- normalized guest names
- indexed email
- tags
- vendor type
- task status
- event references
- expense references

If sophisticated typo-tolerant or full-text searching becomes necessary
later, Atlas Search can be introduced without redesigning the domain
schema.

# 80. Normalization Fields

Fields used for equality/search should have normalized variants when
appropriate.

Example:

    Deepesh@Example.com

becomes:

    email: "Deepesh@Example.com"
    emailNormalized: "deepesh@example.com"

The original value may be retained for display while normalized values
are used for lookup and uniqueness.

# 81. Money Representation

Never store:

    amount: 30000.10

as a floating-point monetary value.

Use:

    amountMinor: 3000010
    currency: "INR"

The application converts minor units to:

    ₹30,000.10

for display.

# 82. Date and Time Representation

Store canonical timestamps in UTC.

Example:

    startAt: ISODate(...)
    endAt: ISODate(...)

Wedding stores:

    timezone: "Asia/Kolkata"

The guest interface formats values using:

- wedding timezone
- selected language

Do not store dates as formatted strings such as:

    "15 November 2026, 7 PM"

# 83. Referential Integrity in MongoDB

MongoDB does not automatically enforce foreign-key relationships the way
a relational database does.

Therefore the domain/service layer is responsible for rules such as:

    Task.eventId belongs to same wedding
    Expense.vendorId belongs to same wedding
    Expense.paidByMembershipId belongs to same wedding
    GuestEventInvitation.eventId belongs to same wedding
    Media.albumId belongs to same wedding

Cross-wedding references must always be rejected.

# 84. Tenant Validation Rule

Every referenced entity must belong to the same wedding.

Example:

    Wedding A Expense
            ↓
    Vendor ID from Wedding B

must be rejected even if the Vendor ObjectId is valid.

The query should be:

    vendor._id = vendorId
    AND
    vendor.weddingId = authenticatedWeddingId

# 85. MongoDB Transactions

Vivaahly should not wrap ordinary CRUD operations inside transactions
unnecessarily.

Most operations involve one document and are naturally atomic.

Transactions should be reserved for important multi-document invariants.

Recommended transaction cases:

### Wedding creation

    Create Wedding
    +
    Create initial ADMIN membership

### Accept organizer invitation

    Validate invitation
    +
    Ensure user has no active wedding
    +
    Create membership
    +
    Mark invitation accepted

### Remove/Demote Admin

    Verify another Admin remains
    +
    Update membership

### Create event

    Check/increment event counter
    +
    Insert event

### Remove guest

Where necessary:

    Mark guest removed
    +
    Revoke personalized invitation
    +
    Deactivate event invitations

# 86. Operations That Do Not Need Transactions

Examples:

- RSVP update
- Task creation
- Task status update
- Comment creation
- Expense creation
- Vendor update
- Media finalization
- Guest detail update

These can normally be performed using single-document atomic writes.

# 87. RSVP Concurrency

Two devices might update the same RSVP.

Example:

    Mr. Sharma → 5 attending
    Mrs. Sharma → 4 attending

at nearly the same time.

V1 follows:

> Last successful write wins.

Because the RSVP exists as one document, updates remain atomic.

No duplicate attendance record is created.

# 88. Event Concurrency

Two organizers may edit an event simultaneously.

V1 may use:

> Last write wins.

No collaborative locking is required.

If stronger conflict detection is later needed, document versioning can
be added.

# 89. Soft Delete Strategy

Soft deletion is preferred where history matters.

Entities typically soft deleted:

- events
- guests
- vendors
- tasks

Financial records are voided instead of deleted.

Memberships are marked removed.

Guest invitations are revoked.

Media uses explicit deletion states because external R2 deletion is also
required.

# 90. Hard Delete Candidates

Temporary/security data may be physically deleted:

- expired sessions
- expired password reset tokens
- expired pending organizer invitations
- stale upload metadata after maintenance

These do not represent important wedding history.

# 91. Guest Removal

When a guest is removed:

    Guest.status → REMOVED

    GuestInvitation.status → REVOKED

    GuestEventInvitations.invitationStatus → REMOVED

Do not immediately destroy RSVP history.

The personalized invitation link must stop working.

# 92. Organizer Removal

When a Manager/Admin is removed:

    WeddingMember.status → REMOVED

Their user account can remain.

Historical references continue working:

    Task created by Rahul
    Expense paid by Rahul
    Comment written by Rahul

Their existing organizer session must no longer authorize wedding
operations.

# 93. Media Deletion

Media deletion crosses MongoDB and R2, so it cannot be perfectly
transactional.

Recommended flow:

    READY
      ↓
    DELETION_PENDING
      ↓
    Delete R2 object
      ↓
    DELETED

If R2 deletion fails:

    DELETION_PENDING

can be retried.

The item is already hidden from the gallery.

# 94. Security-Sensitive Data

The following values must not appear in normal logs:

    passwordHash
    session raw token
    password reset token
    organizer invitation raw token
    guest invitation accessKey
    media access key
    R2 credentials
    Resend API key

Session/reset/organizer-invite tokens are hashed where possible.

Guest/media access links are V1 capability links and must receive
restrictive repository projections and logging treatment.

# 95. PII

Vivaahly stores limited personally identifiable information:

Organizer:

- name
- email

Guest:

- name
- email
- phone

These values should not be copied unnecessarily into unrelated
collections.

Exceptions such as:

    emailCampaignRecipients.emailSnapshot

exist only when historical accuracy requires a snapshot.

# 96. MongoDB Indexing Principle

Most tenant-owned indexes should begin with:

    weddingId

Example:

    (weddingId, status)

rather than:

    (status)

This improves both tenant isolation patterns and query efficiency.

# 97. Avoid Over-Indexing

Every MongoDB index increases:

- storage
- write overhead
- maintenance cost

Only indexes corresponding to actual application query patterns should
be created.

V1 should start with the indexes specified in this document and add new
ones only after query behavior demonstrates a need.

# 98. Pagination

Potentially large collections must use pagination/incremental loading.

These include:

- guests
- media
- tasks
- expenses
- activity logs
- email recipient states

Media should preferably use cursor-based pagination:

    createdAt + _id

rather than loading the entire gallery.

# 99. Collection Growth Expectations

Relative V1 collection sizes are expected approximately as follows:

    Wedding                Very small
    Members                Very small
    Events                  <= 10
    Vendors                 Small
    Tasks                   Small/Medium
    Expenses                Small/Medium
    Guests                  Medium/Large
    GuestEventInvitations   Medium/Large
    MediaItems              Potentially very large
    EmailRecipients         Medium/Large
    Sessions                Small/Medium

The design intentionally separates potentially large collections from
the Wedding document.

# 100. Main Uniqueness Constraints

Critical uniqueness rules:

    users.emailNormalized

    sessions.tokenHash

    passwordResetTokens.tokenHash

    weddings.mediaAccessKey

    (weddingMembers.weddingId, weddingMembers.userId)

    guestInvitations.accessKey

    (guestInvitations.weddingId, guestInvitations.guestId)

    (
      guestEventInvitations.weddingId,
      guestEventInvitations.guestId,
      guestEventInvitations.eventId
    )

    (emailCampaignRecipients.campaignId, emailCampaignRecipients.guestId)

`weddings.slug` is deliberately excluded from the uniqueness
constraints.

The wedding tenant is identified internally by:

    weddingId

and guest-facing authorization derives that `weddingId` from the
personalized invitation/session.

# 101. Important Database Invariants

The service/database layer must protect these invariants:

1.  Every tenant-owned record has a valid `weddingId`.
2.  Cross-wedding references are never allowed.
3.  Every wedding has at least one active Admin.
4.  One user has at most one active wedding membership in V1.
5.  A wedding has at most 10 active events.
6.  Wedding slugs are human-readable routing labels and are not used as
    tenant authorization identifiers.
7.  One guest has one personalized invitation.
8.  One guest has at most one guest-event invitation per event.
9.  RSVP can exist only for an invited guest/event relationship.
10. Deleted/removed events cannot be newly RSVP'd to.
11. Paid expenses identify who paid them.
12. Historical financial attribution survives organizer/vendor/event
    removal.
13. Only READY media appears in the gallery.
14. Email retries do not create duplicate logical recipient records.
15. Guest invitation access never exposes events that are not actively
    assigned to the guest.

# 102. Important Edge Cases

## Same Names and Same Wedding Date

Two weddings may have exactly the same couple names and wedding date.

Example:

    Wedding A
    Deepesh & Priya
    14 February 2027

    Wedding B
    Deepesh & Priya
    14 February 2027

Both may therefore have:

    deepesh-and-priya-14022027

This does not create an authorization or tenant-isolation problem.

The personalized guest invitation/session establishes the authoritative
`weddingId`.

Therefore:

    Invitation A
        ↓
    Wedding A ID
        ↓
    /w/deepesh-and-priya-14022027

and:

    Invitation B
        ↓
    Wedding B ID
        ↓
    /w/deepesh-and-priya-14022027

can coexist safely within the invitation-scoped guest experience.

The slug alone must never be used to determine which wedding's private
information should be returned.

## Duplicate RSVP submission

Unique guest/event relationship prevents duplicates.

Update current state rather than creating another RSVP.

## Event deleted after RSVP

Event becomes soft-deleted.

Guest-event invitation becomes inaccessible.

Historical RSVP may remain.

## Guest removed

Invitation becomes revoked.

Guest-event access becomes removed.

Historical RSVP remains.

## Guest invitation forwarded

Accepted V1 behavior.

The forwarded user receives the same guest/family context.

## Two organizers create the tenth event simultaneously

Event-count transaction prevents creation of an eleventh event.

## Manager removed while logged in

Session still identifies user, but active wedding membership lookup
fails.

Organizer access is denied.

## Last Admin attempts to leave

Database/domain transaction rejects the operation.

## Vendor deleted after expense

Vendor is soft-deleted.

Expense retains vendor reference.

## Organizer removed after paying expense

Membership remains historically.

Expense continues to show that organizer as payer.

## Media upload never finishes

Media remains `PENDING_UPLOAD` and invisible.

## Media R2 upload finishes but finalize fails

Media does not appear until finalization succeeds.

Stale object cleanup can occur later.

## Same filename uploaded 100 times

Generated object keys prevent collision.

## Marathi translation missing

Localized data falls back to English.

## Campaign interrupted halfway

Recipient documents preserve:

    SENT
    FAILED
    PENDING

The next attempt processes only unfinished recipients.

# 103. Suggested R2 Namespace

Although R2 is not MongoDB, database metadata depends on a predictable
storage structure.

Recommended:

    weddings/
      <weddingId>/

        media/
          <generatedObjectId>

        attachments/
          <generatedObjectId>

        event-images/
          <generatedObjectId>

MongoDB stores only the corresponding:

    objectKey

# 104. Database Ownership vs R2 Ownership

MongoDB owns:

- entity identity
- media metadata
- file metadata
- permissions/access relationship
- upload state
- gallery membership
- uploader information

R2 owns:

- photo bytes
- video bytes
- attachment bytes

MongoDB remains the source of truth for whether an object is logically
usable.

# 105. Schema Validation

Vivaahly uses Zod at the application boundary.

The same major invariants should also influence database validation
where practical.

However, business logic such as:

    Maximum 10 events
    Last Admin cannot be removed
    Vendor must belong to same wedding

cannot be solved purely through MongoDB field schema validation.

Those rules belong in domain services and transactions.

# 106. ODM / Database Library

This Database Design intentionally does not require either:

    Mongoose

or:

    MongoDB Native Driver

The logical schema works with either approach.

The implementation decision can be made during project scaffolding.

Regardless of library choice:

- domain services own business logic
- Zod owns external validation
- repositories own MongoDB persistence operations

# 107. Collection Naming

Recommended collection names:

    users
    sessions
    passwordResetTokens
    organizerInvitations
    weddings
    weddingMembers
    events
    guests
    guestInvitations
    guestEventInvitations
    tasks
    taskComments
    vendors
    expenses
    attachments
    mediaAlbums
    mediaItems
    emailCampaigns
    emailCampaignRecipients
    activityLogs

Application fields use `camelCase`.

# 108. Database Design Summary

The primary domain structure is:

    User
     ↓
    WeddingMember
     ↓
    Wedding
     ├── Event
     │    └── GuestEventInvitation ← Guest
     │
     ├── Guest
     │    └── GuestInvitation
     │
     ├── Task
     │    └── TaskComment
     │
     ├── Vendor
     │
     ├── Expense
     │
     ├── Attachment
     │
     ├── MediaAlbum
     │    └── MediaItem
     │
     └── EmailCampaign
          └── EmailCampaignRecipient

The most important design choices are:

### 1. Wedding is the tenant.

All wedding-owned data carries `weddingId`.

### 2. Users and wedding memberships are separate.

This preserves future multi-wedding flexibility.

### 3. Wedding slugs are readable routing labels, not tenant identifiers.

V1 uses couple names plus the main wedding date, for example
`deepesh-and-priya-14022027`. The personalized invitation/session
resolves the authoritative `weddingId`, so slug uniqueness is not relied
upon for access control.

### 4. Event invitation and RSVP are modeled together.

`guestEventInvitations` becomes the authoritative guest/event attendance
state.

### 5. Large or growing collections are referenced.

Guests, media, email recipients, comments, tasks, and expenses never
become giant arrays inside Wedding.

### 6. Historical references survive deletion.

Wedding history should not become inaccurate because an organizer,
event, vendor, or guest later becomes inactive.

### 7. MongoDB stores metadata; R2 stores files.

Media bytes and attachments never live in MongoDB.

### 8. Financial values use integer minor units.

No floating-point monetary storage.

### 9. English/Marathi authored values use reusable localized objects.

The schema is ready for more languages later.

### 10. Security tokens have dedicated lifecycle rules.

Authentication tokens are hashed; guest/media capability links are
tightly controlled and never treated as ordinary public fields.

### 11. Transactions are targeted.

Use them only where multiple documents jointly enforce an important
invariant.

# 109. Database Phase Completion

With this design finalized, Vivaahly now has:

    PRD
      ✓

    System Design / High-Level Architecture
      ✓

    Database Design
      ✓

The logical next design phase is:

> **API Design**

The API phase should map the domain model defined here into explicit
application operations, authorization requirements, Zod request schemas,
endpoints/server actions, response structures, pagination conventions,
and error contracts.

Database Design v1.0 should be treated as the persistence baseline for
that phase.
