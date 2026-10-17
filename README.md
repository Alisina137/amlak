# AmlakLink / املاک لینک

Android-first Afghanistan-only real estate marketplace (Dari, Pashto, English), with separate staff administration. Kabul is the default province; all 34 provinces are searchable.

**Current milestone:** Phase 1 — Foundations. Property listing, accounts and live search have not been activated. No pretend listings or working sign-in forms.

## Apps

- apps/mobile — Expo SDK 57 + Expo Router, five-tab foundation with persistent language/province, and offline province search.
- apps/api — Fastify API, live health/readiness and province catalog endpoints on **port 4000**.
- apps/admin — Next.js separate staff login shell; authentication securely deferred to Phase 2.

## Shared packages

- packages/catalog — 34 Afghanistan provinces with localized names, aliases and search.
- packages/localization — Dari (default), Pashto, English and RTL helpers.
- packages/contracts — validated API data contracts.
- packages/design-tokens — shared spacing, colors and typography.

## Run on Windows

From the existing local amlak folder (clone here only if it is empty):

    corepack enable
    corepack pnpm install
    corepack pnpm dev:api

Use separate terminals for corepack pnpm dev:mobile and corepack pnpm dev:admin.
For Android Expo Go, configure apps/mobile/.env with EXPO_PUBLIC_API_URL pointing to an HTTPS ngrok tunnel to localhost:4000. **4040 is ngrok's inspector, not the backend port.**

See docs/GETTING-STARTED.md and docs/PROJECT-STATE.md.

No private keys, passwords, payment receipts or identity documents belong in the repository.
