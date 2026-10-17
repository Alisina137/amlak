# Phase 3 — Property Inventory

**Product authority:** docs/PRODUCT-SPECIFICATION.md — Phase 3, P-03/P-04, F-02/F-04, RULE-001–019 and listing/revision state systems.
**Status:** Implemented; GitHub Actions runs the real PostgreSQL scenario, cross-role checks, admin production build and Android export. Physical device/S3 operations still require local/production verification.

## Functionality delivered

- Verified private advertisers, approved independent agents, and authorized active agency members can create idempotent property drafts. Non-members, unverified accounts, and revoked agents are blocked server-side.
- Mobile create flow: choose private/agency context and transaction/category → 8-step editor (property/category, transaction, location privacy, attributes, local pricing, photos, contact, review/submit). Drafts persist in PostgreSQL and a device cache. Resume drafts from My Listings or agency inventory.
- Location: Afghanistan fixed, 34 provinces, city/district/neighborhood, optional street address kept private. Approximate location hides coordinates and street from public responses.
- Sale: asking price and currency. Rent: monthly amount and explicit advance/deposit (including 0). Gharawi: refundable principal, explicit additional monthly rent (including 0), duration months and written refund terms.
- Land fields omit bedrooms; apartment permits floor/total floors. Server validates area, type-dependent facts, prices, contact opt-in, province, title/description and at least one owned image before submission.
- Images: native Expo photo picker → authenticated multipart upload → 6MB input cap, validated image magic/size and max 25M pixels → orientation correction, EXIF removal, optimized WebP max 1600×1600 → local private development storage or production S3-compatible storage → image gallery, selected cover, reorder/remove from draft. Maximum 20 registered images per listing.
- Listing state: draft → review → publication; rejection remains editable; independent staff moderator accepts/rejects with reason; all decisions audited and revision-specific conflict protected.
- Published edits create new draft/review versions while approved public snapshot and media remain unchanged. Publisher can pause/resume (instant search hiding) or close sold/rented. Availability confirmation stores a timestamp.
- Public initial latest-list endpoint and property detail with visible asking terms; results exclude hidden/pending/stale listings and never expose unapproved draft, private street, private phone or precise coords when approximate.
- Separate responsive Next.js moderation queue for moderators/admin/super-admins. Secure staff-only photo preview proxy, non-public revisions and review decisions.

## Local configuration and launch

1. Pull the repository's main branch and run pnpm install (requires Node >=22.13).
2. Keep Phase 2 identity settings in root .env: DATABASE_URL, AUTH_CODE_PEPPER, STAFF_TOTP_ENCRYPTION_KEY_HEX, SMTP settings.
3. Run `pnpm db:migrate`. This applies 0001_identity.sql and 0002_inventory.sql to your **own** database. Run on a staging/backup DB first if it contains valuable data. No production credentials or migrations are run by this assistant.
4. Start backend with `pnpm dev:api` using **port 4000**, not inspector 4040. The local-only media backend writes WebP assets into `.amlak-media/` (ignored by Git). Do not use local disk storage in production.
5. For production set `MEDIA_S3_BUCKET`, `MEDIA_S3_REGION`, optionally `MEDIA_S3_ENDPOINT`, and `MEDIA_S3_ACCESS_KEY_ID` / `MEDIA_S3_SECRET_ACCESS_KEY` or the standard AWS credential provider chain. Production denies local-disk photo storage.
6. Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to an HTTPS tunnel forwarding 4000. Start `pnpm dev:mobile` (Expo Go). Start the separate moderator web application with `pnpm dev:admin`.
7. The staff provisioning script supports `STAFF_ROLE=moderator` or `super_admin` with a mandatory authenticator (see docs/PHASE-2-IDENTITY.md). Moderator screen: http://localhost:3000/admin/listings.
8. Run `pnpm check`; CI executes a real database-backed publish/pause/revision-moderation integration test, admin build and Expo Android bundle. Device gallery permissions and S3 upload/read flows still need real-environment testing.

## Boundaries and known future work

- Phase 3 introduces basic chronological published inventory. Advanced search, map/list filters, favorites, profile cards, direct call/WhatsApp contact and private location map behavior are **Phase 4**.
- In-app messaging, lead queue, viewing requests and in-app notifications are Phase 5. Reports/appeals, fuller verification and media duplicate triage are Phase 6.
- Freshness threshold is 30 days in public results; periodic automatic pause/reminder jobs are part of pilot hardening (Phase 7).
- The reference specification proposes professional-tier quotas and benefits, but paid subscriptions only begin in Phase 8. A proposed 3-active-listing free threshold is currently enforced per private-account submission.
- Client draft cache does not replace server moderation or server authorization; external phone/payment operations must not be inferred from app taps.
- Uploaded content moderation is manual after image format normalization. Additional content safety scanning/automated fraud checks belong to operational safety hardening.
- On a public tunnel, use actual SMTP and verified accounts. Never enable development code-printing mode for the public.

## API (Phase 3)

- `POST /v1/listings` idempotent create; `GET /v1/listings/mine`; `GET /v1/listings/:id` authenticated editor.
- `PUT /v1/listings/:id/draft` optimistic `expectedVersion`; `POST /v1/listings/:id/submit` and `/withdraw`.
- `POST /v1/listings/:id/photos` multipart, `DELETE /v1/listings/:id/photos/:photoId` restricted, `GET /v1/photos/:id` publication/role controlled.
- `GET /v1/properties` and `/v1/properties/:id` public approved snapshot projection.
- `POST /v1/listings/:id/pause|resume|confirm-availability|close` server-side state checks.
- `GET /v1/admin/listings/review-queue`, `POST /v1/admin/listings/:id/decision` staff-only.
