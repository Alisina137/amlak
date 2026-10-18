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

See **docs/PHASE-8-GROWTH.md** for saved searches/alerts, four-property comparison, private shared shortlists and support tickets, proposed AFN subscription invoices with staff-only manual verification, time-bound entitlements, labeled featured listings and scoped agency reports. **Billing is disabled by default** (`AMLAK_BILLING_ENABLED=false`) until local legal, pricing and payment procedures are validated. In-app alerts remain available without remote push; optional push requires a configured Expo development build. Photo room labels, reviewed captions, and a room-filtered public gallery are implemented in Step 2. Other Phase 8 features and external acceptance remain incomplete. After migrating, `pnpm ops:alerts --dry-run` previews alert matches, and `pnpm ops:alerts --execute` creates deduplicated notifications. Phase 7 real-world release acceptance remains pending.


### Phase 8 Step 1: optional push notifications

Remote push is **off by default**. The new Account → Push notification settings screen provides opt-in categories, while a scheduled `pnpm ops:push --execute` task delivers only in-app notifications created after consent. This requires a real EAS project, Android FCM credentials and a development build (not Android Expo Go). See [push setup](docs/PHASE-8-STEP-1-PUSH.md).


### Phase 8 Step 3: subscription renewals and grace

Read-only subscription status, queued verified renewals, localized expiry warnings and a **3-day communication grace window** are implemented. Grace does not provide additional paid posting capacity: existing listings and conversations are preserved, but new submissions and invitations use free quotas after expiry. No automatic charges. Billing remains disabled by default. Run `pnpm ops:renewals --dry-run` before scheduling `pnpm ops:renewals --execute`. See [Step 3 policy](docs/PHASE-8-STEP-3-SUBSCRIPTIONS.md).


### Phase 8 Step 4: billing verification and adjustments

Billing stays **OFF by default**. Finance staff must enter an independently verified financial statement reference, amount, and date before marking a platform-fee claim paid. Users can view rejected-claim reasons and request a refund review or noncash credit memo on a verified AmlakLink fee. An approved refund requires another billing staff member to record the **actual external settlement**; the app never transfers money. Credit memos are **not redeemable or withdrawable** until formal policy approval. New database migration: `pnpm db:migrate`. See [Step 4 details](docs/PHASE-8-STEP-4-BILLING.md).


### Phase 8 Step 5: advanced agency reporting

Agency owners and managers now have **Agency → Agent performance & lead assignments**, with 7/30/90-day in-app response metrics, an assignment queue and team scorecards. Agents remain restricted to their assigned inquiries. No inferred sale or external call completion is counted. See [Step 5](docs/PHASE-8-STEP-5-AGENCIES.md).


### Phase 8 Step 6: automated QA and safe release preflight

Run `pnpm qa:phase8` for structural preflight checks (safe default flags, ordered migrations, CI test/build/export checks and security test coverage). GitHub Actions also reruns migrations to detect non-repeatable SQL. The optional `pnpm qa:release` command additionally fails closed unless private, independently reviewable pilot evidence and real provider configuration are supplied. **Neither green CI nor self-attested evidence grants production release approval.** Live Android, EAS/FCM, local financial/legal approval and the Phase 7 human pilot remain external requirements. See [Step 6 QA runbook](docs/PHASE-8-STEP-6-QA.md).


### Final completion Step 2: trilingual RTL/LTR UI

The mobile app now uses a mirrored tab order, accessible locale-dependent back buttons, RTL-aware text inputs, LTR entry for numeric values and English-format contact fields, and shared trilingual labels for primary property and agency journeys. Run `pnpm qa:ui` to check text key parity and direction contracts. See [Step 2 RTL/LTR acceptance matrix](docs/FINAL-COMPLETION-STEP-2-RTL-UI.md); **physical Android, accessibility and translation reviews remain required**.


### Final Completion Step 5: database and media recovery hardening

New read-only checks: `pnpm db:integrity` and `pnpm ops:media:audit --limit=10`. Backups can be verified offline with `pnpm db:backup:verify <file.pg.enc>`. Staging restores require a separate `STAGING_DATABASE_URL`, exact `RESTORE_EXPECT_DATABASE` and explicit operator confirmation, and never target the production database. Remote PostgreSQL backup/restore tools validate TLS hostnames. Media deletion avoids removing bytes before the DB transaction is committed. These checks do not replace a live staging-restore exercise or a separate S3 backup. See [Step 5 runbook](docs/FINAL-COMPLETION-STEP-5-DATABASE-MEDIA.md).


### Final Completion Step 6: map search areas

Map search supports 3–12 point custom-drawn polygons and a visible-map rectangular search. Both apply server-side location filters to the same paginated property List, without PostGIS or requesting user GPS coordinates. Only properties explicitly approved for exact public pin locations participate in area searches. Map pin results are capped and labeled accordingly. Real Android map tiles still require a licensed/configured provider. See [Step 6 QA notes](docs/FINAL-COMPLETION-STEP-6-MAPS.md).


### Final Completion Step 7: external push acceptance

Push stays opt-in and disabled by default. Once a **real** EAS project, FCM V1 credentials, physical Android development build, and private scheduler are configured, verified users can open **Account → Push Notifications → Send a test notification**. The queue endpoint adds an in-app test notice; `pnpm ops:push --execute` sends eligible notifications and checks receipts on later runs. Lock-screen notification text is privacy-neutral and taps are scoped to the current account. `pnpm ops:push:preflight` checks the local server flag and EAS UUID, **not** the external credential vault or phone delivery. See [Step 7 runbook](docs/FINAL-COMPLETION-STEP-7-PUSH.md).


### Final Completion Step 8: renewal automation

Subscription reminders now use bounded cursor pagination and a monitored `--all` drain to prevent old first-page grants from starving newer reminders. `pnpm ops:renewals --dry-run --all` reports eligible counts without writing data; after staging sign-off, `pnpm ops:renewals --execute --all` creates deduplicated **in-app notices only**. A remaining backlog exits non-zero with a resume cursor. Paid quotas still expire exactly on schedule; the 3-day grace period does not grant premium access and existing listings are preserved. Billing remains off by default and **no automatic charges or renewals** are introduced. An external scheduler must be explicitly provisioned and monitored. See [Step 8 runbook](docs/FINAL-COMPLETION-STEP-8-SUBSCRIPTIONS.md).
