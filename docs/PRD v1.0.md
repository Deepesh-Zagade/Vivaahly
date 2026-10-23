# Vivaahly

## Product Requirements Document — MVP v1.0

**Product:** Vivaahly\
**Product Type:** Wedding planning and management web application\
**Primary Market:** Indian families organizing weddings themselves\
**Document Language:** English\
**Status:** MVP PRD\
**Version:** 1.0

---

# 1. Product Overview

Vivaahly is a collaborative wedding management web application designed specifically for Indian families.

Indian weddings frequently involve multiple ceremonies, large guest lists, several family members coordinating simultaneously, vendors, expenses, invitations, RSVP tracking, tasks, photos, videos, and constant communication.

Today, much of this coordination happens across disconnected tools such as:

- WhatsApp groups
- Excel sheets
- Notes
- Phone calls
- Email
- Photo-sharing groups
- Verbal communication between family members

This fragmentation creates confusion around responsibilities, guest attendance, event schedules, expenses, vendor coordination, and wedding information.

Vivaahly aims to become the central digital workspace for organizing an Indian wedding.

The product should allow close family members and friends to collaboratively manage the wedding while also providing invited guests with a simple digital experience for invitations, RSVP, schedules, wedding information, media, and livestream access.

---

# 2. Product Vision

> **One place to plan, manage, coordinate, and remember an Indian wedding.**

Vivaahly should act as the digital command center for a wedding.

Instead of families depending on multiple WhatsApp groups, spreadsheets, phone calls, and disconnected information, Vivaahly should provide one reliable source of truth.

The desired outcome is:

> Before Vivaahly, everyone was asking what was happening, who was responsible, who was invited, and what had already been paid. With Vivaahly, organizers know exactly what needs to happen and guests know exactly what they need to know.

---

# 3. Core Problem

Indian weddings create coordination problems because:

- Multiple people participate in organizing the wedding.
- Different guests are invited to different ceremonies.
- Wedding information changes frequently.
- Tasks are distributed between relatives and close friends.
- Expenses are paid by multiple organizers.
- Vendor information is scattered.
- Guest attendance is difficult to track.
- Photos and videos get distributed across multiple WhatsApp groups.
- Guests repeatedly ask for venue, timing, event, and livestream information.
- Responsibilities are often communicated verbally and forgotten.

Existing generic productivity tools do not provide a wedding-specific workflow.

Vivaahly should organize these workflows around the wedding itself.

---

# 4. Target User

The MVP is designed for:

**Indian families organizing a wedding without a professional wedding management platform.**

The primary users are:

- Bride
- Groom
- Parents
- Siblings
- Cousins
- Close relatives
- Close friends helping manage the wedding

Wedding planning agencies and professional wedding planners are explicitly outside the MVP scope.

---

# 5. Product Surfaces

Vivaahly will contain three primary user experiences.

## 5.1 Organizer Application

A private authenticated workspace used by Admins and Managers.

It handles:

- Wedding setup
- Events
- Guests
- Invitations
- RSVP
- Tasks
- Calendar
- Vendors
- Expenses
- Media
- Wedding website configuration
- Livestream configuration
- Organizer collaboration

---

## 5.2 Guest Wedding Experience

A guest-facing wedding website accessed primarily through personalized invitation links.

Guests do not need to create accounts.

It provides:

- Digital invitation
- Invited event information
- RSVP
- Wedding schedule
- Venue information
- Dress code where applicable
- Wedding website content
- Livestream access

The website must support:

- English
- Marathi

Guests should be able to switch between supported languages.

---

## 5.3 Wedding Media Hub

A separate lightweight guest media experience accessible through the wedding's shared media QR code or media link.

Anyone possessing the QR code or link may access the Media Hub.

No authentication is required.

Users can:

- View photos
- View videos
- Upload photos
- Upload videos
- Download individual media
- Select and download multiple media items
- Download available albums

The Media Hub is intentionally shareable between wedding attendees.

---

# 6. MVP Account Model

For MVP:

> One user account participates in one wedding.

A wedding may contain multiple organizer accounts.

A user will not manage multiple weddings in the MVP.

Multi-wedding support may be considered in later product versions.

---

# 7. User Roles

Vivaahly has three user roles.

---

## 7.1 Admin

Admins are the primary owners of the wedding workspace.

Typical Admin users include:

- Bride
- Groom
- Parent
- Sibling
- Trusted family member
- Very close friend

Admins have access to all organizer functionality.

Admins can:

- Configure the wedding
- Manage events
- Manage guests
- Manage invitations
- View and manage RSVP information
- Manage tasks
- Manage vendors
- Manage expenses
- View all financial information
- Manage media
- Configure the wedding website
- Configure livestream details
- Add organizers
- Add Managers
- Promote trusted members to Admin
- Remove Managers
- Manage organizer membership

Multiple Admins are allowed.

---

## 7.2 Manager

Managers are trusted family members or close friends helping coordinate the wedding.

Managers can:

- View the organizer dashboard
- Manage events
- Manage guests
- Manage invitations
- View RSVP information
- Manage tasks
- Manage vendors
- View and manage expenses
- Upload media
- Manage wedding-related operational information

For MVP, Managers should not have granular permissions.

Managers receive broad organizer access because they are expected to be highly trusted participants.

Admin remains responsible for managing organizer membership.

---

## 7.3 Guest

Guests do not have accounts.

Guests access Vivaahly through:

1. Their personalized invitation link.
2. The shared wedding media QR/link.

Guests cannot access the Organizer Application.

---

# 8. Wedding Creation and Setup

An Admin creates the wedding.

The wedding setup should capture essential information such as:

- Bride name
- Groom name
- Wedding title
- Main wedding date
- Wedding description
- Cover image
- Primary venue/location information
- Wedding website theme
- Basic contact information

The exact onboarding flow will be designed later.

The setup experience should remain simple enough that the user can start managing the wedding quickly.

---

# 9. Organizer Dashboard

The dashboard should provide organizers with an immediate overview of the wedding.

The dashboard should prioritize actionable information rather than being purely decorative.

Potential dashboard information includes:

- Total events
- Upcoming events
- Upcoming tasks
- Overdue tasks
- Tasks assigned to the current organizer
- Task completion summary
- Guest count
- RSVP summary
- Recorded expenses
- Paid expenses
- Unpaid expenses
- Recent wedding activity
- Quick actions

Example quick actions:

- Add Guest
- Create Event
- Create Task
- Record Expense
- Add Vendor
- Upload Media

Exact dashboard widgets will be finalized during UX design.

---

# 10. Event Management

Events are one of the primary entities inside Vivaahly.

Examples include:

- Haldi
- Mehendi
- Sangeet
- Cocktail Party
- Wedding
- Reception
- Engagement
- Family ceremony
- Custom ceremony

Organizers may create a maximum of:

> **10 events per wedding in the MVP.**

Each event may contain:

- Event name
- Description
- Date
- Start time
- End time
- Venue name
- Venue address
- Map/location link
- Optional dress code
- Event image
- Private organizer notes

Organizers may edit event information after creation.

Event timings may be updated.

Automatic guest notifications for event changes are not included in the MVP.

---

# 11. Guest Management

Organizers should be able to create and manage wedding guests.

Two guest types will be supported.

## 11.1 Individual Guest

Example:

**Dipesh Sharma**

The invitation represents the individual guest.

---

## 11.2 Family Guest

Example:

**Sharma Family**

One primary person represents the family.

Example:

Primary invitee:

**Mr. Rajesh Sharma**

The invitation is sent to the primary invitee rather than individually to every member of the family.

The family responds collectively.

Vivaahly should not impose culturally restrictive fixed plus-one limitations in the MVP.

---

# 12. Guest Information

A guest record may contain:

- Guest name / primary invitee name
- Family name where applicable
- Guest type
- Email address
- Contact number
- Tags
- Invited events
- RSVP information
- Organizer notes

The contact number is stored for reference only.

The MVP does not use phone numbers for:

- WhatsApp
- SMS
- OTP
- Authentication

---

# 13. Guest Tags

Organizers can classify guests using tags.

Example tags:

- Bride's Side
- Groom's Side
- Bride Friends
- Groom Friends
- Office
- College Friends
- Relatives
- VIP
- Neighbours

Tags assist with:

- Searching
- Filtering
- Guest organization
- Invitation management

The MVP does not require advanced nested guest groups.

---

# 14. Event-Specific Invitations

Different guests may be invited to different combinations of events.

Example:

| Guest            | Haldi | Mehendi | Sangeet | Wedding | Reception |
| ---------------- | ----- | ------- | ------- | ------- | --------- |
| Sharma Family    | Yes   | Yes     | Yes     | Yes     | Yes       |
| Office Friend    | No    | No      | No      | Yes     | Yes       |
| Business Contact | No    | No      | No      | No      | Yes       |

Organizers select the events associated with each guest invitation.

Guests must only see events to which they have been invited.

Events that are not part of the guest's invitation should not appear in the guest-facing experience.

---

# 15. Personalized Invitation Access

Each guest invitation receives a unique secure invitation link.

Example conceptually:

`vivaahly.com/i/<secure-token>`

The guest should not need to type a code, create an account, or sign in.

Opening the personalized invitation link allows Vivaahly to determine:

- Which guest/family the invitation belongs to
- Which events they are invited to
- Which RSVP data belongs to them

The secure invitation mechanism should remain invisible and simple from the guest's perspective.

---

# 16. Invitation Experience

The digital invitation should include:

- Couple names
- Wedding branding
- Invitation message
- Invited ceremonies
- Dates
- Times
- Venue information
- Dress code where applicable
- Wedding website access
- RSVP CTA

Invitations will be sent by email in the MVP.

The MVP will not include:

- WhatsApp invitations
- SMS invitations
- Invitation expiry
- Invitation transfer
- Invitation-open tracking
- Automatic follow-up campaigns

---

# 17. RSVP

RSVP will operate at the **event level**.

A family may therefore respond differently for each event.

Example:

**Sharma Family**

Haldi — 3 attending\
Sangeet — Not attending\
Wedding — 5 attending\
Reception — 5 attending

Guests should only RSVP for events included in their invitation.

Guests may modify their RSVP after initially submitting it.

The RSVP system should not require:

- RSVP deadline
- Food preference
- Accessibility preference
- Child/adult breakdown
- Travel information

---

# 18. Family RSVP

For family invitations, one person responds on behalf of the family.

The guest should be able to specify the number of family members attending each invited event.

The MVP should not enforce a fixed maximum attendance count for the family invitation.

---

# 19. RSVP Management for Organizers

Organizers should be able to view RSVP information across:

- All guests
- Individual events
- Individual guest/family invitations

Organizers should be able to filter guests by RSVP status.

Useful statuses may include:

- Awaiting Response
- Attending
- Not Attending

Where event-level counts exist, organizers should also be able to see expected attendance totals for individual events.

---

# 20. RSVP Reminder

Automatic reminder campaigns are excluded.

Instead, organizers should have a manual action such as:

> **Send RSVP Reminder**

The reminder is sent through email.

Organizers decide when to send reminders.

---

# 21. Task Management

Vivaahly should allow the family to coordinate wedding responsibilities.

Each task should contain:

- Task title
- Description
- Assigned organizer
- Related event — optional
- Due date
- Status
- Comments
- Attachments
- Created by
- Created date

---

# 22. Task Status

Task workflow should remain intentionally simple.

Supported statuses:

1. Not Started
2. In Progress
3. Completed

The MVP does not include:

- Task dependencies
- Subtasks
- Complex workflow states
- Task automation

---

# 23. Task Collaboration

Organizers may communicate inside tasks using comments.

Example:

**Task:** Finalize Sangeet Decoration

Comment:

“Decorator has shared the final stage design.”

Another organizer may respond:

“Approved. Please confirm the final amount.”

Tasks may contain attachments such as:

- PDFs
- Images
- Quotations
- Reference files

The intent is to reduce operational information being scattered across messaging groups.

---

# 24. Organizer Calendar

The Organizer Application will contain one unified calendar.

The calendar should display:

- Wedding events
- Task deadlines

Separate calendars for events and tasks are unnecessary for MVP.

The calendar should allow organizers to understand upcoming wedding activity in chronological form.

Google Calendar synchronization is excluded.

---

# 25. Guest Wedding Schedule

Guests do not need a productivity-style month/week calendar.

Instead, the guest website should provide an attractive chronological wedding schedule.

Example:

**18 November**

10:00 AM — Haldi

**19 November**

7:00 PM — Sangeet

**20 November**

6:00 PM — Wedding Ceremony

Only events included in the guest's invitation should appear.

---

# 26. Vendor Management

Organizers should be able to maintain vendor information.

Examples include:

- Photographer
- Caterer
- Decorator
- DJ
- Makeup Artist
- Mehendi Artist
- Florist
- Venue
- Pandit
- Entertainment provider

A vendor record may contain:

- Vendor/business name
- Vendor type
- Contact person
- Contact information
- Notes
- Related events
- Related expenses
- Attachments/documents

The MVP does not provide vendor accounts or vendor portals.

---

# 27. Expense Tracking

Vivaahly will provide lightweight expense tracking.

It is not intended to be full accounting or wedding budgeting software.

Each expense may contain:

- Expense title
- Amount
- Category
- Related event — optional
- Related vendor — optional
- General/Miscellaneous designation
- Payment status
- Paid by
- Notes
- Payment receipt — optional
- Recorded by
- Expense date

Supported payment statuses for MVP:

- Paid
- Unpaid

---

# 28. Paid By

The expense system must record which organizer paid an expense.

Example:

**Stage Decoration**

Amount: ₹30,000\
Event: Sangeet\
Vendor: ABC Decorators\
Status: Paid\
Paid By: Rahul Sharma

This allows the family to understand which organizer personally covered which wedding expenses.

The MVP records this information but does not automatically calculate reimbursement balances or settlements.

Future versions may introduce:

- Amount owed to organizer
- Reimbursement status
- Settlement tracking

---

# 29. Expense Visibility

Both Admins and Managers may view all expense information in the MVP.

There is no financial privacy permission system.

Guests cannot access wedding expense information.

---

# 30. Wedding Website

Each wedding receives a guest-facing wedding website.

The site may include:

- Couple introduction
- Wedding branding
- Invitation
- Event information
- Wedding schedule
- Venue information
- Dress code
- RSVP
- Livestream
- Navigation to the Media Hub

The wedding website should be designed primarily for mobile devices because many guests will open invitations through their phones.

---

# 31. Wedding Website Themes

The MVP will contain exactly:

> **2 predefined wedding themes**

A theme controls the overall visual appearance of the guest wedding experience.

Examples of theme-controlled elements:

- Typography
- Colors
- Background styling
- Cards
- Buttons
- Decorative elements
- Invitation presentation

The MVP is not a website builder.

Users cannot manually customize every color, font, component, or page layout.

The theme system should be designed so more themes can be introduced later.

---

# 32. Language Support

The internal product documentation and Organizer Application may remain English-only for MVP.

The guest-facing wedding experience must support:

- English
- Marathi

Guests should be able to switch language.

The product should be designed so additional languages can be introduced later without fundamentally redesigning the guest experience.

Potential future languages include:

- Hindi
- Gujarati
- Punjabi
- Bengali
- Tamil
- Telugu
- Kannada
- Malayalam

---

# 33. Wedding Media Hub

Each wedding should have a dedicated Media Hub.

The Media Hub contains photos and videos uploaded by:

- Admins
- Managers
- Guests

Guests can:

- Browse photos
- Browse videos
- Upload media
- Download media

The Media Hub should encourage attendees to use Vivaahly instead of distributing wedding media across multiple WhatsApp groups.

---

# 34. Media QR Code

Vivaahly should provide a wedding-level QR code that organizers can display at the venue.

Examples of placement:

- Welcome board
- Dining tables
- Photo booth
- Reception desk
- Stage area
- Printed signage

Example CTA:

> **Scan to view, share & download wedding memories**

Scanning the QR opens the Media Hub.

---

# 35. Media Access Model

The Media Hub uses a different access model from personalized invitations.

### Personalized invitation

Used for:

- Identifying a guest/family
- Determining invited events
- RSVP
- Guest-specific wedding information

### Media QR / Media Link

Used for:

- Viewing media
- Uploading media
- Downloading media

Anyone possessing the Media QR or Media Link may access the Media Hub.

No login is required.

No invitation session is required.

No OTP is required.

No personalized guest token is required.

The link may be shared between family members and wedding attendees.

This behavior is intentional.

---

# 36. Media Upload

Guests should be able to:

1. Scan the QR or open the Media Link.
2. Select photos/videos.
3. Upload them.
4. Return to the gallery.

The upload flow should be extremely simple and mobile-friendly.

Guests should not need to:

- Register
- Sign in
- Enter contact information
- Provide invitation details

---

# 37. Media Moderation

Guest media is published directly into the wedding media experience.

The MVP does not require organizer approval before guest uploads become available.

Moderation workflows may be introduced in later versions.

---

# 38. Media Download

Guests should be able to:

- Download one photo
- Download one video where supported
- Select multiple items for download
- Download complete albums where available

The exact implementation of bulk download will be determined during technical design.

---

# 39. Livestream

Vivaahly will not operate its own livestream infrastructure.

Organizers may provide a YouTube livestream link.

The guest website embeds the YouTube livestream.

The MVP supports:

> One main wedding livestream.

Multiple livestreams for different ceremonies are deferred.

---

# 40. Search and Filtering

Organizer modules should provide basic search and filtering where useful.

## Guest filters

Examples:

- Guest name
- Tag
- Bride/Groom side
- Invited event
- RSVP status

## Task filters

Examples:

- Status
- Assignee
- Related event
- Due date

## Expense filters

Examples:

- Payment status
- Event
- Vendor
- Paid by

## Vendor filters

Examples:

- Vendor type
- Related event

Search and filtering should improve usability without becoming an advanced analytics system.

---

# 41. Recent Activity

The Organizer Dashboard may include a lightweight recent activity feed.

Examples:

- Rahul completed a task.
- Priya changed the Sangeet timing.
- Deepesh added an expense.
- A guest submitted an RSVP.
- A new vendor was added.

This feature is desirable but lower priority than core event, guest, task, RSVP, and expense functionality.

If necessary, it may be simplified during implementation without compromising the core MVP.

---

# 42. Core User Journey — Organizer

A typical organizer journey should look like:

1. Create account.
2. Create wedding.
3. Add other Admins/Managers.
4. Configure wedding information.
5. Create wedding events.
6. Add guests.
7. Assign invited events to each guest.
8. Send invitation emails.
9. Monitor RSVP.
10. Create and assign wedding tasks.
11. Add vendors.
12. Record expenses.
13. Review upcoming items through dashboard/calendar.
14. Configure guest website.
15. Add livestream link.
16. Upload wedding media.
17. Generate/display Media QR.
18. Continue coordinating wedding activities until completion.

---

# 43. Core User Journey — Invited Guest

A typical invitation journey should look like:

1. Guest receives invitation email.
2. Guest clicks personalized invitation link.
3. Vivaahly identifies the guest/family.
4. Guest sees wedding invitation.
5. Guest sees only invited events.
6. Guest reads venue/date/time information.
7. Guest submits RSVP for each event.
8. Guest can modify RSVP later.
9. Guest checks wedding schedule when needed.
10. Guest accesses wedding livestream where applicable.

The guest should never need to create an account.

---

# 44. Core User Journey — Wedding Attendee Media

A wedding attendee should be able to:

1. See a Vivaahly QR code at the venue.
2. Scan the QR.
3. Open the Media Hub immediately.
4. Browse existing wedding photos/videos.
5. Upload photos/videos from their device.
6. Download media they want.
7. Share the Media Link with other attendees/family members if desired.

No authentication should interrupt this flow.

---

# 45. Important Product Rules

The following rules are considered finalized for MVP.

### Rule 1

One user account belongs to one wedding.

### Rule 2

A wedding may contain multiple Admins and Managers.

### Rule 3

Admins manage organizer membership.

### Rule 4

Managers have broad operational access.

### Rule 5

Both Admins and Managers can view expenses.

### Rule 6

Maximum 10 events per wedding.

### Rule 7

Guests may be individuals or families.

### Rule 8

Family invitations are sent to one primary person.

### Rule 9

Guests may be invited to different combinations of events.

### Rule 10

RSVP operates per event.

### Rule 11

Guests do not create accounts.

### Rule 12

Guest invitations use personalized links.

### Rule 13

The Media Hub uses a shared wedding QR/link.

### Rule 14

Anyone possessing the Media QR/link may access wedding media.

### Rule 15

Guest uploads require no organizer approval in MVP.

### Rule 16

Guest website supports English and Marathi.

### Rule 17

Organizer application may remain English-only.

### Rule 18

MVP contains two guest website themes.

### Rule 19

Livestream uses an embedded YouTube stream.

### Rule 20

Expenses track who paid but do not calculate reimbursements.

---

# 46. MVP Functional Modules

The finalized MVP consists of the following functional modules.

## Organizer

1. Authentication
2. Wedding Setup
3. Organizer Management
4. Dashboard
5. Event Management
6. Guest Management
7. Guest Tags
8. Event-Specific Invitations
9. Email Invitations
10. RSVP Management
11. Manual RSVP Reminders
12. Task Management
13. Task Comments
14. Task Attachments
15. Organizer Calendar
16. Vendor Management
17. Expense Tracking
18. Media Management
19. Wedding Website Configuration
20. Theme Selection
21. YouTube Livestream Configuration
22. Media QR Generation
23. Search and Filtering

## Guest

24. Personalized Digital Invitation
25. Event-Specific Guest Experience
26. Event-Level RSVP
27. Wedding Schedule
28. Venue Information
29. Dress Code Information
30. English/Marathi Language Switching
31. Wedding Livestream

## Media

32. Media Hub
33. Shared Media QR
34. Guest Photo Upload
35. Guest Video Upload
36. Media Browsing
37. Individual Download
38. Multi-Select Download
39. Album Download

---

# 47. Explicitly Out of Scope for MVP

The following items should not be introduced during MVP development unless the product scope is deliberately revised.

- Multiple weddings per account
- Wedding planner agency accounts
- Wedding planner SaaS features
- Advanced role permissions
- Manager-specific financial permissions
- Contact importing
- Excel/CSV guest import
- WhatsApp integration
- SMS integration
- OTP guest authentication
- Invitation expiry
- Invitation transfer
- Invitation-open tracking
- Automatic RSVP reminders
- RSVP deadline enforcement
- Food preferences
- Accessibility preferences
- Child/adult guest breakdown
- Accommodation management
- Hotel management
- Room allocation
- Transport management
- Driver management
- Airport pickup
- Railway pickup
- Travel itinerary management
- Budget planning
- Budget forecasting
- Advanced accounting
- Reimbursement settlement
- Family payment reconciliation
- Task dependencies
- Subtasks
- Automatic task reminders
- Google Calendar synchronization
- Automatic event-change notifications
- Vendor accounts
- Vendor marketplace
- Photographer accounts
- Media approval workflow
- AI face recognition
- AI photo search
- Automatic photo categorization
- Multiple livestreams
- Native video streaming
- Advanced website builder
- Custom domain support
- Large theme marketplace
- Data export
- Long-term archival policies
- Automatic media deletion
- Subscription plans
- Paid tiers
- Marketplace monetization

---

# 48. UX Principles

Vivaahly should follow several product principles.

## 48.1 Family Friendly

Users may not be technically sophisticated.

The interface should avoid unnecessary complexity.

---

## 48.2 Mobile First for Guests

Guest interactions will frequently happen on smartphones.

Invitation, RSVP, schedule, language switching, livestream, and media flows must work particularly well on mobile devices.

---

## 48.3 Low Friction

Guests should not need accounts.

Attendees should not need authentication to use the Media Hub.

Common organizer actions should require as few steps as reasonably possible.

---

## 48.4 Wedding-Specific Language

The product should feel designed for weddings rather than like generic project management software.

For example:

Prefer:

**Wedding Events**

over:

**Projects**

Prefer:

**Guests**

over:

**Contacts**

Prefer:

**Wedding Schedule**

over:

**Calendar Agenda**

---

## 48.5 Collaboration Over Complexity

The primary purpose is helping trusted family members work together.

Vivaahly should prioritize clear ownership and shared visibility instead of complex enterprise-style permission systems.

---

# 49. MVP Success Criteria

The MVP should be considered successful if a family can manage the fundamental wedding workflow entirely inside Vivaahly.

A successful MVP should allow the following scenario:

1. A bride/groom creates a wedding.
2. Family organizers join.
3. Up to 10 ceremonies are created.
4. Guests are added.
5. Guests are assigned to different events.
6. Invitations are emailed.
7. Guests RSVP per event.
8. Organizers can understand expected attendance.
9. Tasks are created and assigned.
10. Organizers can understand who is responsible for what.
11. Vendors are recorded.
12. Expenses are recorded with payment status and payer.
13. Organizers can see upcoming wedding activity.
14. Guests can access an English/Marathi wedding experience.
15. Guests can watch the wedding livestream.
16. Wedding attendees can scan a QR.
17. Attendees can upload wedding photos/videos.
18. Other attendees can view and download those memories.

If this complete workflow is reliable and easy to use, the MVP solves the primary product problem.

---

# 50. Product Success Signals

Formal business KPIs are premature because the MVP is initially focused on validating the product.

However, useful product signals include:

- Percentage of invited guests who successfully RSVP
- Number of organizers actively collaborating
- Percentage of tasks with a clearly assigned owner
- Percentage of tasks completed before their deadline
- Number of wedding events actively managed through Vivaahly
- Number of guest media uploads
- Number of media downloads
- Repeat Organizer Application usage during the wedding preparation period
- Reduction in information that must be communicated manually outside Vivaahly

Qualitative feedback will also be critical.

The strongest validation would be organizers saying:

> “We stopped asking each other who was responsible for what because everything was visible in Vivaahly.”

and guests saying:

> “I always knew where to find the wedding information.”

---

# 51. Key Risks

## 51.1 Feature Scope

Wedding management can easily expand into dozens of modules.

The MVP must resist adding accommodation, transport, budgeting, advanced permissions, WhatsApp integration, AI features, and similar additions during initial development.

---

## 51.2 Guest Simplicity

If RSVP or invitation access becomes too complicated, guests—especially elderly family members—may abandon the digital experience.

Guest UX must remain simple.

---

## 51.3 Media Storage

Wedding photos and videos can consume significant storage.

Technical architecture must later consider:

- File-size restrictions
- Storage cost
- Video limits
- Upload reliability
- Download performance

These are technical decisions rather than changes to the product requirement.

---

## 51.4 Shareable Media Access

Anyone possessing the Media QR/link can access the wedding media.

This is an intentional MVP product decision.

Future versions may provide privacy modes such as:

- Open via QR
- Invitation holders only
- PIN protected

These are not MVP requirements.

---

## 51.5 Invitation Link Sharing

Because guests do not authenticate, a personalized invitation link can theoretically be forwarded.

The MVP accepts this trade-off to preserve a frictionless guest experience.

Stronger identity verification may be evaluated later if real users demonstrate a need.

---

# 52. Future Product Opportunities

These are ideas for later versions and must not affect MVP delivery.

Potential future directions include:

- WhatsApp invitations
- WhatsApp RSVP reminders
- Event change notifications
- Guest import
- Accommodation
- Transportation
- Reimbursement tracking
- Advanced finance management
- More Indian languages
- More wedding themes
- Photographer access
- Media moderation
- AI photo grouping
- Face-based photo discovery
- Multiple livestreams
- Wedding archive/export
- Custom domains
- Wedding planner accounts
- Vendor marketplace
- Subscription plans

These should remain backlog opportunities rather than commitments.

---

# 53. Technical Decisions Deferred Until Architecture Phase

This PRD intentionally does not prescribe:

- Frontend framework
- Backend framework
- Database
- Authentication provider
- Email provider
- File storage provider
- CDN
- Media processing pipeline
- Hosting provider
- Deployment platform
- Localization library
- Invitation token implementation
- QR implementation
- Download bundling strategy
- YouTube integration approach
- API style
- Database schema

These decisions should be made during the next product engineering phases after the PRD is accepted.

---

# 54. Final MVP Definition

Vivaahly MVP is:

> **A collaborative wedding operating system for Indian families that centralizes wedding events, guests, event-specific invitations, RSVP, tasks, vendors, expenses, schedules, wedding information, livestreaming, and shared wedding memories.**

The product should replace significant portions of the organizational chaos currently spread across WhatsApp groups, spreadsheets, phone calls, notes, and family conversations.

The MVP does not attempt to solve every problem surrounding an Indian wedding.

It focuses on the core coordination loop:

> **Plan the wedding → organize responsibilities → invite guests → collect attendance → coordinate events → track operational information → celebrate → preserve and share memories.**

That loop defines Vivaahly v1.
