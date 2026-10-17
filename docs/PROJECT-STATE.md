# AmlakLink — Project State

- **Authority:** docs/PRODUCT-SPECIFICATION.md v1.0 (17 October 2026); docs/SOFTWARE-WORKFLOW-V4.md.
- Repository: Alisina137/amlak, main; Afghanistan-only / Kabul-first, mobile Android-first, Dari/Pashto/English.
- **Current delivery: Phase 3 — Property inventory.**
- **Phase 1 completed:** workspaces, localizations/RTL, 34 Afghan provinces, API, staff admin shell.
- **Phase 2 completed:** email verified auth, secure sessions, seller/independent agent activation, reviewed agencies, scoped memberships, staff MFA.
- **Phase 3 delivered:** structured listing schema+revisions+photos, genuine image upload with local/S3 storage, type-dependent prices/gharawi, 8-step mobile wizard, draft autosave+resume, staff moderation queue, public details/initial feed, pause/resume/close, review-safe edits, audit, database integration tests.
- **Verification:** GitHub Actions: PostgreSQL migrations, unit/API/database auth and inventory tests, TypeScript, Next.js production build, Android export; refer to latest successful workflow run for exact hash.
- **External work still required:** Configure own Neon DB, SMTP and photo bucket in .env; run migration locally; verify actual Android photo picker and physical-device network; provision moderator in admin; evaluate media provider + safe backups. No production environment was changed.
- **Next documented milestone: Phase 4 — Discovery & seeker experience** (filters, map/list, favorites, calls/WhatsApp, professional profiles and badge scopes).
- Constraints: API port 4000, ngrok inspector 4040 is not backend; private exact addresses/documents must not leak; no property payments or ownership promises.
