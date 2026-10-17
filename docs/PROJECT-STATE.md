# AmlakLink — Project State

- Product authority: AmlakLink Product & System Specification v1.0, 17 October 2026 (user-supplied document).
- Implementation process: Software Development Workflow V4 (user-supplied document).
- Product: Afghanistan-only, Kabul-first, Android-first marketplace, freemium, Dari/Pashto/English, separate admin web.
- Repository: Alisina137/amlak, main.
- Phase: **1 — Foundations**.
- Stack: pnpm workspaces; Expo SDK 57 / Expo Router / React Native; Next.js 16 admin; Fastify 5 API; TypeScript shared packages. PostgreSQL/PostGIS with Drizzle is planned for Phase 2–3 data work, not falsely configured in Phase 1.
- Phase 1 outcomes: locale and visual tokens, 34-province catalog, API contract and geo endpoints, foundation app with five tabs, standalone staff login shell and configuration templates.
- Next: Phase 2 — Identity & scoped roles, contact verification, cross-agency permissions, staff MFA.
- Verification: CI checks are defined; do not equate committed code with passing device or service tests. Run pnpm install, pnpm check and Expo smoke on user environment.
- Constraints: Never commit secrets or real verification documents. Phone auth, live listings, login and payments intentionally unavailable in Phase 1. Mobile physical-device API must use a reachable URL (tunnel to port 4000, not ngrok inspector 4040).
