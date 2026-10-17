# AmlakLink — Project State

- Product authority: docs/PRODUCT-SPECIFICATION.md, v1.0 (17 Oct 2026).
- Implementation process: docs/SOFTWARE-WORKFLOW-V4.md.
- Repository: Alisina137/amlak, main. Afghanistan only, Kabul-first, Android-first, Dari/Pashto/English.
- **Current phase: 2 — Identity & scoped roles.**
- Implementation: PostgreSQL identity schema and safe idempotent migration; email verification/recovery; user session lifecycle; seller activation; independent-agent applications; agency applications, scoped verified membership with explicit acceptance; staff MFA and staff-only reviews; mobile auth and professional account screens; separate protected admin panel.
- Verified locally in GitHub CI: TypeScript workspaces, API/domain and PostgreSQL tests, Next admin build, Android Expo export (consult latest workflow run for final commit result).
- Limitations: No production database credentials, SMTP provider or real-user network/device validations supplied. No SMS OTP provider validated, so registration currently uses email, consistent with specification conditional requirement. Agency document evidence workflows are in Phase 6.
- Explicit Phase 2 exclusion: money transfer, property listings or image publishing; those arrive in later phases.
- Next phase: **3 — Property inventory**, including photo uploads, structured gharawi pricing, listing wizard and moderation.
- API port: **4000**. Ngrok inspector 4040 is unrelated.
- Security: never print real OTPs on a public tunnel, never commit secrets, never grant cross-agency membership implicitly; staff logins require MFA.
