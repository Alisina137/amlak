# AMLAKLINK — AUTHORITATIVE PRODUCT & SYSTEM SPECIFICATION

**Working brand:** AmlakLink (املاک لینک)  
**Version:** 1.0 • **Research cutoff:** 17 October 2026 • **Status:** Product specification / proposed requirements, not implementation  
**Territory:** Afghanistan only • **Launch focus:** Kabul • **Supported languages:** Dari (default), Pashto, English  
**Primary platform:** Android-first mobile application, iOS-compatible • **Operations:** Separate web administration panel  
**Business model:** Freemium marketplace + optional professional subscriptions and listing promotions

> **Evidence key:** **Verified** = stated by linked official product/service documentation; **User requirement** = supplied in the project brief; **Proposal** = recommended product behavior; **Assumption** = requires discovery or feasibility validation. Prices, capacity limits, response-time targets, and timelines are *proposals*, not established Afghanistan market facts. No application has been implemented or tested.

---

## 1. Executive Summary

AmlakLink is an Afghanistan-only real estate marketplace for **buying, selling, renting, and gharawi (گروی)** properties. It combines a fast, trustworthy consumer discovery experience with digital tools for owners, independent agents, agencies, and developers. Anyone can browse without registration. Authorized advertisers can publish moderated listings, manage inquiries, and arrange viewings. Agencies can manage members, listing assignments, response queues, and professional subscriptions. Separate web operations support staff manage quality, verification, payments, fraud reports, and platform configuration.

**Strategic choice:** compete on *verified listing freshness + locally correct transaction data + agency workflows*, not by cloning Zillow or piling advanced AI onto an empty marketplace. Support all 34 provinces in data and forms, but launch supply acquisition and moderation in Kabul first. Koor is a serious benchmark, not an easy competitor: its current site and store listing already advertise multilingual listings, verified agencies, free publishing, favorites, direct contact, and gharawi [S1–S3]. Khaneh already promotes owner verification, direct contact, professional video, and map location [S4–S5]; therefore these alone are not unique differentiators.

**North-star metric:** **qualified buyer/renter-to-advertiser connections per active, freshness-confirmed listing per 30 days**. Do not optimize only app downloads or listing counts.

**Release promise:** Search property → understand verified information → contact responsible advertiser → arrange viewing. AmlakLink facilitates these steps; it **does not guarantee ownership, legal title, payment safety, or closing a property transaction**.

## 2. Application Idea Analysis

| Dimension | Assessment | Decision |
|---|---|---|
| Core demand | Searchers lack a single reliably fresh, understandable inventory; advertisers need qualified demand. | Two-sided marketplace, built for supply quality first. |
| Critical adoption barrier | No listings = no searchers; no searchers = no agents. | Agency-assisted Kabul pilot, manual data quality operations. |
| Trust barrier | Identity, ownership, location, duplicate photos, and suspicious deposits. | Tiered verification, private document handling, reporting, no transaction escrow in MVP. |
| User frequency | Searchers visit intensely for a short period; agencies work daily. | Saved searches for demand retention; agency CRM for recurring value. |
| Highest-value task | Find a relevant currently available property and reach the actual contact. | Short path from search to call/WhatsApp/inquiry. |
| Economic buyer | Agent, agency, developer, or marketing advertiser. | Keep search free; monetize professional time savings/visibility. |
| Scope control | Banking, mortgage pre-approval, ownership assurance, full rent collection are risky/not locally verified. | Exclude from MVP and likely V1.1. |

## 3. Problem and Opportunity

**User requirement:** Afghanistan real estate discovery is often fragmented across agents, messages, social platforms, and websites. **Evidence:** Koor, Khaneh, and Asoda currently offer online supply and overlapping core functions [S1, S4, S6]; this is an existing market, not an untouched one. **Opportunity hypotheses to validate:** people may pay attention to more reliable *availability*, clearer *gharawi terms*, *real response rates*, and more structured *agency service*. These are hypotheses rather than verified deficiencies in competitors.

**Why new users should switch:** an understandable information hierarchy; honest freshness labels; transparent advertiser identity; clear deposit/rent components; ability to compare and share properties; quick follow-up on leads; predictable support when listings are inaccurate.

**Regional constraints:** DataReportal reported **11.3 million internet users** in Afghanistan at the end of 2025 and median fixed internet download speed of **4.47 Mbps** [S17]. Mobile efficiency, accessibility at low bandwidth, and support for users without international cards are product requirements, not afterthoughts.

## 4. Target Users

1. **Seekers:** buyers, renters, gharawi seekers, families jointly comparing choices, commercial tenants.
2. **Private property advertisers:** owners or duly authorized representatives advertising one or a few properties.
3. **Independent agents:** professionals serving multiple owners and clients.
4. **Agencies:** businesses with owners/managers and staff agents; primary repeat users and subscription candidates.
5. **Developers:** commercial organizations advertising new-build projects and unit inventories (later release).
6. **Internal operations:** reviewers, verification staff, billing/support staff, platform administrators.
7. **Visitors:** not yet registered, browsing and calling when advertisers permit.

## 5. User Personas

| Persona | Goal / frequent job | Friction | Product value |
|---|---|---|---|
| Renter in Kabul | Find an affordable, available home this week | Repeated phone calls, outdated ads | Verified availability, precise rent/advance filters, direct call |
| Gharawi seeker | Understand refundable deposit and any rent | Ambiguous pricing | Separate amount, currency, return/term notes, explicit disclaimer |
| Buyer of residential land | Compare location, size, documentation claims | High-stakes inaccurate information | Land-specific attributes, seller verification, document *claim type* |
| Private owner | Reach real customers without a broker | Hard listing forms and spam | Photo-first listing wizard, contact preference and inquiry tracking |
| Independent agent | Manage inquiries for 10–30 properties | Leads scattered in messaging apps | Lead inbox, status, templates, activity history |
| Agency manager | Know who handles each listing and lead | No shared, accountable pipeline | Assignment, team roles, reports, billing |
| Moderator | Remove fraud with audit evidence | Little context, unstructured reports | Verification queue, reason codes, evidence and appeals |

## 6. Reference UI Analysis

**Method:** Product websites, help centers, and official mobile app descriptions, not an installed hands-on usability test. Screenshot evidence from official Zillow property-page and search illustrations [S8–S9], Redfin mobile page [S10], Realtor.com mobile page [S11], and Zoopla app help [S12–S13]. No user screenshots were provided of the English products.

| Reference | Verified pattern / UI purpose | Adopt in AmlakLink | Avoid |
|---|---|---|---|
| **Zillow** | High-impact listing photography, quick-view facts, prominent contact/tour CTA, collaborative saved collections (June 2026) [S8–S9] | Photo-led detail, sticky call/contact, shared shortlists later | U.S. loans, tax estimates, unearned automated valuation |
| **Redfin** | Photo/video/3D media, fast discovery, tour scheduling and agent handoff [S10] | Photo/video tour, request-a-viewing flow | Promise instant confirmed tours without advertiser capacity |
| **Realtor.com** | Draw-on-map search, home alerts, image browsing by room type, 3D tours [S11] | Room-labeled photos (V1.1), editable map extent, alerts | Flood/noise/school-score claims lacking reliable local data |
| **Rightmove** | Draw-a-search polygon and saved custom areas [S14] | Drawn search area (V1.1), neighborhood chips (MVP) | Expensive polygons as prerequisite for core search |
| **Zoopla** | List/map switch, price pins, saved/track property, saved-search notifications, property timelines [S12–S13] | Map/list toggle, saved searches; source-tagged listing event history later | Estimate property value without transaction data |
| **Apartments.com** | Rental management workflows: applications, messages, leases, maintenance and payments [S15] | Organized rental inquiries and unit availability | U.S.-specific screening, leases and rent payment integration |
| **Homes.com** | Agent-focused professional brand pages, enhanced listing media, lead vetting [S16] | Agency pages + response-quality metrics | Unverified lead-screening claims, copied advertising claims |
| **Koor (AF)** | Dari/Pashto/English, verified-agency directory, favorites, WhatsApp/phone, gharawi [S1–S3] | Retain local simplicity; make agency verification distinguishable | Assume competitors lack verification or gharawi |
| **Khaneh (AF)** | Verified owner messaging, listings, maps, videos, direct contact [S4–S5] | Verification evidence, visual listings, direct calls | Market verification/video as new inventions |
| **Asoda (AF)** | Nationwide basic search, free self-post, direct contact [S6] | Easy contribution and category coverage | Depend on listing count alone |

### Detailed interaction critique (product analysis, not external usability findings)

- **Search header:** one prominent location search field; sale/rent/gharawi segmented control; a compact filter row. Don't stack five rows of pills on a 360-pixel phone.
- **Card:** 4:3 image, price (largest), transaction tag, neighborhood, property type, 2–4 relevant facts, updated date, small verification label, heart control; no random decorative metrics.
- **Listing detail:** photo/media gallery → price and terms → location → key facts → amenities → advertiser credentials → report. Persist call and message CTAs at bottom with safe-area padding.
- **Inquiry:** no deceptive “book now” button. “Request a viewing” creates a pending request, not a confirmed booking.
- **Agency view:** operational list with unread/overdue lead badges; mobile cards replace wide tables.

## 7. UI Inspiration Synthesis

**Original direction:** calm, trustworthy property search rather than imitation of English-market branding. Visually prioritize three facts—*where, what, and price*—then *whether still available*, then *who can answer*. Use a unified verified badge system, cautious map pins for private homes, clear state chips, and honest timestamps. Search and contacting must work before full profile onboarding. Use progressive disclosure for advanced filters and advertiser features.

## 8. Market Landscape

**Direct local:** Koor, Khaneh, Asoda. **International pattern references, not direct Afghanistan competitors:** Zillow, Redfin, Realtor.com, Rightmove, Zoopla, Apartments.com, Homes.com. **Indirect substitutes:** agency storefronts, social-media listings, phone/WhatsApp networks and community referrals (local usage extent to be validated). Claims about local company market share, app revenue, and exclusive capabilities are intentionally omitted: reliable public evidence was not established.

## 9. Competitor Analysis

| Product | Audience / positioning | Verified strengths | Monetization / AI / mobile notes |
|---|---|---|---|
| Zillow | U.S. multi-sided housing journey | Shared collections, market insights, viewing flows and AI mode [S8–S9] | Professional services / media promotion; advanced AI not justified for our MVP |
| Redfin | U.S. shoppers and agents | App with tours, recommendations, agent contact [S10] | Agent-services-led commercial model; real-time data dependence differs in Afghanistan |
| Realtor.com | U.S. shoppers | Map Draw, alerts, media classification [S11] | Advertising/referrals in its market; needs local data to replicate insights |
| Rightmove | UK property discovery | Custom map polygons, alerts [S14] | B2B estate-agency advertising; direct relevance: subscriptions |
| Zoopla | UK buyers/renters and professionals | Maps, alerts, property tracking [S12–S13] | Estimates depend on UK-specific data assets |
| Apartments.com | U.S. rental owners/renters | End-to-end rental management [S15] | U.S. screening / online payments inapplicable without regional validation |
| Homes.com | U.S. buyer-agent discovery | Agent profiles, rich listing presentation, lead vetting [S16] | Paid pro branding options; good agency-dashboard inspiration |
| Koor | Afghanistan-wide | Verified agency directory, gharawi, listings [S1–S3] | Current site says free listing; other paid terms not established |
| Khaneh | Afghanistan | Direct owner contact, video, verification messaging [S4–S5] | Site promotes free listings; no current tariff verified |
| Asoda | Afghanistan | Free listing, local categories, Android/iOS availability [S6] | Revenue model not established |

## 10. Competitor Strengths

Adopt **(a)** Zillow's clear property visual hierarchy and collaboration, **(b)** Redfin's viewing journey, **(c)** Zoopla's saved search workflows, **(d)** Rightmove's area-defined search, **(e)** Apartments.com's advertiser work queue, and **(f)** Koor/Khaneh's Afghan-specific transactions and low-friction contact. Preserve differentiation through reliable *advertiser response and freshness operations*, where impact must be validated with pilots.

## 11. Competitor Weaknesses — evidence discipline

- **Verified product dependency:** UK/U.S. price valuations and rent screening use regional data and rules; they are **not transferable** to Afghanistan [S9, S15]. This is a localization incompatibility, not proof their products are weak.
- **User-reported individual complaint:** a Reddit report describes a Zillow duplicate/wrong location; another describes alerts outside a chosen area [S18–S19]. These are anecdotes, **not prevalence data**.
- **Hypotheses requiring local validation:** stale Afghan listings, slow reply, misleading gharawi amounts, location privacy worries, low agency willingness to pay, and repeated duplication. Do not attribute these complaints to Koor or Khaneh without evidence.
- **Product risk:** paid promotions could bury relevant organic listings. Design labeled promotion slots with capped frequency.

## 12. Market Gaps

| Gap hypothesis | Why it matters | Existing response / evidence | Proposed AmlakLink solution | Validation |
|---|---|---|---|---|
| Listings become stale | Searchers waste time | Local services already have listings [S1–S6]; relative freshness unknown | Mandatory activity-confirmation, expiration, “last confirmed” label | Audit 100 Kabul ads across services |
| Agency follow-up is scattered | Lost leads | Homes.com/Apartments.com have professional tooling [S15–S16]; local coverage unknown | Shared agency inquiry queue and agent assignments | Interview 15–20 agencies |
| Gharawi terms are ambiguous | Potential costly misunderstanding | Koor already supports gharawi [S1] | Structured principal, any rent, duration, refund clause, notes | Review 20 real local contracts with advisers |
| Listing truth unclear | Fraud and safety risk | Koor/Khaneh already state verification efforts [S2, S5] | Separate identity/listing/location/document-claim statuses | Pilot dispute/audit process |
| Families compare outside the app | High effort | Zillow shared collections [S8] | Shareable saved shortlist without exposing private notes | Shopper interviews |
| Demand is concentrated by neighborhood | Bad generic results | Search maps known internationally [S11–S14] | Afghanistan-specific province/city/district/neighborhood synonyms | Search-log coverage review |

## 13. Product Vision

Within three years, AmlakLink should be the **credible, current directory and lead-management layer** for residential and commercial property in Afghanistan. It should be valuable to seekers who never pay and to agencies who pay because it reliably helps their team respond to actual demand.

## 14. Value Proposition

**For seekers:** “Find currently advertised Afghan properties that match your area and budget, understand the actual rent/deposit or asking price, and contact the right person.” **For agents/agencies:** “Publish once, keep properties current, assign inquiries, and see which listings produce genuine responses.” **For administrators:** “Review, verify, moderate, and manage fees with an audit trail.”

## 15. Differentiators (proposed)

1. Freshness badge based on confirmed availability, distinct from identity verification.
2. Gharawi-first structured pricing rather than one ambiguous “price” field.
3. Localized location taxonomy and flexible spelling/transliteration search.
4. Role-aware agency team inbox with ownership and response tracking.
5. Visible advertiser type: private owner / representative / agent / agency.
6. Flexible residential address privacy, approximate map positions.
7. Offline-safe saved browsing and draft publishing on weak connections.
8. Transparent sponsorship labels and organic ranking principles.
9. Multi-dimensional verification statuses (never “legal ownership guaranteed”).
10. Verification appeals and listing corrections as real workflows.

## 16. Product Principles

**Truth before growth; privacy before pin precision; access before signup; photos before ornament; explain status; default to local units; predictable RTL; graceful low-connectivity degradation; opt-in communication; honest sponsored labels; structured monolith before microservices; no AI without clear unit economics.**

## 17. User Roles

System roles: **Visitor; Registered Seeker; Private Advertiser; Independent Agent; Agency Member (Agent); Agency Manager; Agency Owner; Developer Manager (future); Moderator; Verification Officer; Billing/Support Officer; Platform Admin; Super Admin**. “Buyer”, “renter”, “investor” are *intent tags*, not separate permanent privileges. A registered user may become an advertiser without losing seeker features. An agency person may have multiple memberships, with permissions scoped per agency; prohibit unrelated agencies accessing each other's data.

## 18. Permission Matrix

Legend: V = view; C = create; E = edit own/scoped; A = approve/assign/manage; — = no access. Backend enforces permissions regardless of UI.

| Capability | Visitor | Seeker | Private owner | Indep. agent | Agency agent | Agency manager/owner | Moderator | Admin |
|---|---|---|---|---|---|---|---|---|
| Public published listings | V | V | V | V | V | V | V | V |
| Saved searches / favorites | — | C/E | C/E | C/E | C/E | C/E | V only if necessary | A for abuse only |
| Submit private listing | — | after verification | C/E own | C/E own | scoped only | scoped | — | A |
| Manage agency listing | — | — | — | — | assigned E | A scoped | — | A emergency |
| View own lead / viewing requests | — | own | own listing | own listing | assigned | team | only reported cases | limited audited access |
| Manage agency team/roles | — | — | — | — | — | A scoped | — | A emergency |
| Mark verification result | — | — | — | — | — | — | assigned queue only | A |
| Moderate public listings | — | — | — | — | — | — | A | A |
| Manage plans / billing | — | own invoice | own | own | — | agency owner billing | — | A billing officer/admin |
| System configuration / staff roles | — | — | — | — | — | — | — | Admin/Super Admin only |

**Separation of duties:** moderators may remove listing visibility but cannot approve payments; billing staff cannot mark ownership-related verification; only Super Admin can grant admin privileges, and privileged changes require immutable audit logs.

## 19. Information Architecture

```text
Mobile application
├── Public: Explore → Search → Results (List/Map) → Property detail → Agent/Agency
├── Authentication: Phone/email registration → Verification → Account recovery
├── Five bottom tabs: Explore | Search | Saved | Inbox | Account
│   ├── Explore: Buy / Rent / Gharawi / Commercial / Land / New projects (later)
│   ├── Search: Location, filters, results, map, saved search
│   ├── Saved: Properties, searches, comparisons (later), shared lists (later)
│   ├── Inbox: Inquiries, viewing requests, notifications
│   └── Account: Profile, My listings, Professional tools, Preferences, Help
├── Advertiser workspace: Dashboard → Listings → Leads → Viewings → Plan
├── Agency workspace: Overview → Properties → Leads → Team → Reports → Billing
└── Settings / Support / Safety

Separate admin web
├── Authentication / staff MFA
├── Overview
├── Listing moderation / duplicate triage
├── Advertiser and agency verification
├── Users and organizations
├── Reports / fraud / appeals
├── Promotions / subscriptions / manual payments
├── Catalogs: locations, categories, amenities
├── Customer support / notifications
├── Audit logs / exports / operational health
└── System settings / staff roles
```

## 20. Sitemap

**Mobile route names are conceptual (Expo Router route paths), not fixed file layout.**

```text
/(tabs)/explore     /(tabs)/search    /(tabs)/saved    /(tabs)/inbox     /(tabs)/account
/property/[id]     /property/[id]/gallery  /property/[id]/location
/agency/[id]       /agent/[id]       /search/filters   /search/map
/search/saved      /saved/collections (V1.1)           /compare (V1.1)
/auth/welcome      /auth/sign-in     /auth/register    /auth/verify   /auth/recover
/listings/new      /listings/[id]/edit  /my-listings   /my-inquiries
/inquiries/[id]    /viewings/[id]    /notifications    /report/[listingId]
/pro/dashboard     /pro/listings     /pro/leads       /pro/viewings
/agency/dashboard  /agency/properties /agency/leads   /agency/team
/agency/reports    /agency/billing  /agency/settings /upgrade
/settings/profile  /settings/language /settings/notifications
/settings/privacy  /settings/security /settings/help /settings/delete-account
```

**Admin web paths:** `/admin/login`, `/admin`, `/admin/listings`, `/admin/reviews/:id`, `/admin/verification`, `/admin/agencies`, `/admin/users`, `/admin/reports`, `/admin/appeals`, `/admin/billing`, `/admin/promotions`, `/admin/catalogs`, `/admin/support`, `/admin/audit`, `/admin/staff`, `/admin/settings`.

## 21. Page Inventory

**States key:** L=loading, E=empty, X=error, U=unauthorized, S=success, O=offline, P=pending review. All network-driven pages require L/E/X/O; privileged pages also require U. Route paths are illustrative, not implementation mandates.

| Page / route | Roles | Purpose & main components | Primary action | Special states / mobile pattern | Release |
|---|---|---|---|---|---|
| Explore `/explore` | All | Search prompt, buy/rent/gharawi chips, fresh local listings | Search / open property | Skeleton sections; vertical feed | MVP |
| Search `/search` | All | Place autocomplete, fast filters, results count | Search | Filter bottom sheet, list | MVP |
| Filter sheet `/search/filters` | All | Price type, location, property type, rooms, amenities | Apply / reset | Dependent fields, validation | MVP |
| Map results `/search/map` | All | Clustered property pins and bottom property cards | Select property | Map unavailable → list | MVP (basic) |
| Listing detail `/property/[id]` | All | Gallery, price, structured facts, advertiser, contact | Call / inquire | Unavailable banner; sticky CTA | MVP |
| Photo gallery `/property/[id]/gallery` | All | Photos/video, room labels when present | Navigate media | Retry individual failed asset | MVP |
| Seller/agent profile `/agent/[id]` | All | Verified claims, active listings, contact options | View listings/contact | No ratings by default | MVP |
| Agency page `/agency/[id]` | All | Logo, business info, verified state, active listings | Browse/contact | Public profile for verified agencies | MVP |
| Sign in `/auth/sign-in` | Guest | Phone/email, password or enabled OTP | Sign in | Account recovery | MVP |
| Register `/auth/register` | Guest | Minimal identity + consent | Create account | Disabled until valid | MVP |
| Verify `/auth/verify` | New user | OTP / proof status | Verify | Resend cooldown, expiry | MVP |
| Recovery `/auth/recover` | Guest | Verified recovery channel | Recover | Rate limit | MVP |
| Saved properties `/saved` | Logged in | Saved listings and availability filters | Open / unsave | Login gate | MVP |
| Saved searches `/search/saved` | Logged in | Search chips and matching changes | Edit / delete | Alerts opt-in | V1.1 |
| Notifications `/notifications` | Logged in | Personal/system items | Open / mark read | Deep links, batching | MVP |
| Inbox `/inbox` | Logged in | Inquiry threads and viewing requests | Reply | Offline queued drafts | MVP (basic) |
| Inquiry detail `/inquiries/[id]` | Participants | Listing context, conversation, status | Reply / close | Permission revocation | MVP |
| Viewing request `/viewings/[id]` | Participants | Date/time options and statuses | Request / respond | Pending != confirmed | MVP |
| Account `/account` | Logged in | Identity, listing shortcut, settings, upgrade | Open workspace | Role-aware grouping | MVP |
| Profile settings `/settings/profile` | Logged in | Name and contact preferences | Save | Sensitive changes re-verify | MVP |
| Language `/settings/language` | All | Dari/Pashto/English switch | Change locale | All RTL/LTR reflow | MVP |
| Notification preferences | Logged in | In-app/push/email alert categories | Save | Push permission denied | V1.1 |
| Privacy/security | Logged in | Active sessions, contact rules, delete request | Revoke / export / delete | Confirmation and audit | MVP |
| Report listing `/report/[id]` | All | Reason, detail, optional evidence | Submit report | Anonymous abuse-rate limits | MVP |
| New listing `/listings/new` | Verified advertiser | Wizard: type → location → terms → facts → photos → preview | Submit review | Draft autosave; offline draft | MVP |
| Listing editor `/listings/[id]/edit` | Own/scoped | Edit property fields and availability | Save changes | Significant edits trigger re-review | MVP |
| My listings `/my-listings` | Advertiser | Listing status chips and management | Edit, pause, renew | Sort by attention needed | MVP |
| Advertiser dashboard `/pro/dashboard` | Advertiser | Attention queue, active listings, inquiries | Respond / list | Role-based modules | MVP |
| Advertiser leads `/pro/leads` | Agent/private owner | Contacts, callbacks, statuses | Update lead | Private, scoped | MVP |
| Agency overview `/agency/dashboard` | Agency team | Inventory, unassigned leads, upcoming viewings | Assign / respond | Owner/manager variants | MVP |
| Agency properties `/agency/properties` | Agency team | Search, status, assignees, bulk actions | Edit/assign | Multi-select only when permission | MVP |
| Agency leads `/agency/leads` | Agency team | Assignment and response queue | Assign / close | SLA flags are indicators | MVP |
| Agency team `/agency/team` | Manager/owner | Invite, deactivate, role list | Invite/assign | Seat limits | V1.1 |
| Agency reports `/agency/reports` | Manager/owner | Views, contacts, response speed | Filter time | Aggregate only, no fabricated results | V1.1 |
| Agency billing `/agency/billing` | Owner | Plan, invoice, payment proof | Submit payment | Pending/manual confirmation | V1.1 |
| Promotions `/upgrade` | Advertiser | Sponsored options and entitlement summary | Request promotion | Sponsored disclosure | V1.1 |
| New projects `/projects` | All | Building/project and unit browsing | View unit | No fake unit availability | V2 |
| Admin overview `/admin` | Staff | Queue counts, alerts, review shortcuts | Triage | Secure desktop layout | MVP |
| Admin moderation | Moderator | Pending property list and audit evidence | Approve/reject | Conflict-safe actions | MVP |
| Admin verification | Verification staff | Identity/agency proof workflows | Approve/decline | Private files and reason codes | MVP |
| Admin user/agency management | Authorized staff | Account, status, organization relations | Suspend / restore | Strong permission gates | MVP |
| Admin reports/appeals | Authorized staff | Abuse, disputes, appeals and decisions | Resolve | Audit records | MVP |
| Admin billing/promotions | Billing staff | Payment proofs, invoices, placements | Confirm/decline | Four-eyes review for large sums | V1.1 |
| Admin catalogs | Platform admin | Location hierarchy, amenity dictionary | Update | Publish/version changes | MVP |
| Admin staff & audit | Super admin | Staff roles, immutable events | Assign role | MFA required | MVP |
| Admin support | Support staff | User tickets and response history | Respond / escalate | Redaction required | V1.1 |

## 22. Detailed Page Specifications

The following are normative interaction contracts. **Every screen** follows consistent placeholders/skeletons while loading, meaningful empty-state action, error retry, and protection against stale API responses. UI screens in a mobile app do not have “desktop variants”; companion admin screens do.

### P-01 Explore / Home

- **Purpose/entry:** default first tab for visitor or signed-in user; keep searches discoverable without login.
- **Layout:** top app bar (logo, language, notifications), location picker with Kabul suggested, large compact search bar, buy/rent/gharawi selector, “recently confirmed” horizontal row, property-type chips, nearby areas, recent listings. Do not show unsupported personalized recommendations as if learned.
- **Behavior:** intent tabs update content and selected styling; scroll position/focus preserved on switching tabs; location defaults Kabul until user chooses province; “All Afghanistan” always available. Quick filters never persist silently outside current session.
- **States:** skeleton cells, true no-listings explanation, network retry, offline last-viewed only clearly labeled, no fake loading counters.
- **Acceptance:** visitor can open any published listing in <=3 taps from a visible card; search remains useful without geolocation permission.

### P-02 Search / Filters / Map

- **Layout:** header input with location suggestions, active filter summary, sort control, list/map segmented switch, lazy cards; advanced filters in a modal bottom sheet with Apply/Reset.
- **Behavior:** filters are conjunctive across groups, OR within selected values of the same group; user sees live result count after Apply; stable cursor pagination, deterministic tie break. Search state retained on detail back navigation. Currency is not silently converted.
- **Map:** permissionless browsing; location map centers on selected area; marker selections open card; cluster when dense; “search this area” explicit rather than constantly refetching while panning; exact private-home coordinates may be blurred to neighborhood or approximate circle.
- **Error:** when tile provider is unavailable, switch to list, preserve filter state; geolocation denied is not an error.

### P-03 Property Detail

- **Components:** media gallery with count; status (Available, Temporarily unavailable, Rented, Sold, Expired), freshness date; headline, transaction badge, quoted price; gharawi breakdown; primary property facts; features; approximate location; description; document-claim note; advertiser card and badge definitions; report/share; sticky Call, WhatsApp (if opted in), Message, Request viewing.
- **Business behavior:** only published active listings appear in search. Saved users can still open unavailable entries with clear banner. Contact CTA hidden for suspended advertiser/listing; a pending request is not confirmation. If an agency agent is assigned, route inquiry to agency-owned queue with assigned responder.
- **Validation:** no “Verified ownership” label solely from ID check; no route-pin reveal for owners selecting approximate location; price must have structured currency and transaction meaning.
- **States:** missing/deleted property → explanatory page and return to results; stale listing → ask advertiser availability refresh; broken image → gray placeholder without collapsing layout.

### P-04 Listing Wizard / Edit

- **Steps:** 1 role & property category; 2 sale/rent/gharawi; 3 location/privacy; 4 attributes; 5 structured pricing; 6 image upload; 7 contact/availability; 8 review & submit.
- **Fields depend on type:** land has area/title and optional frontage; apartment has floor, total floors and lift; commercial has access/fit-out; new projects have units only in V2. Rental terms separate monthly rent/advance/maintenance; gharawi separates lump sum, monthly additional rent if any, duration/refund notes, currency.
- **Form UX:** autosave locally and on server after successful authentication; never create duplicate records on back navigation; photo queue supports retry per item; show estimated upload size. Unauthorized agent sees permission explanation.
- **Lifecycle:** draft is private; submit → review; material edits to published copy create pending revision and preserve previous public version until approved; user may pause instantly; reject with reason and editing option.

### P-05 Favorites / Saved searches / Comparison

- **MVP:** save/unsave property in one tap; guests are asked to log in only when they try to save; restore the desired save after sign-in; filter saved list by availability. **V1.1:** save search, opt-in alerts, up to 4-item comparison; same unit and currency rules; export/share link explicitly consent-based.
- **Empty state:** “No saved properties yet” with Browse action; if all saved became unavailable retain history instead of silently deleting.

### P-06 Inbox / Inquiry Detail

- **Inquirer:** one thread per listing + conversation participant pair (or explicit new thread after closed); masked contact information where possible; no automatic transfer of phone numbers to unrelated agencies. Messages carry read indicators only where enabled; reply may be draft-offline.
- **Advertiser:** show property, seeker message, time, channel, assigned agent, status. Owner can close; agency manager can reassign. A paid plan cannot access messages unrelated to its own properties.
- **Safety:** abuse reports, spam controls, blocks; messages do not serve as legal binding sale contracts.

### P-07 Viewing Request

- **Requester:** choose 2–3 suggested local time slots; include optional note; submit with local timezone Asia/Kabul. Request remains Pending until advertiser confirms.
- **Advertiser:** Confirm, Propose new time, Decline; confirmations notify both parties. Double confirmation conflict uses server transaction; advertiser availability is not inferred from an external calendar.
- **Cancel:** either side may cancel; canceled requests remain in history; listing becoming inactive prompts appropriate update to pending requests.

### P-08 Public Advertiser / Agency Profile

- **Display:** public business or user display name, advertiser type, *specific* verification badges and last-reviewed date, service city, optional phone/WhatsApp, response-time indicator only with adequate sample size, active listings. Do not show private ID files, verification documents, or home addresses.
- **Action:** view all listings, send inquiry (if enabled), report profile. Agency membership does not mean every listing is “ownership verified”.

### P-09 Advertiser Dashboard

- **At a glance:** inquiries needing reply, viewing requests, active/pending/paused listings, stale inventory, publication warnings; one Create Listing CTA. Summary view metrics clearly state timeframe and meaning.
- **Operations:** listing filters Status/Transaction/Assigned (when agency), lead statuses New/Contacted/Viewing/Closed, quick update availability, edit details, hide/pause, see history. Avoid showing charts for metrics with no data.

### P-10 Agency Workspace (mobile)

- **Overview:** first fold contains New leads, Unassigned, Pending viewings, Expiring listings, and Create/Assign actions; select agency context when memberships >1.
- **Properties:** compact list with thumbnail, status, assignee, last confirmation; managers can reassign while agents only edit assigned ones. Bulk disable requires confirmation.
- **Leads:** ownership, assignment history, notes (private internal to agency), status; owner/manager can export only authorized agency data. At mobile width, cards not multi-column tables.
- **Team (V1.1):** invite by verified account contact; role manager/agent; prevent removing final active agency owner; suspended member loses access immediately.
- **Reports (V1.1):** listing views, unique inquiries, contacts, response time, verified conversion events only; explain difference between app-captured leads and external WhatsApp follow-up.

### P-11 Admin Web — Moderation & Verification

- **Desktop:** secure sidebar with stable nav; work queues (Pending, Reported, Appeals, Duplicate suspected, Stale). Table filters/status tabs at top, preview panel on selection, side-by-side submitted/current revision and evidence.
- **Action:** Approve / Reject with category-coded reason; Hold for additional proof; Pause for high-risk fraud; Send to verification staff; restore with audit. Never expose private documents to ordinary moderators.
- **Concurrent review:** version/lock token prevents two reviewers applying incompatible decisions. Clearly show assignment, reviewer, timestamp and the reason. Administrators must be able to audit overwritten/removed records.
- **Empty state:** show queue cleared with filter controls, not pointless dashboards.

### P-12 Admin Web — Billing / Promotions

- **Separate money from content:** verify a platform subscription payment, not a property deposit. Present invoice, claimed payer, amount, currency, paid-via, evidence, admin decision and audit. Manual approval is a platform-entitlement process only; it never implies ownership or real estate payment verification.
- **Promotion:** date window, target placement, disclosure label, quota, start/end, pause/refund policy. Promotion slot may not place disallowed listing in results.

## 23. Navigation System

**Mobile persistent bottom tabs (5):** Explore, Search, Saved, Inbox, Account. On every tab: selected state prominent, previous scroll/filter state retained, deep-linked child routes return to their originating tab. On phones <360 px, short localized labels with icons. For guests, Inbox/Saved use contextual login prompts only on action; browsing does not require login. No duplicate nested bottom bars.

**Role switch:** Account → “Manage my properties” or “Agency workspace” opens a full-screen *workspace context*, with clear Back to Marketplace; it does not replace the five consumer tabs. Agency has subnavigation Overview / Properties / Leads / Team / More. Show Team only to manager/owner. **Admin:** web-only; no staff admin tab in the consumer app. Administrators may have ordinary consumer accounts, but privileges must be separately authenticated.

## 24. Primary User Journeys

| Journey | Trigger → steps → decision → success | Failure & recovery |
|---|---|---|
| Find apartment for rent | Explore → Rent → Kabul/neighborhood → rent range → results → detail → Call/Message | No results → relax one filter; listing expired → nearby alternatives |
| Find gharawi | Explore → Gharawi → principal min/max → property → read refundable amount + any monthly rent + terms → request viewing | Missing terms → listing cannot publish, ask advertiser to complete |
| Guest to registered saver | Tap heart → auth prompt → phone/email verify → original card auto-saved | OTP delayed → resend cooldown, preserve intent |
| Post private property | Verify contact → create wizard → photo(s) → preview → submit → moderation → published | Missing proof/photo → draft preserved; rejection gives reason/correct action |
| Agency inquiry | Seeker asks → organization queue → manager assigns agent → agent replies → appointment → outcome | Unassigned warning; reassigned agent gets access, old loses access |
| Confirm viewing | User requests windows → advertiser confirms one → both notified → appointment completed | Time conflict triggers proposal; avoid false “Booked” confirmation |
| Report scam | Report menu → reason + evidence → case → assigned moderator → result / appeal | Abuse of reports rate-limited; reporters do not see private investigation |
| Upgrade subscription | Agency owner → plan → invoice → local payment/manual proof → billing officer verification → active entitlement | Incorrect proof → Pending/Rejected; no access until confirmed |
| Edit approved listing | Advertiser saves significant changes → pending revision → reviewed → public snapshot updates | Failed review retains old public version; cancellation safe |
| Close listing | Advertiser marks Sold/Rented → removed from active results; saved users see status | Incorrect close → authorized reactivation via review |

## 25. Feature Specifications

**F-01 Location & geography (MVP).** Input: country Afghanistan fixed, province/city/district/neighborhood, optional geocoordinates and precision mode. Output: standardized label + search index. Validation: hierarchical parent/child, no unknown province, optional “Unlisted neighborhood” free text pending normalization. Permission: editor of listing. Data: Location, Aliases, GeoPoint. Edge: repeated names, different spellings, incomplete maps. Analytics: `location_selected`, `location_autocomplete_no_match`.

**F-02 Structured listing (MVP).** Input: category, transaction, condition, price fields, dimensions, photos, contact, location, optional document claim. Output: Draft or Pending Review. Rules: only authorized advertiser may submit; role and field dependencies enforced on server; image safety scans; immutable revision history. Notifications: review decision. Edge: retry, double submit, quota, title edits. Events: `listing_draft_created`, `listing_submitted`, `listing_published`.

**F-03 Search and discovery (MVP).** Input: query/place, type, transaction, price, size, features, sort. Output: paginated published-and-available results plus optional count. Rules: rank relevant results before sponsored insertions; no private drafts; enforce expiry, regional synonyms. Edge: missing map, unexpectedly zero results, no location permission. Events: `search_executed`, `search_no_results`, `filter_applied`, `listing_opened`.

**F-04 Media (MVP).** Photo upload and gallery; portrait/landscape normalization; primary cover; max 20 images and one short video *proposed limit*; client compression plus server MIME verification, metadata stripping where safe, signed uploads; retry individual files; placeholder for unsupported video. AI image enhancements excluded from MVP. Event: `listing_media_uploaded`.

**F-05 Seller contact (MVP).** Call, WhatsApp, internal inquiry; advertiser chooses enabled channels. Calls are external actions, not guaranteed conversations. WhatsApp deep links encode only permitted public contact; track tap counts, never infer a completed sale. In-app messages stored only between authorized parties; abuse/report controls. Events `contact_call_tapped`, `contact_whatsapp_tapped`, `inquiry_sent`.

**F-06 Viewing request (MVP).** Proposed times, notes, confirmation/decline/reproposal; server timezone Asia/Kabul; dedupe request IDs; no auto-confirm. Notifications to relevant parties, cancel consequences. Events `viewing_requested`, `viewing_confirmed`, `viewing_cancelled`.

**F-07 Trust & verification (MVP).** Separate checks: verified contact, verified human/business identity, agency registration checked, listing authorization evidence examined, physically inspected listing (future). Every badge names its scope. Backend records checker, method, result, time, expiry, evidence retention. False documents or repeated reports trigger manual escalation. Never publish full ID/title documents.

**F-08 Moderation/reporting (MVP).** Pre-publication review for new private advertiser and risk-scored other listings. Report reasons: false price, inaccurate detail, unavailable, duplicated, impersonation, inappropriate image, suspected fraud. Reports form an internal Case; high-risk can pause listing pending review; uploader has appeal route. Events `report_submitted`, `listing_moderated`, `appeal_resolved`.

**F-09 Favorites and alerting.** MVP save/unsave properties and in-app availability updates. V1.1 save a structured search, matching new-listing alerts, price-drop notifications. Notifications deduplicated and subject to rate limits; search query privacy protected. Events `property_saved`, `saved_search_created`, `saved_search_alert_opened`.

**F-10 Agency operations (MVP core, V1.1 full).** Scoped organization, team ownership, assigned listing, assigned inquiries, lead pipeline, internal notes, auditable transitions; team invites and advanced reporting later. Permission evaluated by agency membership + specific resource assignment, not just role string. Events `lead_assigned`, `lead_status_changed`, `agency_member_revoked`.

**F-11 Pricing and promotion (V1.1).** Subscription entitlements for listing count, user seats, and analytics; featured slot purchased separately; AFN invoices/manual proof process initially. Allow offline payment evidence where locally feasible; staff verifies *platform fees only*. Events `invoice_created`, `payment_claim_submitted`, `entitlement_activated`, `promotion_started`.

**F-12 Market intelligence (V2).** Display descriptive statistics from *our own* listing snapshots; label median *asking price*, sample count, coverage and window, not “sale price”. Minimum sample threshold is configurable; outlier/range controls; no Zestimate-style automated valuation before verified transaction data. Events `market_insight_opened`.

**F-13 Shared shortlist (V1.1).** Invitation-based group of max 5 users (proposal); one owner manages invites; members vote/annotate listings, privacy defaults to invite only. Revocation removes access promptly. Never expose personal shortlist to advertiser.

**F-14 Developer projects (V2).** Project overview, building blocks, units, floor, price-from with disclaimer, delivery-stage label, inventory updates, lead attribution; publisher account requires additional developer verification.

**F-15 AI assistance (V2 experiment only).** Optional assisted descriptions and translation reviewed by advertiser; grounded semantic query parser only when cost and accuracy acceptable; no AI legal-title or pricing certification.

## 26. Business Rules

The following numeric settings are **initial proposals**, admin-configurable and subject to validation. Rules apply server-side.

| ID | Rule |
|---|---|
| RULE-001 | Afghanistan is the only supported country; no foreign properties accepted. |
| RULE-002 | Public searches, detail pages and agency profiles can be viewed without registration. |
| RULE-003 | A verified contact channel is mandatory before first listing submission; identity checks may be escalated by risk. |
| RULE-004 | Users retain seeker privileges when assigned a professional role. |
| RULE-005 | Roles inside an agency grant access only in that agency and to explicitly assigned resources. |
| RULE-006 | Every listing has one accountable publishing entity (person OR agency) and may have an assigned agent. |
| RULE-007 | One property can have multiple authorized advertisers, but duplicate detection flags likely duplicates; never auto-delete valid independent submissions. |
| RULE-008 | A listing has one principal transaction type. Gharawi is not treated as a synonym for generic sale or rent. |
| RULE-009 | Every price must store amount, currency, intended charge type, and display original amount; conversion is optional/explicit and timestamped. |
| RULE-010 | Gharawi must store refundable principal; recurring rent (including zero) must be explicit; duration/refund text shown to user. |
| RULE-011 | Land uses area fields; bedrooms should not be required for land. |
| RULE-012 | Published residential location may be approximate by advertiser choice; precise coordinates remain private when hidden. |
| RULE-013 | New private-user listings require moderation before appearing publicly. |
| RULE-014 | Major edits to published listing create reviewable revision and retain approved snapshot until approval. |
| RULE-015 | Published listings can be paused instantly by advertiser or staff; they disappear from active search immediately. |
| RULE-016 | Proposed free capacity: 3 active private listings; professional tiers have plan-defined limits. Drafts/archived excluded from active cap. |
| RULE-017 | Proposed confirmation cadence: availability confirmation requested every 14 days; unconfirmed after 30 days auto-pauses pending review. |
| RULE-018 | A dismissed/expired listing cannot be promoted or receive new inquiries. |
| RULE-019 | Users see date/time of last advertiser confirmation, not “verified” merely because recent. |
| RULE-020 | Sponsored listings have a prominent Sponsored label and cannot bypass status/moderation filters. |
| RULE-021 | Guest calls require rate control/anti-scraping; guest messaging requires sign-in. |
| RULE-022 | Viewing request starts Pending; only advertiser confirmation marks Confirmed. |
| RULE-023 | A confirmed viewing cannot be edited silently; a new time requires explicit agreement. |
| RULE-024 | Agency owner cannot remove or deactivate the last eligible agency owner without verified ownership transfer. |
| RULE-025 | When an agency member is revoked, all agency access ends immediately and outstanding assignments go to a manager queue. |
| RULE-026 | Internal agency notes are invisible to shoppers and former members. |
| RULE-027 | Agency billing can be changed by agency owner or designated billing administrator, never by general staff agent. |
| RULE-028 | Subscription expiration retains existing data readable to allowed users, disables over-limit creates/promotions, and does not erase listings automatically. |
| RULE-029 | Payment claim Pending is not Paid; entitlement activates only after confirmed payment or valid trial/credit. |
| RULE-030 | Platform never accepts a property's sale price, buyer deposit or gharawi principal as an MVP payment. |
| RULE-031 | Verification badge text must specify contact, agency or listing-authorization scope; no verified legal-title promise. |
| RULE-032 | Submitted IDs and ownership papers are staff-only, encrypted and never attached to a public listing. |
| RULE-033 | Each moderation action records actor, action, reason, target version and timestamp. |
| RULE-034 | Reports do not automatically establish guilt; urgent risk may hide listing pending review. |
| RULE-035 | User-generated content may be appealed once per decision; support may reopen with new evidence. |
| RULE-036 | Soft deletion/archiving preserves records needed for fraud investigation within stated retention policy; public display stops. |
| RULE-037 | Notifications obey consent preferences and are deduplicated; safety/account-critical notices may be mandatory where lawful. |
| RULE-038 | Price history reflects observed *listing changes*, not recorded transactions, unless transaction evidence exists. |
| RULE-039 | No automated “neighborhood safety”, “legitimate title” or property market price guarantee without validated evidence. |
| RULE-040 | Same user's retries of create/payment/lead actions must be idempotent. |
| RULE-041 | Default UI language is Dari; users may select Pashto/English at any time; direction switches correctly. |
| RULE-042 | Default date storage UTC; display Afghanistan local time, and date calendar selected by language/preferences. |
| RULE-043 | Admin actions require staff authentication; sensitive privileges require MFA and audit. |
| RULE-044 | Search relevance prioritizes matching area, intent, live availability and freshness ahead of raw advertiser spend. |
| RULE-045 | Images and phone numbers must not be made bulk-exportable by unauthenticated callers. |

## 27. State Systems

| Entity | States and legal transitions | Initiator / consequence |
|---|---|---|
| Listing | Draft → Pending Review → Published → Paused → Published; Published → Rented/Sold → Archived; Pending → Rejected → Draft; Published → Expired → Paused | Advertiser submits/pauses/closes; moderator approves/rejects; timer expires. Pausing public visibility immediate. Re-publish may require review. |
| Listing revision | Draft → Submitted → Approved/Rejected/Withdrawn | Approved atomically replaces published snapshot; original continues while revision pending. |
| Verification | Not Started → Submitted → In Review → Approved/Rejected/Needs More Evidence → Expired | Verification officer with audit; badge disappears on expiry. |
| Inquiry | New → Open → Responded → Closed/Blocked | Participant or agency member; cannot access after assignment revoked. |
| Viewing | Requested → Confirmed/Counterproposed/Declined/Cancelled → Completed/No-show | Only advertiser confirms; cancellation notifies other party. |
| Lead | New → Contacted → Viewing → Negotiating → Won/Lost/Archived | Agency workflow; “Won” self-reported, not verified sale. |
| Agency member | Invited → Active → Suspended/Revoked | Owner/manager within authority; immediate revocation. |
| Subscription | Trial/Inactive → Pending Payment → Active → Grace → Expired/Cancelled; Active → Suspended | Billing officer/system; entitlement recomputed transactionally. |
| Payment claim | Draft → Submitted → Reviewing → Confirmed/Rejected/Refunded | Billing officer; no auto-confirm from file upload. |
| Fraud case | Open → Triaged → Investigating → Resolved/Rejected → Appealed → Closed | Moderator/appeals staff; preserve review evidence. |
| Promotion | Draft → Awaiting Payment → Scheduled → Live → Ended/Paused/Cancelled | Only for approved active listing and active entitlement/payment. |

**Terminal vs reversible:** Sold/Rented can be returned to Active only via explicit advertiser action and may undergo moderation; irreversible hard-delete is not a user-facing action while retention obligations apply. “Won” lead does not mechanically mark a listing Sold without owner confirmation.

## 28. Conceptual Data Model

| Entity | Critical attributes / relationships / indexes |
|---|---|
| User | ID, display name, locale, phone/email verification, status, created timestamps; unique normalized contact; 1:N sessions/listings/favorites |
| Session / Verification challenge | Session ID, device, token fingerprint, expires, revoked; OTP challenge hash, channel, attempts, cooldown |
| Organization (Agency) | ID, name, localized names, province/city, verification state, public profile; 1:N members/listings/invoices |
| Membership | organizationId, userId, role, state, join/invite dates; unique active scoped membership; indexes by organization and user |
| Property | Canonical physical asset optional, local property category, general location, geometry precision; can have multiple listing records when allowed |
| Listing | Advertiser ID/type, assigned member, property fields, transaction type, status, published snapshot/version, confirmedAt, expiresAt, moderation state; indexes on location/type/status/date/price |
| ListingRevision | listingId, version, proposed attributes, review status, reviewer, reason, changedAt; immutable once decided |
| PropertyDetails | Size m² (base), displayUnit, bedrooms, bathrooms, floors, utilities, amenity codes, age/condition as applicable |
| ListingPrice | listingId, amount/currency, chargeType: sale/rentMonthly/depositRefundable/advance/maintenance, negotiable flag, optional FX snapshot |
| Location | Hierarchy province→city/district→neighborhood, local spellings/transliterations, optional geometry; GIST index for geography |
| Media | listingId, storage key, content type, size, width/height, order, status, validation result; no public credentials |
| ContactPreference | advertiserId, allowed channels, display/masked phone, preferred time and consent |
| AgencyAssignment | listingId or leadId, userId, assignedBy, assignedAt, revokedAt; enforce membership |
| Favorite | userId, listingId, savedAt; unique pair |
| SavedSearch | userId, normalized filter JSON, area, notification cadence/state; index by user |
| Conversation / Message | participant IDs, listingId, scope organizationId, message body, reported/blocked state, timestamps; query by participant |
| Inquiry / Lead | listingId, seekerId, agencyId, status, assignee, source/channel, lastResponse, privacy scope |
| ViewingRequest | inquiryId, proposed time choices, confirmed slot, status, notes, actor and event timestamps |
| VerificationRecord | subject type/id, method, evidence refs, result, reviewer, expiry, encrypted evidence; audit-required |
| ModerationCase | target, reason, evidence, severity, status, reporter, assignee, decision, appeal link |
| AuditEvent | immutable actor/action/resource/version/time/request ID/justification; search by resource/actor/time |
| Plan / Entitlement | plan code, seat/listing limits, feature flags, effectiveFrom/to, organization/user owner |
| Invoice / PaymentClaim | amount AFN, invoice items, claim method, evidence refs, reviewer, status, transaction IDs |
| Promotion | listingId, placement, start/end, spend/entitlement, sponsorship label, state |
| Notification / Delivery | recipient, event ID, channel, status, payload ref/deep link, dedupe key, readAt |
| AnalyticsEvent | pseudonymous actor, event, coarse location, resource type, time; avoid storing private documents |
| Catalog/Alias | categories, amenities, localized labels and location synonyms, status/version |

**Key relationships:** User 1→N Listings; Agency 1→N Memberships; Agency 1→N Listings; Listing 1→N Revisions/Media/Prices/Inquiry; Inquiry 1→N Messages and 0→N ViewingRequests; User N↔N Listing via Favorites; VerificationRecord points to User/Agency/Listing authorization. A `Property` is an optional deduplication anchor; **never merge distinct listing ownership histories on image similarity alone**.

## 29. API / System Capabilities

Representative endpoints define capability, not an immovable REST design. All writes: authenticated actor, validated payload, resource-scoped authorization, rate limits and idempotency where applicable. Pagination via opaque cursor; standard errors include `code`, localized `message`, `requestId`, and safe details.

| Domain | Representative API surface | Auth / key checks |
|---|---|---|
| Auth | `POST /v1/auth/register`, `/login`, `/verify`, `/refresh`, `/logout`, `/recover`; `GET /v1/me` | Contact verified/attempt limits/session binding |
| Public search | `GET /v1/locations`, `/properties`, `/properties/:id`, `/agencies/:id` | No auth; only published safe projection |
| Upload | `POST /v1/uploads/initiate`, `/finalize`, `DELETE /v1/uploads/:id` | Ownership, MIME, size, scan and quota |
| Listings | `POST /v1/listings`, `PATCH /v1/listings/:id`, `POST /v1/listings/:id/submit`, `/pause`, `/confirm-available`, `/close` | Owner/assignment; expected version and idempotency |
| Favorites | `GET/POST/DELETE /v1/favorites`, `GET/POST/PATCH/DELETE /v1/saved-searches` | Current user only |
| Messaging | `GET/POST /v1/conversations`, `/messages`, `POST /v1/messages/:id/report` | Participant or scoped agent membership |
| Inquiry | `POST /v1/listings/:id/inquiries`, `GET/PATCH /v1/inquiries/:id` | Published contactable listing; recipient scope |
| Viewing | `POST /v1/inquiries/:id/viewings`, `POST /v1/viewings/:id/confirm|counter|cancel|complete` | Actor-specific transition rules |
| Agency | `GET/POST /v1/agencies`, `/members/invite`, `/assignments`, `/leads`, `/reports` | Organization owner/manager/assigned agent |
| Verification | `POST /v1/verifications`, `GET /v1/verifications/mine`; admin decision | Evidence private, consent, scoped reviewer |
| Reports | `POST /v1/reports`, `GET /v1/reports/mine`, admin triage and appeal | Anonymous limited; abuse protection |
| Billing | `GET /v1/plans`, `/invoices`, `POST /v1/payment-claims`; staff `/confirm|reject` | Agency owner/billing officer, never ordinary seeker |
| Promotion | `POST /v1/promotions`, `GET /v1/promotions/mine` | Active listing and paid entitlement |
| Admin | `/v1/admin/review-queue`, `/decisions`, `/users`, `/agencies`, `/audit`, `/catalogs` | Dedicated staff auth, RBAC/MFA, reason code |

**Representative contract examples:**

- **`POST /v1/listings`**: body `{clientRequestId, propertyType, transactionType, locationId, locationPrecision, prices[], attributes, contactPreferenceId}`. Validates location hierarchy, currency/price kind, fields conditional on category; returns `201 {id,status:'draft',version}` or `409 DUPLICATE_REQUEST`, `422 VALIDATION_ERROR`, `403 NOT_VERIFIED`.
- **`POST /v1/listings/:id/submit`**: `If-Match` current version; checks minimum media/content/quota; returns `202 {status:'pending_review'}`; one request ID cannot submit duplicate versions.
- **`GET /v1/properties`**: query `intent,placeId,q,type,minPrice,maxPrice,currency,features[],sort,cursor,limit,geoBounds`; only active public data. Returns `items,nextCursor,appliedFilters,approximateTotal`, not private pins.
- **`POST /v1/inquiries`**: requires live listing and permitted contact; validates 1–2000 character message, block state; returns conversation/inquiry ID, not personal phone by default.
- **`POST /v1/viewings/:id/confirm`**: actor must own assigned advertiser resource; supplied slot must belong to open proposed set; conflict returns `409 TIME_NOT_AVAILABLE`.
- **`POST /v1/admin/listings/:id/approve`**: reviewer scope, revision ID, decision reason and optimistic lock; response published snapshot hash, audit event ID; race returns `409 REVIEW_CONFLICT`.

## 30. Third-Party Services

| Capability | Development/low-cost option | Production choice / limitation | Data and regional caveat |
|---|---|---|---|
| Maps | OpenStreetMap data + local development map style | Commercial/self-hosted tile provider licensed for expected volume | OSM attribution mandatory; public OSM tile servers prohibit bulk/offline prefetch [S20–S21]. |
| Geocoding | Controlled Afghanistan place catalog with aliases | Licensed geocoder or own gazetteer for known locations | External address data coverage must be tested by province |
| Media storage | S3-compatible object storage with dev bucket | Managed object storage + CDN/thumbnail processor | No document IDs in public CDN; separate private vault |
| Phone OTP | Email verification during pilot if reliable | Contracted Afghan SMS/OTP provider **only after confirmed delivery tests** | Provider availability, local pricing and sender rules unverified |
| Email | SMTP relay test account | Region-accessible transactional provider | Watch delivery reliability/blocked domains |
| In-app messaging | Backend DB + polling | WebSocket or event updates as needed | Store only necessary content, protect access |
| Push | Local in-app notifications in Expo Go | Expo Push + FCM/APNs in development builds | Remote push does **not** work in Android Expo Go from SDK 53 [S22]. |
| Payments | Manually confirmed AFN payment proofs/invoices | Domestic payment integration after provider due diligence | Do not assume Stripe, cards, or wallet API acceptance in Afghanistan |
| Monitoring | Structured logs and crash capture | Hosted error tracking, uptime checks | Remove phone/document identifiers from telemetry |
| Analytics | First-party event table | Privacy-conscious product analytics | Avoid third-party ad tracking at MVP |
| Search | PostgreSQL + trigram/full-text/geospatial | Dedicated engine only when justified | Unicode normalization for Dari/Pashto, transliteration and synonyms |
| AI | None required | Optional paid assisted copy/translation in later release | Human review, cost ceilings and privacy restrictions |

## 31. AI Architecture (deferred)

**MVP: no generative AI dependency.** V2 experiment: AI-assisted rewriting of advertiser-provided text and cross-language translations. Pipeline: original submitted text → PII filtering → model prompt with *only provided fields* → structured output `{language,description,detectedUnsupportedClaims[]}` → schema validation → factual consistency checks → user preview/edit → stored revision. Must not invent bedrooms, area, legal status, neighborhood safety, market value or provenance. Optional natural-language search maps validated user query into structured filters and always shows editable parsed chips; fallback to normal search on failure. Rate-limit by user and plan, budget cap, cache identical public descriptions, allow opt-out and log version without storing raw identity documents.

## 32. Automations

| Trigger / timing | Condition | Action | Failure / idempotency |
|---|---|---|---|
| Listing published | Reviewed and approved version | Index search + notify followers | Event outbox; retries; exact-once user-facing ID |
| Daily freshness job | Published, last confirmation ≥14 days | Reminder to advertiser | Deduplicate per listing/window; keep history |
| Daily expiry job | No confirmation ≥30 days | Mark expired/paused and remove from active search | Retry on index lag; log effective time |
| Listing price update | Approved meaningful decrease | Notify eligible saved users | Debounce rapid edits and normalize same currency |
| New agency inquiry | Not assigned | Notify agency manager + add unassigned queue | No duplicate lead even after network retry |
| Viewing confirmed | Time valid and request pending | Update status and notify both | Transactional state update prevents double-confirm |
| Payment claim submitted | Valid invoice in unpaid state | Billing review queue | No entitlement until review |
| Subscription window ends | Expiry due | Recompute plan entitlements, pause promotions | Preserve data; retry safely |
| Fraud severity critical | Triaged high-risk case | Temporarily hide listing and escalate | Human review; audited and appealable |
| Deleted account requested | Confirmed ownership + waiting period | Revoke sessions, unpublish listings, schedule retention processing | No silent erasure of fraud/legal records |

## 33. Notification System

| Event | Recipient | In-app | Push | Email/SMS | Priority |
|---|---|---|---|---|---|
| Inquiry received / reply | Advertiser / seeker | Yes | Opt-in after V1.1 | Fallback only with consent | High |
| Viewing request / confirm / change / cancel | Both participants | Yes | Opt-in | Optional reminders | High |
| Listing approval/rejection | Advertiser | Yes | Opt-in | Email if available | High |
| Availability confirmation due | Advertiser | Yes | Opt-in | Rate-limited | Medium |
| Saved-search match / price reduction | Search owner | V1.1 | Opt-in | Opt-in digest | Low |
| Agency member invite / revoke | Affected member | Yes | Optional | Email/phone | High |
| Payment decision / subscription expiry | Account billing owner | Yes | Optional | Email/phone | High |
| Security event (password/MFA) | Account holder | Yes | Optional | Verified channel | Critical |
| Case resolution / appeal | Reporter/advertiser | Yes | Optional | If opted in | High |

**Rules:** per-user category preferences; notification deep links; read/unread + cursor pagination; link fallback if target deleted; high-volume search alerts batched to max daily digest by default; quiet hours configurable; cross-device duplicate suppression; no sensitive contract/document content in push previews.

## 34. Search, Filtering, and Sorting

**Full searchable fields:** title, localized category, advertiser-safe description, city/district/neighborhood and aliases; no private document text, internal notes or exact hidden address. **Filters:** transaction (Buy/Rent/Gharawi), residential/commercial/land, subtype, province, city, neighborhood, price range + currency, m²/jerib area, bedroom/bathroom counts (where valid), furnished, parking, electricity, water, condition, advertiser type, currently available, published/confirmed recency, verified advertiser/agency if explicitly scoped. **Sort:** Relevance default; Newest approved; Price low-high/high-low within same unit/currency; Recently confirmed. Sponsorship is a distinct labeled insertion policy.

**Comparison semantics:** structured gharawi principal **not** compared with monthly rent; rent price filter targets monthly rent while advance/gharawi have separate dedicated controls. Currency conversion never merges mixed prices unless user selects an explicitly labeled approximate FX view with timestamp and provider. **Search indexing:** normalize Arabic/Persian Yeh/Kaf variants, punctuation, digits; preserve display originals; support common Kabul neighborhood aliases. **Pagination:** stable cursor; client limits 20 cards/page proposal; map fetch bounded to viewport and zoom, clusters. **No results:** show active filters and “Remove filter X” choices; never silently widen geographic scope.

## 35. Mobile-First Experience

- Primary target: 320–430 CSS dp-equivalent phone widths; min ~44dp touch targets; readable Persian/Pashto fonts and LTR number runs for phone numbers.
- Single column feed, image-first 4:3 cards; filters in full-height sheet with sticky Apply; no horizontal scrolling on page body; horizontal chips may scroll with discoverable fade.
- Bottom nav pinned respecting safe areas, but hidden in immersive gallery and full-screen listing wizard as appropriate. Actions not only hover-based.
- Android hardware Back closes sheet → child page → originating tab; should not drop search state unexpectedly.
- Image loading uses blur/placeholder and modern compressed formats; show upload progress and retries without discarding typed text.
- Offline: cached recent public listings marked “Last updated”; saved content readable locally if previously fetched; draft forms locally saved. Creating/modifying published data queues only safe idempotent requests, requiring confirmation after reconnection.
- RTL: grid order, back arrows, drawers, icons, calendar input and layout truly mirrored for Dari/Pashto; English LTR; store logical direction-independent values.
- Accessibility: button labels for heart/save, readable alt text, dynamic font sizes, announcements on async form success/failure.

## 36. Design System

**Visual personality:** credible, calm, high-contrast and photo-forward; distinct from Koor/Khaneh brand identity and visual composition. **Palette proposal:** deep navy `#14283A` for primary navigation, teal `#087E76` for actions, warm white `#F8FAF9` background, neutral `#66717B` secondary, positive `#16804D`, warning `#B7680A`, error `#B33636`. Sponsored placements use a text badge, not deceptive verification colors. Check contrast before acceptance; palette is a starting proposal, not a finished accessibility audit.

**Typography:** English: Inter or platform system sans; Dari/Pashto: modern readable Arabic-script family such as Vazirmatn, bundled/licensed and tested on actual Android devices. Responsive hierarchy: main 24–28sp, section 18–20sp, card title 16–18sp, body 14–16sp, caption ≥12sp where feasible. Allow 1.3–1.5× user text scaling without clipped cards. Distinguish Persian and Latin digit displays; keep phone numbers and URLs LTR.

**Spacing/elevation:** 4/8/12/16/24/32 scale, 12–16 corner radius cards, minimal shadow, 1px neutral borders, 16dp outer gutters, 12–16dp card padding. Avoid oversized home titles and repetitive hero subtitles. Use semantic property tags (Rent, Sale, Gharawi, New, Confirmed Available, Sponsored) with consistent meanings. Use full-screen skeletons only during first load, then local loaders for action feedback. Components: SearchField, ProvincePicker, PropertyCard, PriceBlock, TransactionBadge, VerificationTooltip, StatusPill, ImageGallery, AgentCard, FilterSheet, SortSheet, CurrencyDisplay, ViewingTimePicker, EmptyState, ErrorBanner, StepWizard, ConfirmationDialog, FeedbackToast, AccessibleTabBar.

**Responsive admin web:** ≥1200px sidebar + table + detail inspector; 768–1199px collapsed sidebar and reduced columns; <768px drawer navigation, filter sheets, condensed case cards and full-screen detail; no spreadsheet-sized tables spilling horizontally across mobile viewport. Admin supports Dari/Pashto/English and correct RTL layout.

## 37. Dashboard Design

| Dashboard | First-screen decisions | Prominent actions | Meaningful KPIs |
|---|---|---|---|
| Private owner | Is my property live? Did someone ask? | Publish / respond / update availability | Live listings, unread inquiries, viewing requests |
| Independent agent | Which prospects need answers today? | Reply / call / schedule / update status | Open leads, response time, active listings |
| Agency member | Which assigned inquiries are urgent? | Follow up / confirm viewing | Assigned open leads, unanswered queue |
| Agency manager | Which listings are stale/unassigned? | Assign staff, renew listing, resolve conflict | Time-to-first-response, 30-day lead count, active/fresh inventory |
| Agency owner | Does subscription capacity match business use? | Manage plan/team; review dashboard | Seats, listings, contacts, billing status |
| Administrator | Which records require attention? | Review suspected fraud, approve queue, inspect audit | Pending reviews, critical reports, verification backlog |

Never conflate **listing views**, **contact taps**, **actual communications**, and **completed sales**; label separate metrics. Zero metrics use “No activity yet”, not decorative sample charts.

## 38. Onboarding

**Visitor path:** Start on Explore immediately; language switch visible; city defaults Kabul with editable location. No mandatory location permission, contact permission, or complete profile questionnaire.

**New seeker:** action to favorite/message prompts account creation. Collect display name plus verified reachable phone *or* email; ask marketing preferences separately and default off. On first account, show a single optional checklist: choose city, transaction preference, set alert (later); user can skip. **New advertiser:** additional role activation after verified contact; show rules and first property wizard. **Agency:** begin separate organization application, business identity info, manager approval; do not allow self-declared “verified agency” without review. **Returning user:** restore intended action and chosen language, location, and most recent authorized workspace.

## 39. Authentication and Account

**Proposed auth:** local mobile number + OTP if provider is verified to work; password with verified email/phone as fallback, depending on actual provider reachability. Do not ship an OTP-only flow before validating delivery in Kabul/Herat. Enforce uniqueness by normalized channel and rate limits per contact/device/IP (with safety exceptions). Session management supports device revocation, expiry/rotation and suspicious-login notification. Agency/admin roles require stronger verification; admin web uses MFA mandatory. Password storage uses a proven salted adaptive hash if password auth enabled. Account deletion includes warning about live listings, invoices and pending fraud cases; delete or irreversibly pseudonymize eligible data under published retention policy. Never reuse an account identity across agencies without explicit membership authorization.

## 40. Billing and Monetization

**Model:** keep property discovery free; charge professional users for visibility and operations, not to contact owners. Prices below are **test hypotheses only**, not validated Afghanistan pricing.

| Tier | Illustrative entitlement | Hypothetical monthly AFN | Gate |
|---|---|---|---|
| Seeker | Browse, save, contact, report | Free | none for browsing |
| Private advertiser | 3 active listings, basic inquiry management | Free | Verified contact & review |
| Solo Agent | 15 active listings, lead statuses, basic metrics | 500 AFN | Agent approval + confirmed payment |
| Agency Standard | 50 active listings, 5 seats, assignment inbox | 1,500 AFN | Agency verification + confirmed payment |
| Agency Growth | 200 active listings, 15 seats, more analytics | 3,000 AFN | As above |
| Featured listing | One reviewed active listing in labeled placement window | 200–500 AFN per promotion | Paid, capacity and safety checks |

**Validation:** pilot 15–20 agencies, run willingness-to-pay questions, test 1–2 offers, estimate monthly agency contacts, keep zero-price pilot until meaningful value. **Lifecycle:** selection → invoice with AFN amount and clear validity → payment instruction → proof uploaded or provider callback → manual/API verification → entitlement active → renewal reminder → grace/expiry. **Fraud controls:** duplicate receipt hash, no self-review, finance audit, verification of actual receipt. **Downgrade:** retain listings and messages, preserve public records as allowed, stop newly created over-limit listings and paid boosts, give clear quota resolution plan. **Cancellation:** stop auto-renewal if enabled; current term remains active unless policy says otherwise; clear refund status. **No sale escrow / property-deposit wallet.**

## 41. Administration

**Modules:** Overview; Listings Queue (new/revisions/suspected duplicates/stale); Identity & Agency Verification; User/Agency directory; Reports/Moderation/Appeals; Geographic catalog; Subscription/Invoice/Payment review; Promotions and slot capacity; Support tickets; Staff and Roles; Audit; Health and background jobs; Policy/Notification settings. Each action includes actor, timestamp, reason and before/after state. Sensitive proof documents available to Verification Officers on need-to-know basis. Separation of verification, moderation, and money handlers. **Emergency unpublish** requires reason and audit. Admin cannot impersonate an end user without an approved, time-limited support workflow visible in logs. Export contains no private documents by default.

## 42. Settings

**Common:** Profile, language/script, number format, preferred province, currency display (original stored), notifications, privacy and contact visibility, session management, accessibility, support/report, legal terms, delete account. **Advertiser:** phone/WhatsApp consent, working hours, default location privacy, inquiry acceptance, availability reminders. **Agency:** public company info, address safe/optional, brand, team permissions, assignment rules, billing owner, plan and notices. **Admin:** moderation threshold, featured inventory cap, taxonomy, aliases, configurable time-to-stale, audit policy. Users do not see menus they are not entitled to use.

## 43. Security Requirements

**Threat model:** impersonated owners, duplicate/scam listings, mass scraping of phone numbers, private document leaks, compromised agency users, fraudulent payment proof, push link abuse, replayed mutations, moderator misuse.

- Backend checks ownership/agency scope for *every* read and write; never rely solely on hidden buttons.
- Password hashing and credential/token lifecycle per modern standard; secret keys isolated from source and logs; admin MFA; least-privilege roles.
- Rate limits / bot controls for login, contact reveal, mass searches, phone taps and report creation; suspicious activity reviewed, not automatically labeled criminal.
- File upload security: content sniffing, re-encode photos, anti-malware scan for files, upload size limits, signed URLs, private storage for ID/title documents, no executable content.
- Sanitize localized rich text, encode output, validate coordinates, guard injection and abuse; CSRF protections for cookie web sessions; HTTPS/TLS all services.
- Backups encrypted and restore-tested on a scheduled cadence; versioned database migrations; audit logs append-only protected from normal staff modification.
- Access revocation immediate after suspending agency member or deleting conversation permission; caches keyed to actor and organization.
- Critical action alerts, privilege elevation approvals, breach response plan, admin logs with content minimized.

## 44. Privacy and Data

**Minimum necessary:** identity/contact, public listing data, media, coarse coordinates and optional private precise location, verification documents if needed, inquiries, payment receipts (platform only), preference and audit events. Show why information is collected and who can see it at each form step. For private residences, default public pin **approximate**; exact address only shared intentionally and only with qualified contacts, if chosen. Do not reveal an owner's private home address or ID number. Phone numbers can be hidden until intentional call/contact, with advertiser's consent to public display.

**Policy to establish with local legal review:** consent, retention periods by data type, right to access/correct/delete where applicable, moderation appeal windows, document destruction schedule, analytics sharing, domestic and cross-border hosting implications. **Proposed starting retention review:** unpublished drafts 90 days after inactivity; expired promotions 2 years; normal messages 12 months after closure; high-risk reports/audit records longer only where justified; **not a claim of legal compliance**. Provide clear privacy notice in Dari/Pashto/English and export of user's own supported data.

## 45. Accessibility

Accessible color contrast (WCAG 2.2 AA as target), 44dp touch targets, semantic accessibility labels and roles, screen reader names for photo counts, buttons and statuses, readable large type, touch and keyboard-friendly forms, RTL announcements, captions/subtitles for uploaded video, reduced-motion preference, skip to meaningful content on admin web, proper form-error associations and focus placement. Validate using TalkBack and at least one supported iOS VoiceOver configuration before general iOS release.

## 46. Error Handling

| Failure | User-facing message/action | Preservation and retry |
|---|---|---|
| Offline at home | “You're offline. Showing saved information.” | Cached public data labeled with age; retry button |
| Search API timeout | “Could not load results. Try again.” | Keep query and filters |
| Listing removed mid-open | “This property is no longer available.” | Back to prior results and alternatives |
| Auth OTP expired | “Code expired. Request a new one.” | Retain phone/email, enforce cooldown |
| Upload fails halfway | “Photo 3 failed; retry this photo.” | Keep other photos/fields intact |
| Form validation | Field-specific explanation near control | Keep entered values and wizard step |
| Concurrent edit | “Listing changed elsewhere. Review changes.” | Diff and ask to resolve; no silent overwrite |
| Wrong agency scope | “You no longer have access to this listing.” | Drop sensitive cached view |
| Viewing conflict | “That time is no longer available.” | Reopen proposed times |
| Payment claim rejected | “Payment not confirmed. See reason or contact support.” | No entitlements; allow evidence correction |
| Map tiles unavailable | “Map isn't available right now. Show list.” | Filters/result IDs unchanged |
| Push permission denied | “You can still see alerts in Inbox.” | No recurring permission nag |

Errors must include support-safe request ID but not raw SQL, credentials, bucket names or internal stack traces.

## 47. Empty States

Search: suggested broader area / fewer filters. Saved: one clear “Browse properties” action. Inbox: “Your conversations will appear here.” Owner listings: “Create your first property listing.” Agency leads: “No inquiries yet; keep availability updated.” Admin queue: “Nothing requiring review.” Reports: “No submitted reports.” Billing: “No invoices yet.” Market analytics (later): “Not enough listings to calculate a reliable summary.” Each empty state identifies a useful action and must not display fabricated sample data as live content.

## 48. Analytics

**North star:** verified-qualified contacts per available listing in trailing 30 days (defined as unique inquiry thread or deliberate contact tap with duplication caps, never a verified transaction). **Acquisition:** installation→first search, first search→detail, listing submission activation by role. **Quality:** percent fresh-confirmed within last 14 days, ratio of rejected submissions, confirmed duplicates, unresolved reports by severity, invalid contact rates. **Marketplace:** unique active advertisers, active seeker sessions, listings by district/type, inquiry conversion rate, median inquiry response time. **Business:** paying agencies, agency churn, invoiced amount, confirmed collection, promotion utilization and advertiser retention. **Safety:** scam reports per 1,000 listing views, mean time to triage critical report.

**Event taxonomy:** `app_opened`, `language_changed`, `location_selected`, `search_executed`, `filter_applied`, `property_opened`, `contact_tapped`, `inquiry_sent`, `viewing_requested`, `viewing_confirmed`, `listing_submitted`, `listing_published`, `listing_availability_confirmed`, `listing_paused`, `report_submitted`, `agency_lead_assigned`, `invoice_created`, `payment_claim_submitted`, `subscription_activated`. For each event store a pseudonymous subject, role, event time, location only at coarse city/district, listing/agency IDs as permitted, referral source; no verification papers or raw message bodies.

## 49. Performance Requirements

**Targets for initial QA (proposed):** cached Explore first meaningful content within ~2 seconds under moderate 4G; median indexed search response <700ms server-side for pilot inventory; p95 search API <2.5 seconds; upload and map degrade gracefully under poor network; app bundle and photo sizes aggressively controlled; no blocking “splash loading” to hide failed API calls. Use paginated results, image CDN variants (thumbnail/detail), cache-control, SQL indexes on status/location/transaction/price/updatedAt, server request timeouts and bounded worker retries. Instrument real low-end Android devices and weak-connectivity conditions before declaring release-ready.

## 50. Critical Edge Cases

- **Duplicate property advertised by two authorized agencies:** flag as possible duplicate and group or annotate after review; do not delete one owner's evidence automatically.
- **Same image reused for scams:** image similarity is risk indicator; preserve human review.
- **Advertiser edits gharawi principal after user requests viewing:** preserve price snapshot in inquiry and show “price changed”.
- **Verified agency license expires or is withdrawn:** badge revoked; existing listings reviewed according to policy.
- **Agency agent leaves during active conversations:** access revoked, leads reassigned to manager queue, seeker thread continuity preserved.
- **Promoted listing becomes unavailable:** remove promotion from search immediately; refunds/credits per clear policy.
- **Payment proof submitted twice:** dedupe and report existing claim; no double entitlement.
- **Phone number transferred to new owner:** identity recovery challenge, stop account takeover via SMS-only assumptions.
- **App crashes during listing upload:** local draft + resumable per-asset state, no duplicate listing creation.
- **Calendar conversion mismatch:** all timestamps canonical UTC, Afghan local display and timezone, local day selected by explicit date input.
- **Illegal/inaccurate requested document uploads:** minimal collection, restricted access, retention/incident procedure.
- **False fraud report campaign:** reporter limits, evidence review, appeals, never auto-convict.
- **Unverified “sold” claim from agent:** label “advertiser reported sold,” not official registry transaction.
- **Sudden map provider quota failure:** search list remains usable.
- **Property across administrative boundary:** store locality identifiers and a precise internal geometry when available, but do not infer official district from an inaccurate map.
- **Very long mixed-script address:** wrap and preserve RTL/LTR bidi isolate without horizontally overflowing.
- **Hostile/abusive messaging:** block/report and controlled staff access; no blanket message public exposure.
- **Suspended user already authenticated:** server rejects new privileged actions, revokes token/session as required.
- **No photos supplied:** draft allowed but first publish requires one valid photo or documented accessible exception reviewed by staff.

## 51. Recommended Technical Architecture

**Practical, modular monolith:** Shared TypeScript contracts; React Native with Expo/Expo Router (Android prioritized), separate Next.js web admin, Node.js/TypeScript backend (e.g., Fastify or Express), PostgreSQL plus PostGIS, Drizzle ORM or comparable schema tooling. Managed S3-compatible storage for public media, distinct private document vault with signed read authorization; queue/outbox for notifications, media processing, freshness, audit and search indexing; optional Redis only when queue/cache scale demands it. First-party full-text/trigram search and PostGIS viewport queries; separate search service only after latency/volume evidence.

```text
apps/
  mobile/            # Expo app: marketplace + professional workspace
  admin/             # Next.js staff web portal, separate authentication context
  api/               # Modular TS monolith
packages/
  database/          # PostgreSQL schema, PostGIS queries, migrations
  contracts/         # Validated API types and shared business vocabulary
  localization/      # Dari / Pashto / English UI keys and formatting
  design-tokens/     # Cross-platform colors, typography, spacing
  config/            # Shared lint/typecheck/config contract
services (logical API domains)/
  auth, property-catalog, listings, search, media, agencies,
  inquiries, viewings, trust-and-safety, billing, notifications, analytics
```

**Environments:** local, staging, production; separate credentials and datasets. API public GETs cacheable only when safe; private/role-scoped responses `no-store`. Backups must be restorable; staff admin only HTTPS and MFA. **Map:** choose licensed/self-hosted tiles independent of Google billing assumptions; OSM is map *data*, not unlimited free production tile hosting [S20–S21]. **Push:** push requires a dev build rather than Expo Go [S22]. **Regional deployment:** validate network reachability, email/SMS delivery, latency and compliant hosting before selecting a vendor. **Trade-offs:** do not add microservices, external AI, online rent collection, or complex automated valuation in MVP; these introduce cost/regulatory/data dependencies without solving core adoption.

## 52. Project Architecture / Module Boundaries

- **Mobile slices:** `features/explore`, `search`, `listing`, `saved`, `inbox`, `viewing`, `account`, `advertiser`, `agency`, `settings`, `i18n`; shared accessible UI components and controlled API client.
- **API modules:** `identity-and-access`, `geo-catalog`, `property-inventory`, `search`, `media`, `relationships-and-inquiries`, `agency-workspace`, `verification`, `moderation`, `plans-and-payments`, `notification-delivery`, `audit-and-analytics`.
- **Non-negotiable interfaces:** server-authoritative listing state; event outbox for cross-module side effects; normalized price component schema; resource-scope authorization; revision-based updates; public response projection excludes private data.
- **Admin separation:** same backend capability family, separate web session audience and MFA, not a tab in mobile app.

## 53. MVP Scope — Complete Minimum Valuable Product

**Included:** guest Explore/Search/List/Map, property detail, sale/rent/gharawi, all-province catalog (Kabul data acquisition), account and verified contact, image uploads, private advertiser and basic agent listings, draft/review/publish/closed statuses, phone/WhatsApp contact + simple internal inquiry, viewing requests, favorites, basic advertiser/agency leads, basic verified agency presence, fraud reports/moderation/appeals, separate web admin, localizations, safe approximate location, notifications in-app, low-bandwidth/error states, audit and backups. **MVP quality threshold:** end-to-end trusted seeker-advertiser workflow works with real Kabul pilot inventory and actual responsive agents.

**Excluded:** AI valuation, mortgage tools, legal title certification, 3D scans, automatic rent collection, electronic property transfer, complex CRM, developer units, automated payments, school safety scoring, nationwide marketing, unrestricted public pin coordinates.

## 54. V1.1 Scope

Saved search alerts, room-labeled media, property comparisons (max 4 proposal), shared favorites/shortlists, robust agency team invites, lead assignment rules/response stats, subscriptions and featured placements with audited manual AFN payment, customer support tickets, enhanced reports, optional custom-drawn map regions with validated map provider cost, opt-in push in development builds.

## 55. V2 Scope

Developer/new project catalog with unit availability; anonymized market statistics with adequate sample size; richer agency CRM, appointment scheduling calendars, optional 360/3D tours via authorized media provider, property history of *listing changes*, experiment with assisted descriptions and localized natural-language search; optional payment API after local provider due diligence.

## 56. Future Scope

Contract/document collaboration with qualified legal professionals, property valuation **only when verified sale/rent transaction evidence is sufficiently available**, reliable neighborhood enrichment from licensed data, professional property inspection services, maintenance/rental operations after legal review, remote family collaboration, additional analytics products for agencies. Any online transaction or escrow service requires separate legal/regulatory architecture and explicit product authorization.

## 57. Implementation Phase Outcomes

These are **product delivery outcomes**, not Git/repository instructions. Phases may overlap in engineering work but each should have independently demonstrable acceptance criteria.

| Phase | Outcome / core screens & data | Dependencies | Acceptance criteria | Explicit exclusion |
|---|---|---|---|---|
| **1. Foundations** | Locale & RTL/LTR, shared design tokens, API contracts, geo catalog, environment, mobile tab skeleton, admin login shell | Product choices | All 3 languages render; Kabul selected by default; all provinces searchable; basic error/offline states | Real listing publishing |
| **2. Identity & scoped roles** | Guest mode, register/verify/recover, seller activation, agency association, RBAC, staff MFA | 1 | Guest browses; only verified authorized advertiser submits; cross-agency access tests pass | Payments |
| **3. Property inventory** | Listing wizard, media, price types incl. gharawi, review queue, publish/pause, public detail | 1–2 | Property draft→review→public; landlord can pause; essential price/location validation passes | Saved alerts |
| **4. Discovery & seeker experience** | Search/filter, map/list, favorites, calls/WhatsApp, profiles, visible badge definitions | 3 | Localized search, no false exact pins, search-state back navigation, no-result and map fallback | Auto valuations |
| **5. Inquiries & viewings** | Inbox, lead record, send/reply, viewing state, notifications in-app | 3–4 | Request/confirm/cancel works; no phantom confirmed booking; agency scope enforced | Live video calls |
| **6. Agencies & trust/safety** | Agency management basics, assignment queue, verification, moderation, reporting, appeals | 2–5 | All safety decisions audited; member revocation blocks access; duplicate candidates reviewable | Advanced CRM |
| **7. Pilot hardening / MVP release** | Performance, low-bandwidth, accessibility, legal copy, backup, security, 10+ Kabul agencies onboarding | 1–6 | User journeys complete; operational moderation staffed; tracked quality/freshness metrics | General nationwide paid ads |
| **8. Professional growth V1.1** | Full agency roles, saved alerts, comparison, subscriptions, verified manual payments, boosts, push dev build | 7 | No boost before payment; expired plan safe; opt-in alerts dedupe | Property escrow |
| **9. Data & developer V2** | Market insight proof, development inventory, staged AI experiment | Evidence/data after 8 | Every insight shows sample size/source, role scoping, validated AI claims | Unverified legal title prediction |

**Pilot success gate (proposed):** ≥10 signed-up Kabul agencies, ≥150 independently checked active listings, ≥80% have confirmed availability in prior 14 days, regular customer inquiries, fraud queue staffed, no critical cross-agency exposure. These are **go/no-go testing hypotheses**, not market projections; revise based on reality.

## 58. Test Requirements

**Required categories:** domain-rule unit tests, UI component tests (RTL/LTR), API schema/authorization, database migrations, messaging integration, web moderation workflows, Android device E2E, iOS parity smoke, push development build, search/map fallbacks, upload security, offline recovery, payment manual verification, accessibility/TalkBack, load and backup restore.

**Critical test journeys:** (1) anonymous Kabul rent search→contact; (2) gharawi principal validation; (3) new private owner draft→moderation→published; (4) significant edit remains private until approved; (5) user blocks and reports suspicious contact; (6) agency assign→revoke member and ensure immediate access loss; (7) canceled/rescheduled viewing; (8) duplicate create/payment retries; (9) renewal reminder→expired listing hidden; (10) subscription grace and downgrade; (11) AFN manual claim rejected then resubmitted; (12) RTL Persian/Pashto number/currency formatting; (13) no geolocation/map provider; (14) interruption during multi-image upload; (15) expired verification badge disappears; (16) admin reviewer race/concurrency. **Status:** test requirements only; no execution claimed.

## 59. Competitive Capability Matrix

**Legend:** ✓ verified currently advertised capability; ◇ proposed in our scope; ? not established from inspected public source; — excluded intentionally. This compares *documented features*, not actual product quality or market share.

| Capability | AmlakLink plan | Koor | Khaneh | Asoda | Zillow | Zoopla |
|---|---|---|---|---|---|---|
| Afghanistan listings | ◇ MVP | ✓ [S1] | ✓ [S4] | ✓ [S6] | — | — |
| Dari/Pashto/English | ◇ MVP | ✓ [S2] | ? | ? | ? | ? |
| Sale / rent / gharawi | ◇ MVP | ✓ [S1] | ✓ [S4] | ✓ [S6] | Sale/rent | Sale/rent |
| Direct call / WhatsApp | ◇ MVP | ✓ [S2] | ✓ [S4] | Direct contact ✓ [S6] | ? | ? |
| Verified advertiser messaging | ◇ MVP | ✓ agency [S3] | ✓ owner claim [S5] | ? | ? | ? |
| Map/list search | ◇ MVP | ? | Map positioning claim [S5] | ? | ✓ [S9] | ✓ [S13] |
| Saved property | ◇ MVP | ✓ [S2] | ? | ✓ [S6] | ✓ [S8] | ✓ [S12] |
| Draw polygon | ◇ V1.1 | ? | ? | ? | ? | ✓ [S13] |
| Save search + alerts | ◇ V1.1 | ? | ? | ✓ app claims alerts [S6] | ✓ [S9] | ✓ [S12] |
| Viewing request | ◇ MVP | ? | ? | ? | ✓ [S9] | Agent viewing contact ✓ [S13] |
| Full agency lead queue | ◇ MVP/V1.1 | ? | ? | ? | Agent tools ✓ [S9] | ? |
| Structured gharawi price fields | ◇ MVP | Gharawi category ✓ [S1]; exact fields ? | Gharawi ✓ [S4]; exact fields ? | Gharawi ✓ [S6]; fields ? | — | — |
| Reconfirm availability timer | ◇ MVP | ? | ? | ? | ? | ? |
| Title/ownership legal guarantee | — | ? | ? | ? | ? | ? |
| Automated market estimate | ◇ future only | ? | ? | ? | ✓ regional [S9] | ✓ UK [S12] |

## 60. Risks and Mitigations

| Risk | Severity | Mitigation / validation |
|---|---|---|
| Insufficient listings and agencies | Critical | Concierge onboarding in Kabul, pilot commitment before feature sprawl |
| False owners / dangerous scams | Critical | Structured trust program, reason-coded reports, content moderation, safe education warnings |
| Leaked property address or identity documents | Critical | Approximate public pins, encrypted private evidence, smallest-possible collection, access audit |
| Misrepresentation of legal title | Critical | Explicit verification scope, no legal ownership warranty, qualified legal review |
| Low agency willingness to pay | High | Validate actual time saved and leads before subscriptions |
| Strong Koor/Khaneh competition | High | Comparable discovery baseline + differentiated freshness/agency operation; measure retention |
| Low-connectivity / older devices | High | Lean bundle/media, offline caching, resilient requests and clear error states |
| Payment method cannot be integrated | High | Invoice/manual verification first, provider research later; separate billing from transactions |
| Map tile terms, geocoding gaps | High | Respect OSM attribution/tile policies; local catalog fallback; no exact location promise |
| SMS/email delivery unreliability | High | Real field trials, multiple verified account recovery channels |
| Legal and regulatory uncertainty | High | Local professional review of contracts, property documentation, consumer/privacy policies, payments |
| Expensive images/video | Medium | Compressed previews, object lifecycle retention, uploader quotas |
| Paid listings degrade search trust | Medium | Distinct ad slots, strong ranking relevance, cap promoted density |
| Analytics imply transaction truth | Medium | Labels: asking prices, contact taps, self-reported outcomes; no invented sale statistics |
| Scope creep from international apps | High | MVP gate and deferred finance/AI/new-construction requirements |

## 61. IMPLEMENTATION HANDOFF SPECIFICATION

This is the minimum consolidated contract for a development agent; Sections 1–60 remain authoritative for details.

| Handoff component | Definitive direction |
|---|---|
| 1 Product objective | Trustworthy Afghanistan property discovery + practical advertiser/agency workflow |
| 2 Users | Visitors, seekers, private owners, independent agents, agencies, developers later, staff |
| 3 Product scope | Buy/sell, rent, gharawi; residential/commercial/land; 34 provinces, Kabul launch acquisition |
| 4 MVP | Search/list/map, listing detail, free listing + moderation, auth, favorites, contact/inquiry/viewing, agency basic, staff admin |
| 5 Roles | Visitor/Seeker/Private Advertiser/Independent Agent/Agency Agent-Manager-Owner/Moderator/Verification/Billing/Admin/Super Admin |
| 6 Permission model | Least privilege, user ownership, organization-scoped membership, staff separation |
| 7 Page inventory | Section 21 and conceptual routes Section 20 |
| 8 Workflows | Section 24 + state transitions Section 27 |
| 9 Main features | F-01 through F-15, Section 25 |
| 10 Business rules | RULE-001–RULE-045, Section 26 |
| 11 Entity states | Listing/revision/verification/inquiry/viewing/lead/member/subscription/payment/report/promotion |
| 12 Entities | Section 28 plus normalized locations and price charge types |
| 13 API capabilities | Auth, Listings, Search, Media, Inquiry, Viewings, Organizations, Verification, Billing, Moderation |
| 14 Integrations | Licensed maps, object storage, local OTP/email, compliant payment processing/manual proof, push development builds |
| 15 AI | Not required for MVP; later opt-in validated writing/search assistance |
| 16 Automations | Freshness reminder, expiry, indexing, notification, assignment, payment decision, retention |
| 17 Notifications | In-app MVP; push/email opt-in V1.1; event + dedupe rules Section 33 |
| 18 Billing | Free browsing, proposed private quota, agency seats/listings, manual AFN invoices, no property payments |
| 19 Admin | Separate secure web, moderation, verification, fraud, agencies, money, logs, catalogs |
| 20 UX | Photo-led, short flows, state clarity, one responsive filter sheet, no unnecessary titles |
| 21 Mobile | Expo Android-first, iOS-compatible, Dari RTL/Pashto RTL/English LTR, cached weak-network behavior |
| 22 Security | Server RBAC, privacy by default, document vault, audited staff actions, admin MFA |
| 23 Edge cases | Duplicate assets, price changes, expired verification, membership loss, requests races, upload failures |
| 24 Stack | Expo / React Native + Expo Router, Next.js admin, Node TypeScript monolith, Postgres/PostGIS, Drizzle |
| 25 Phases | 1–7 MVP and launch; 8 V1.1; 9 V2 dependent on evidence |
| 26 Acceptance | Critical journeys and quality gates Sections 57–58 |
| 27 Assumptions | Agency willingness to pay, exact plan limits/prices, verification procedure, document retention, OTP deliverability |
| 28 Risks | Listing supply, trust, payments, internet performance, mapping, legal/regulatory unknowns |

**Acceptance handoff summary:** The pilot is not complete when screens look good; it is complete when a Kabul seeker can find a fresh listing, understand exact price terms, reach a legitimate authorized advertiser, request a viewing, and when an advertiser/agency can manage that request while staff can safely moderate and audit abuse.

---

## Sources, Research Notes and Open Decisions

### Evidence and official references

- **[S1] Koor official website:** https://koor.co/ — Afghanistan inventory, gharawi, saved items, calls/WhatsApp, web/app claims. Reviewed 17 Oct 2026.
- **[S2] Koor Google Play listing:** https://play.google.com/store/apps/details?id=com.ulearnatech.koor — product claims and languages. Reviewed 17 Oct 2026.
- **[S3] Koor verified agencies directory:** https://koor.co/agencies — verified-agency public discovery and certificate review claims. Reviewed 17 Oct 2026.
- **[S4] Khaneh official website:** https://khaneh.app/ — categories, direct owner contact, gharawi, rentals, verification messaging. Reviewed 17 Oct 2026.
- **[S5] Khaneh product explanation:** https://khaneh.app/blog/what-is-khaneh-app — video, maps, owner checking and moderation claims. Reviewed 17 Oct 2026.
- **[S6] Asoda official website and app:** https://asoda.app/en/ and https://play.google.com/store/apps/details?id=app.asoda — Afghanistan listings, self-posting, filters/notifications marketing claims. Reviewed 17 Oct 2026.
- **[S8] Zillow 2026 personalized hub:** https://www.zillow.com/news/zillow-launches-a-personalized-hub-that-guides-home-buyers-from-first-search-to-closing/ — shared collections and buyer workflows, published June 23, 2026.
- **[S9] Zillow 2026 AI mode:** https://www.zillow.com/news/zillow-debuts-ai-mode/ — search, comparisons and touring, published March 25, 2026.
- **[S10] Redfin mobile:** https://www.redfin.com/mobile and https://apps.apple.com/us/app/redfin-buy-sell-rent-homes/id327962480 — app tours and discovery.
- **[S11] Realtor.com mobile:** https://www.realtor.com/mobile/ — map draw, image gallery and alerts.
- **[S12] Zoopla saved properties:** https://help.zoopla.co.uk/hc/en-gb/articles/360006007877-How-do-I-save-a-property — app saved listing workflow.
- **[S13] Zoopla map view:** https://help.zoopla.co.uk/hc/en-gb/articles/360006033758-How-can-I-search-for-properties-using-Map-view — map/list and area drawing; https://help.zoopla.co.uk/hc/en-gb/articles/360005969458-How-do-I-create-email-alerts-and-saved-searches — alerts.
- **[S14] Rightmove Draw a Search:** https://faq.rightmove.co.uk/support/solutions/articles/7000048757-draw-a-search — custom area search.
- **[S15] Apartments.com Rental Manager:** https://www.apartments.com/rental-manager — rental management and communication tools (U.S. market-specific).
- **[S16] Homes.com agent offerings:** https://www.homes.com/advertise/agents/ — agent marketing, pages, lead vetting.
- **[S17] DataReportal Afghanistan 2026:** https://datareportal.com/reports/digital-2026-afghanistan — internet and mobile environment, uses late-2025 data.
- **[S18] Reddit individual duplicated-location report:** https://www.reddit.com/r/fsbo/comments/1kzqju4/ — anecdote, not trend.
- **[S19] Reddit individual search-alert geographic mismatch report:** https://www.reddit.com/r/RealEstate/comments/17tr5nk/ — anecdote, not trend.
- **[S20] OpenStreetMap attribution:** https://www.openstreetmap.org/copyright/attribution-guide — data licensing/credit.
- **[S21] OSM tile policy:** https://operations.osmfoundation.org/policies/tiles/ — hosted tile restrictions.
- **[S22] Expo notifications:** https://docs.expo.dev/versions/latest/sdk/notifications/ — Android Expo Go remote push limitation and development build requirement.

### Screenshot inspiration reviewed (not reproduced in deliverable)

Official Zillow property screens: https://www.zillow.com/news/zillow-unveils-a-new-look-for-property-pages-their-biggest-redesign-in-5-years/ ; Realtor.com mobile illustrations: https://www.realtor.com/mobile/ ; Redfin official mobile illustrations: https://www.redfin.com/mobile ; Zoopla help app screenshots [S12–S13]. Screenshot analysis is of public product materials, **not direct access to each installed app**.

### Open decisions / validation backlog before paid rollout

**O-01** Final brand and trademark/domain clearance in Afghanistan. **O-02** Which domestic payment provider can legally and technically support AFN merchant billing? **O-03** Which SMS/OTP channel reaches Kabul users reliably at sustainable cost? **O-04** How local licensed agencies prove business registration and authorized listing rights. **O-05** Actual gharawi field terms by region (legal/language review). **O-06** Legal retention and data hosting rules. **O-07** Price plan willingness-to-pay and quotas after agency interviews. **O-08** Source/accuracy of full 34-province subdistrict and neighborhood data. **O-09** Usable map tile service and local geocoding coverage. **O-10** Whether iOS release is worth prioritizing before Android traction. **O-11** Support and abuse-review staffing schedule. **O-12** Verification badge wording to pass legal review. **O-13** Local photos/video capture and media rights policy. **O-14** Approval thresholds for enhanced agency publishing privileges. **O-15** Property terms in Dari and Pashto localization reviewed by native practitioners.

**Source-of-truth status:** These requirements become the proposed product specification. Any change must be a consciously recorded product decision. Architecture, test implementation, Git/repository activity and deployment are handled separately by the development workflow.