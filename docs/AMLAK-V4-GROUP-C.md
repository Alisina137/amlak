# Amlak App v4 — Group C (Phases 11–15)

Scope: published property-detail experience. No database/API migrations, permission changes, fabricated coordinates, payment promises or new booking endpoints.

## Phase 11 — Detail structure and visual hierarchy
- Accessible back, favorite, share and refresh controls.
- Transaction/property badges, compact title and safe general-location summary.
- Existing room-aware photo gallery kept ahead of price and specifications.
- Structured sections and a safe-area-aware sticky contact footer.
- Skeletons, retry on failure and stale-result protections when switching listing IDs.

## Phase 12 — Price and rental terms
- Sale: asking price, currency and optional negotiability.
- Rent: monthly rent plus refundable deposit; an explicit zero remains visible.
- Gharawi: refundable principal, additional monthly rent, duration and the actual refund terms provided by advertiser.
- Optional maintenance cost is labeled separately; no hidden assumptions or currency conversion.
- All amounts and terms are identified as advertiser-provided and must be confirmed before paying.

## Phase 13 — Photo browsing
- Retains published cover-first photos, room filters, selected thumbnail indicator and caption.
- Full-screen swipe viewer now also supports accessible previous/next buttons with bounded navigation.
- No phantom images or unsourced room labels are created.

## Phase 14 — Contact and visit journey
- Dedicated inquiry and visit-request buttons.
- Viewing path starts an authenticated, email-verified inquiry (with editable localized draft) and takes the user to the existing 2–3 Kabul-time slot request page.
- The visit is **not** booked until the advertiser confirms it; no direct booking claim.
- Call and WhatsApp use the server-issued links, separate advertiser opt-ins and request-level availability checks; duplicate contact taps are suppressed.
- If the property is not published/available, contact CTAs are disabled.

## Phase 15 — Property information, privacy and trust
- Grid for provided area, rooms, baths, floors, frontage and condition.
- Only affirmed amenities appear; unknown values aren't presented as available.
- Expand/collapse description; concise locality without any private street address or coordinates.
- Last availability check is shown when supplied; verification scope is **not** presented as proof of ownership.
- Advertiser profile, report action and fraud-safety warnings remain accessible.

## Verification
- `pnpm qa:ui` includes the Group C source tests, Group A/B acceptance checks and RTL contracts.
- `pnpm typecheck` / `pnpm test` and Expo export run in CI.
- Still manually test Dari/Pashto/English on physical Android, including camera images, modal swiping, long descriptions, 0 deposit/0 monthly rent, paused listings, denied phone permissions, WhatsApp availability, email verification and the visit request path.
