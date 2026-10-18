# AmlakLink / املاک لینک

Afghanistan-only, Android-first real estate marketplace. Kabul first. Localized Dari (default), Pashto, English. Product behavior is governed by docs/PRODUCT-SPECIFICATION.md; delivery by docs/SOFTWARE-WORKFLOW-V4.md.

## Current milestone — Phase 7: Pilot hardening & MVP readiness

- Mobile: Expo SDK 57 + Expo Router. Five public marketplace tabs, offline 34-province catalog, and real email/password auth + verification/recovery/advertiser/agency/agent applications.
- API: Fastify on **port 4000** with PostgreSQL identity persistence, email challenges, hashed sessions, protected agency memberships, staff MFA and audit.
- Admin: Separate Next.js staff portal at http://localhost:3000/admin/login. Provisioned staff can review agency and independent-agent applications; ordinary mobile accounts cannot access staff routes.
- Shared: localization, province catalog, contracts, design tokens and PostgreSQL/Drizzle schema.

**Phase 3 now supports real moderated property listings**, structured sale/rent/gharawi pricing, optimized photo uploads, agency inventory and public approved property details. Advanced discovery, in-app inquiries/viewings, and trust/safety workflows were delivered in Phases 4–6.

## Local setup (PowerShell)

    corepack enable
    corepack pnpm install
    Copy-Item .env.example .env
    # Edit root .env: DATABASE_URL, AUTH_CODE_PEPPER, STAFF_TOTP_ENCRYPTION_KEY_HEX and SMTP settings.
    corepack pnpm db:migrate
    corepack pnpm dev:api

In other terminals: `corepack pnpm dev:mobile` and `corepack pnpm dev:admin`. Before physical phone testing, copy apps/mobile/.env.example to apps/mobile/.env and set EXPO_PUBLIC_API_URL to an HTTPS tunnel forwarding port 4000 (not ngrok inspector 4040).

Read docs/PHASE-2-IDENTITY.md for identity, docs/PHASE-3-INVENTORY.md for property inventory, docs/PHASE-4-DISCOVERY.md for discovery, and docs/PHASE-5-ENGAGEMENT.md for inquiries and viewings, and docs/PHASE-6-SAFETY.md for reports, verification, appeals and safety holds. Run `corepack pnpm check` to execute typechecks and tests; GitHub CI additionally runs PostgreSQL integration tests, admin build and Android Expo export.

Never commit identity records, actual credentials, MFA secrets, user uploads or payments.


## Phase 7 — Pilot readiness

Before launch, follow **docs/PHASE-7-PILOT.md** for the staff pilot scorecard, 14-day freshness reminders, 30-day auto-pause, encrypted backup/staging restore, read-only smoke testing and **human go/no-go checklist**. The application is *not* yet approved for production release.

## Phase 8 — Professional growth (in progress)

See **docs/PHASE-8-GROWTH.md** for saved searches/alerts, four-property comparison, private shared shortlists and support tickets, proposed AFN subscription invoices with staff-only manual verification, time-bound entitlements, labeled featured listings and scoped agency reports. **Billing is disabled by default** (`AMLAK_BILLING_ENABLED=false`) until local legal, pricing and payment procedures are validated. Alerts are in-app only; push development builds and additional Phase 8 features are not yet complete. After migrating, `pnpm ops:alerts --dry-run` previews alert matches, and `pnpm ops:alerts --execute` creates deduplicated notifications. Phase 7 real-world release acceptance remains pending.
