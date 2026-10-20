# Group C — Property Details (Phases 11–15)

Scope: Android-first public property detail page and the existing inquiry/viewing journey. No new backend payment, identity, map-pin, or contact-permission policy is introduced.

## Delivered changes

- **11: Detail hierarchy.** Localized transaction/property badges, price panel, room/area metrics, privacy-aware location, description and advertiser identity.
- **12: Price clarity.** Sale/rent/gharawi amounts remain explicit and are never automatically converted between currencies. Refundable deposit, principal, rent, duration and refund terms stay distinct.
- **13: Gallery.** Room-specific filters retain approved captions; lightbox swipes/previous/next controls, item counters, localized accessibility labels, photo-load retry and orientation syncing improve navigation. No new exact-location or private data is published.
- **14: Contact/viewings.** Calls/WhatsApp remain governed by server-authorized contact URLs and listing status. Visit requests now first create/reuse a verified-account inquiry, **then** navigate to the existing 2–3 Kabul-time slot flow with a real inquiry ID. Neither a tap nor slot proposal confirms a booking.
- **15: Usability/guards.** Inline retry for failed property fetches, visible error feedback near contact controls, bottom safe-area padding, selection state/disabling and multilingual messages. Group C assertions added to `pnpm qa:ui`.

## Manual acceptance matrix (Android)

1. Open one published sale, one rent, and one gharawi property; confirm correct distinct monetary fields, currency, and hidden/omitted fields.
2. For each language (Dari, Pashto, English), verify direction, accessible controls and captions; switch locales on an open property.
3. Test a property with no photos, one photo, many photos/room types and a temporarily unreachable photo URL. Try landscape rotation while the lightbox is open.
4. Try unapproved/unavailable property. Inquiry/viewing/call/WhatsApp must not become usable.
5. On a contact-enabled listing: request viewing while signed out/unverified (requires login/verification); while verified, create an inquiry and select two or three future Kabul slots. Verify status is **requested**, not confirmed.
6. Use both external contact channels with installed and missing apps, confirm that failures appear in the sticky footer. No external call/WhatsApp action is treated as a recorded completed transaction.
7. Deny network access, retry property load, and switch between listings. A failed second listing must never show the first listing's stale details.
8. With TalkBack and large fonts, confirm 44+ px touch targets, sensible focus order, scrolling to the full page and unobscured footer on a real Android device.

## Engineering verification

- `pnpm qa:ui` — static Group A/B/C UI and localization contracts.
- `pnpm check` — workspace TypeScript and unit/integration tests.
- `pnpm --filter @amlaklink/mobile exec expo export --platform android --output-dir dist` — Android bundle smoke.
- GitHub Actions `.github/workflows/verify.yml` runs these checks on pull requests.

Static tests, passing CI and Android export are **not** substitutes for physical-device, real photo storage, verified account, external dialer/WhatsApp or human workflow acceptance.
