# AmlakLink — Project State

- Product authority: docs/PRODUCT-SPECIFICATION.md — AmlakLink v1.0 (17 October 2026).
- Implementation process: docs/SOFTWARE-WORKFLOW-V4.md (user-supplied).
- Product: Afghanistan-only, Kabul-first, Android-first marketplace; freemium; Dari/Pashto/English; standalone staff web.
- Repository: Alisina137/amlak, main.
- Phase: **1 — Foundations; implemented and CI verified**.
- Stack: pnpm workspaces; Expo SDK 57 / Expo Router / React Native; Next.js 16 admin; Fastify 5 API; shared TypeScript modules. PostgreSQL/PostGIS with Drizzle is planned with identity/inventory stages, not falsely represented as provisioned.
- Phase 1 delivered: three locale dictionaries + RTL/LTR text/layout support; persistent locale and Kabul/default province; searchable 34-province catalog usable offline; design tokens; Zod API contracts; GET /health, /ready, /v1/catalog/provinces and /v1/catalog/provinces/:id; five mobile tabs; separate inactive staff login shell; configuration templates; CI.
- Verification evidence: GitHub Actions run 39030736599 PASSED dependency install, all workspace TypeScript checks, Node test suites, Next admin production build, Android Expo export. Physical Android/iOS interaction and actual mobile device networking remain untested here.
- Next: Phase 2 — Identity & scoped roles, contact verification, agency association/permissions, staff MFA.
- Known limitations: real listings/authentication/search/favorites/messages are intentionally not live in Phase 1. No runtime credentials or database provisioned yet. No package lockfile committed; initial pnpm install generates it.
- Local networking: API listens on port **4000**, not ngrok inspector **4040**. The physical Android app requires EXPO_PUBLIC_API_URL set to a reachable HTTPS tunnel, or the offline province catalog works without it.
- Secrets, production identities, verification documents and payment proofs must never enter Git.
