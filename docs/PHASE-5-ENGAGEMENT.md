# Phase 5 — Inquiries, Conversations & Property Viewings

**Product authority:** `docs/PRODUCT-SPECIFICATION.md` Phase 5, P-06/P-07/P-09/P-10, F-05/F-06/F-10, RULE-021–023, RULE-025–026, RULE-040–043.

**Implementation:** PostgreSQL-backed authenticated messages, inquiries/leads, viewing requests, owner counterproposals, in-app notification inbox, tenant-scoped agency management, block protections, and mobile screens. This does not accept property purchase payments or create legally binding contracts.

## User journeys

1. A guest can browse properties as before. To use Ask About Property, the user signs in with a verified email.
2. A verified user opens a currently published property and sends an inquiry. A conversation is created once per listing and seeker; repeated client request IDs do **not** create extra threads/messages.
3. The seeker and authorized private owner, or active agency owner/manager/assigned agent, can exchange messages within the inquiry. Last messages and statuses appear in the Inbox, refreshed while focused.
4. A seeker can suggest **2–3** future viewing times, all interpreted using **Asia/Kabul (UTC+04:30)** and stored as UTC instants. The request remains `requested` until the advertiser explicitly confirms.
5. The advertiser may confirm one requested time, propose an alternative, or decline. A seeker must actively accept a counterproposal. Either party may cancel. A completed or missed viewing can be marked only after its confirmed time by an advertiser. Version checks prevent applying stale decisions, and per-listing advisory locks reject double-confirming the exact same time slot.
6. Closing a listing as sold/rented cancels future pending and confirmed visit records; pausing cancels pending requests while preserving already-confirmed visits. Both parties receive in-app notices.
7. Agency managers/owners can view their agency's inquiry board, assign an **active member** to a lead, and track status. Agents can access only assigned threads and attached agency-private notes. A revoked membership immediately removes agency access. A user can block another user, preventing further messages and viewing actions.
8. The in-app Notifications tab shows a private per-account record of new inquiries, new messages, viewing decisions, cancellations, and assignments; users can mark one or all as read.

## Database and API

New migration: `packages/database/migrations/0004_engagement.sql`. It creates:
- `inquiries` — property/seeker pair, publisher scope, assignment, inquiry and lead statuses, **price snapshot**, idempotency.
- `inquiry_messages` — protected conversation messages, unique request IDs, timestamps.
- `property_viewings` — 2–3 submitted UTC times, a single confirmed time, counterproposal, version, and status.
- `inquiry_lead_notes` — **agency only**, never returned in seeker APIs.
- `user_notifications` — scoped, deduplicated in-app alerts (no push permission required).
- `user_blocks` — account-level communication block list.

Important routes:
- `POST /v1/properties/:id/inquiries`, `GET /v1/inquiries`, `GET /v1/inquiries/:id`
- `POST /v1/inquiries/:id/messages`, `/close`, `/reopen`
- `POST /v1/inquiries/:id/viewings`, `GET /v1/viewings`, `POST /v1/viewings/:id/decision`
- `POST /v1/inquiries/:id/assign`, `/lead-status`; `GET/POST /v1/inquiries/:id/lead-notes`
- `GET /v1/notifications`; `POST /v1/notifications/:id/read`, `/read-all`
- `POST/DELETE /v1/users/:id/block`

## Run locally

```powershell
cd C:\projects\amlak
git pull origin main
pnpm install
pnpm db:diagnose
pnpm db:migrate
pnpm dev:api
```

Use `pnpm dev:mobile` in another terminal. **API is port 4000**; ngrok inspector is port 4040. Configure Expo's public API URL with your port-4000 HTTPS tunnel as in Phases 2–4. Reuse the root `.env` (Neon connection, SMTP, media). The new migration is additive.

**Important:** Previous reports indicated a Neon `CONNECT_TIMEOUT` on your Windows device. Run `pnpm db:diagnose` before migration. If your Neon endpoint's raw 5432 port is blocked, try `DATABASE_TRANSPORT=websocket` in the root `.env` as described in `docs/DATABASE-CONNECTIVITY.md`. The CI's temporary PostgreSQL database does **not** confirm that your Neon instance is reachable.

## Verification

CI runs `pnpm --filter @amlaklink/database migrate`, `pnpm check`, Next.js admin build, and Android Expo bundle against temporary PostgreSQL. New tests cover:
- one inquiry per seeker/property, retry-safe first message, role-scoped replies, blocked participants;
- inquiry price snapshot and private read isolation;
- requested→confirmed and requested→cancelled viewing lifecycle with version conflicts;
- two seekers requesting the same time; only one may be confirmed for an identical listing/time;
- agency lead assignment, notes privacy, and membership revocation;
- pending/confirmed visits when listings pause/close.

Do not claim physical Android device or provider-level notification delivery verified by CI. In-app notifications persist in PostgreSQL and refresh when the app is focused; **no OS push, delivery guarantees, live read receipts, voice calls, attachments or external calendar integration** are implemented in this phase.

## Deferred

Phase 6: moderation abuse reports, fraud cases, identity verification, appeals, advanced safety workflows. Phase 7: background reconciliation/durable notification delivery, low-bandwidth QA, reliability. Phase 8: subscriptions, enhanced CRM, opt-in push in development builds. Do not treat lead `won` as confirmed sale or property payment.
