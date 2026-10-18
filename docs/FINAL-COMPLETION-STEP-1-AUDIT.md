# AmlakLink — Final Completion, Step 1: Cross-Phase Application Audit

**Scope:** source-level implementation audit of Phases 1–8 on `main`; no production credentials, real devices, merchant or private user data were available. This is **not** an independent production penetration test or a declaration that all functionality is complete.

## Modules reviewed

| Original phase | Code and workflow inspected | Initial audit conclusion |
| --- | --- | --- |
| 1. Foundation | `apps/api/src/app.ts`, province catalog, `apps/mobile/app/_layout.tsx`, locale providers | Routes and all three languages wired; physical RTL testing still outstanding. |
| 2. Authentication | `apps/api/src/auth.ts`, `access.ts`, mobile `auth.tsx` | API session scoping and MFA are present; discovered client async refresh/account-switch risk (fixed here). |
| 3. Listings | `apps/api/src/listings.ts`, approved-revision snapshots, media contract and photo gallery | Reviewed publishing and photo ownership flow exists; upload/storage/recovery still require pilot testing. |
| 4. Discovery | `apps/api/src/discovery.ts`, `apps/mobile/app/search-map.tsx`, search state and favorites | Favorites are server-authorized, but an old response could repopulate another session's UI (fixed here). Map-provider/runtime QA is pending. |
| 5. Inquiries | `apps/api/src/engagement.ts`, `engagement.test.ts`, inbox/viewings routes | Agency reassignment could race with agent revocation (fixed here); notification for a viewing ID was routed to the inquiry route (fixed here). |
| 6. Trust/safety | `safety.ts`, `verification.ts`, staff operations and existing safety tests | Human moderation and audit workflows exist; live staff escalation and appeal coverage still need a staffed pilot. |
| 7. Pilot | `pilot.ts`, backup/restore tooling, `docs/PHASE-7-PILOT.md` and smoke/CI | Pilot and backup tools exist. Kabul onboarding, restore rehearsal and physical handset results are **not evidenced** in source control. |
| 8. Growth | `growth.ts`, `billing.ts`, `subscription-worker.ts`, `push-client.ts`, `agency-performance.ts` and Step 1–6 runbooks | Growth features are coded. Billing/push intentionally gated; schedules, finance documents and EAS/FCM devices are outstanding. |

## Step 1 fixes delivered

1. **Session-switch isolation:** asynchronous `/v1/me`, login and verification responses cannot repopulate a client session after logout or an intervening credential switch.
2. **Saved-property isolation:** favorites are keyed to the signed-in session and obsolete GET responses cannot replace a new account's saved list.
3. **Inbox privacy:** message, viewing and alert collections render only with data fetched for the **currently active** session, and stale polling responses are discarded.
4. **Agency membership isolation:** the account workspace shows agencies only for the current token, not the previous account while data refreshes.
5. **Lead assignment authorization:** assignment and member revocation share an agency-scoped transaction lock; both the manager and assignee are checked after the lock, and an already assigned member receives no duplicate assignment alert. Agency revocation clears assigned leads atomically.
6. **Notification navigation:** a viewing alert carries a viewing UUID, which now opens `/viewings/[id]` instead of trying to load it as an inquiry.
7. **Regression coverage:** extend the PostgreSQL agency inquiry test with concurrent assignment vs. member revocation and denied post-revocation reassignment.

## Remaining gaps, deliberately assigned to later steps

| Future step | Verified limitation / external gap | Why not marked complete here |
| --- | --- | --- |
| 2 — UI/RTL | Multiple mobile strings still fall back to Dari; narrow-phone forms, focus, dynamic font and accessibility were not fully tested | Needs a cross-screen localization/accessibility pass and physical screenshots. |
| 3 — Offline | GET fallback/retry exists, but stateful reconnect/image upload and slow-data behavior require network simulation | Real offline/retry behavior cannot be verified by static analysis. |
| 4 — Authentication | Real SMTP, MFA delivery and further token/account-switch adversarial testing | Provider credentials and live account scenarios are external. |
| 5 — Storage | S3 media retention, encrypted backup schedule and true isolated staging restore | CI does not prove an external restore or uploaded image recovery. |
| 6 — Maps | Custom-drawn map regions optional; map provider cost/license, pin privacy and device fallback need validation | Needs licensed map provider and UI acceptance. |
| 7 — Push | Expo/EAS/FCM development-build delivery, device permissions, token ownership and cold start | Push is OFF by default and cannot be certified in Expo Go. |
| 8 — Subscriptions | Worker scheduling/monitoring and real expiration/grace transitions | No production job scheduler configured from code. |
| 9 — Billing | Real bank statement reconciliation, refund rules, noncash-credit redemption policy and legal review | Billing OFF by default. No in-app property deposits/escrow. |
| 10 — Android | At least two actual Android devices with low-bandwidth/RTL/TalkBack and full journeys | Android bundle compilation is not handset testing. |
| 11 — Kabul pilot | 10 active agencies, 150 confirmed listings, availability and seven days of real incidents/usage | Code cannot invent real pilot evidence. |
| 12 — Release | Release sign-off, encryption key custodians, incident rota, map/media contracts and legal review | `pnpm qa:release` is a fail-closed **preflight**, not automatic approval. |

## Verification and reproducibility

- `pnpm check` — workspace TypeScript and API/database/unit/integration tests.
- GitHub Actions — database migrations (including repeat migration), web admin build, Expo Android export and Phase 8 static preflight.
- `pnpm qa:phase8` — automated gate (does **not** authorize production).
- `pnpm pilot:smoke` — public read-only API smoke check against a running server at port **4000**.

**No new SQL migration.** Code changes in this audit must pass the existing CI and concurrency regression test before merge. Later steps must be evaluated separately before any claim that Phases 7 and 8 are fully accepted.
