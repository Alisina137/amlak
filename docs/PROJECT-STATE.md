# AmlakLink — Project State

- **Source of truth:** docs/PRODUCT-SPECIFICATION.md v1.0, docs/SOFTWARE-WORKFLOW-V4.md.
- Repository: Alisina137/amlak, main. Afghanistan-only and Kabul-first; Expo Android-first (Dari/Pashto/English).
- **Phase 1:** Foundation + locale, provinces, navigation and API.
- **Phase 2:** Verified accounts, RBAC, agency membership and staff MFA.
- **Phase 3:** Database-backed property listings, draft photo wizard, sale/rent/gharawi, moderated publishing and approved snapshot revisions.
- **Phase 4:** Server-side discovery and filters, price-aware sort/cursor pagination, public map pins only with explicit exact coordinates, persistent search state, private user favorites with guest save intent, direct call/WhatsApp tap actions, public advertiser/agency profiles with verification-scope descriptions.
- **Phase 5:** User inquiry threads, retry-safe messages, viewed appointment proposals/confirmation/counterproposals/cancellation, agency lead assignment and notes, scoped notifications, blocking and inactivity cancellations.
- **CI:** PostgreSQL migrations, API/unit/integration tests, TypeScript workspace check, Next admin build and Android export. Consult latest workflow action for final commit.
- **Still requires local operational validation:** user's own Neon database and migration, email delivery, image bucket, physical Android Expo Go testing, external phone/WhatsApp apps, production map SDK key/tile license and network availability.
- **Next: Phase 6:** Verification, fraud reporting, appeals and case management.
- API port **4000**, ngrok inspector is **4040** only; no paid AI, property payments or ownership guarantees in MVP.
