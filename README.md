# AmlakLink / املاک لینک

Afghanistan-only, Android-first real estate marketplace. Kabul first. Localized Dari (default), Pashto, English. Product behavior is governed by docs/PRODUCT-SPECIFICATION.md; delivery by docs/SOFTWARE-WORKFLOW-V4.md.

## Current milestone — Phase 2: Identity and scoped roles

- Mobile: Expo SDK 57 + Expo Router. Five public marketplace tabs, offline 34-province catalog, and real email/password auth + verification/recovery/advertiser/agency/agent applications.
- API: Fastify on **port 4000** with PostgreSQL identity persistence, email challenges, hashed sessions, protected agency memberships, staff MFA and audit.
- Admin: Separate Next.js staff portal at http://localhost:3000/admin/login. Provisioned staff can review agency and independent-agent applications; ordinary mobile accounts cannot access staff routes.
- Shared: localization, province catalog, contracts, design tokens and PostgreSQL/Drizzle schema.

**Phase 3 adds real property listings**; Phase 2 deliberately does not show fake properties or accept real property submissions.

## Local setup (PowerShell)

    corepack enable
    corepack pnpm install
    Copy-Item .env.example .env
    # Edit root .env: DATABASE_URL, AUTH_CODE_PEPPER, STAFF_TOTP_ENCRYPTION_KEY_HEX and SMTP settings.
    corepack pnpm db:migrate
    corepack pnpm dev:api

In other terminals: `corepack pnpm dev:mobile` and `corepack pnpm dev:admin`. Before physical phone testing, copy apps/mobile/.env.example to apps/mobile/.env and set EXPO_PUBLIC_API_URL to an HTTPS tunnel forwarding port 4000 (not ngrok inspector 4040).

Read docs/PHASE-2-IDENTITY.md for the complete local email and staff MFA setup. Run `corepack pnpm check` to execute typechecks and tests; GitHub CI additionally runs PostgreSQL integration tests, admin build and Android Expo export.

Never commit identity records, actual credentials, MFA secrets, user uploads or payments.
