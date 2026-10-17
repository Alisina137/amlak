# Phase 4 — Discovery & Seeker Experience

**Source of truth:** `docs/PRODUCT-SPECIFICATION.md`, Phase 4, P-01–03, P-05/P-08, F-03/F-05/F-09, RULE-001–045. This documentation describes implemented software, not production adoption.

## Implemented

- A server-side `/v1/discovery` endpoint provides published-and-current properties only, with active advertiser/agency checks, province and localized place/keyword search, transaction category, property type, bedrooms, bathrooms, area, amenities, verified-agency filter, advertiser classification, currency-aware price bounds and sorting.
- Price comparison requires an explicit transaction type and currency. Sale compares asking price; rent compares monthly rent; gharawi compares refundable principal. AFN and USD are never silently merged; amounts are not converted.
- Stable keyset pagination, 1–30 results per request, cursor tied to the applied filters and sort. No unpublished revisions, unpublished photos or private contact/addresses appear in search.
- Phone-first Search includes intent chips, text search, advanced filter bottom sheet, applied results, no-results explanation, retry/refresh and persistent filter state across property detail/back; offline cached previously viewed results are clearly labeled with last update time.
- Map/list experience: map is available in Expo Go through `react-native-maps`. Only listings with voluntary **exact** public coordinates can display individual pins. Listings set to approximate, or without coordinates, receive **no fabricated pin**. Users can return to list or explicitly search the visible map extent.
- Signed-in users can save/unsave approved listings; guests are prompted to sign in only when attempting a save, with the attempted listing saved automatically once sign-in succeeds. A user's favorites are private. Paused/closed listings remain in their saved history marked with status.
- Property detail has photo gallery, safe location display, structured gharawi price/refund breakdown, availability/freshness, an advertiser profile link and a sticky call/WhatsApp action row. Contact numbers are returned **only on an explicit channel tap** for currently active properties, with per-IP rate limiting and tap logging (not a guarantee of a completed call). Disabled contacts remain unavailable.
- Advertiser/agency public profiles show active inventory and narrowly described verification badges: email contact verified, agency registration reviewed, independent professional application reviewed. **None imply legally verified title, ownership or physical property inspection**.
- Public property sharing via the `amlaklink://property/:id` app link.

## Verify locally

1. `cd C:\projects\amlak` and `git pull origin main`.
2. `pnpm install` and `pnpm db:migrate` with your own development/staging Neon/PostgreSQL connection.
3. Run `pnpm dev:api` (port **4000**) and `pnpm dev:mobile` with a reachable HTTPS ngrok endpoint targeting that port.
4. Create and publish actual test property inventory through Phase 3 moderation. Confirm search filters and price sorts; try AFN rent and gharawi as different intents; verify sale prices do not mix.
5. On Expo Go Android, open Search → Map. To see a precise pin the advertiser must have explicitly selected **exact** precision and saved both coordinates. Otherwise the screen explains why a listing has no pin and points users back to list. Test map network failure and location-denied behavior.
6. As a guest, browse published listings, tap Save and verify the sign-in gate. After signing in, check Saved and that other users' favorites are not exposed.
7. Open active property detail, verify contact number is not in the JSON from search/detail APIs, and tap Call/WhatsApp only if the advertiser enabled that channel. Suspended, paused, stale or closed inventory must disable direct contact.
8. Run `pnpm check`. GitHub CI runs isolated PostgreSQL integration coverage, TypeScript, the Next.js admin build and Android Expo export.

## Map provider and production limitations

`react-native-maps` is included in Expo Go, but distributing an Android app that embeds Google's map tiles requires a properly configured Google Maps SDK key and may require billing. This repository does **not** promise free production Google Maps. The owner must separately select and configure an appropriately licensed map provider for production. Without reliable tiles, map features may be unavailable; the list/search interface remains functional. OSM data and public OSM tile servers are not an unrestricted free replacement. Never bulk cache third-party tiles without permission.

## Deferred according to spec

- Real in-app inquiries, message threads, viewing confirmation and notification delivery are Phase 5, not Phase 4.
- Staff case reports, appeals and stronger identity/property proof workflows are Phase 6.
- Saved-search subscriptions, search alerts, comparison collections, paid visibility and account billing are later stages, not in Phase 4.
- No automatic property valuations or market guarantee.

## API

- `GET /v1/discovery` (guest) paged filtered search; `GET /v1/discovery/map` bounded exact-public-coordinate set.
- `GET/POST/DELETE /v1/favorites[/:id]` user-scoped favorites (the one-id GET reports saved state).
- `GET /v1/properties/:id/contact?channel=call|whatsapp` rate-limited tap action, returns an allowed external deep link only for an active property.
- `GET /v1/advertisers/:kind/:id` and `/properties` public agency or user page with scoped badge descriptions.

## Operational acceptance limits

GitHub CI tests cannot prove actual Android native maps availability on the user's device or a commercial map key. Test with actual internet access before any pilot release. Map/list fallback and search state should be checked with the user's real network conditions.
