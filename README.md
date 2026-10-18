# AmlakLink / املاک لینک

Afghanistan-only, Android-first real estate marketplace. Kabul first. Localized Dari (default), Pashto, English. Product behavior is governed by docs/PRODUCT-SPECIFICATION.md; delivery by docs/SOFTWARE-WORKFLOW-V4.md.

## Current milestone — Phase 6: Trust, safety & verification

- Mobile: Expo SDK 57 + Expo Router. Five public marketplace tabs, offline 34-province catalog, and real email/password auth + verification/recovery/advertiser/agency/agent applications.
- API: Fastify on **port 4000** with PostgreSQL identity persistence, email challenges, hashed sessions, protected agency memberships, staff MFA and audit.
- Admin: Separate Next.js staff portal at http://localhost:3000/admin/login. Provisioned staff can review agency and independent-agent applications; ordinary mobile accounts cannot access staff routes.
- Shared: localization, province catalog, contracts, design tokens and PostgreSQL/Drizzle schema.

**Phase 3 now supports real moderated property listings**, structured sale/rent/gharawi pricing, optimized photo uploads, agency inventory and public approved property details. The advanced discovery and inquiry features follow in Phase 4–5.

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
