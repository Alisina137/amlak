# Phase 8 — Professional Growth V1.1 (implementation in progress)

This phase is built on Phases 1–7 and **does not override the pilot launch gate** in `docs/PHASE-7-PILOT.md`. Its proposed AFN prices are **illustrations requiring Kabul agency interviews and formal approval**, not a live commercial offer.

## Delivered in the current Phase 8 branch

- Persisted, user-private structured saved searches (max 12) with explicit in-app alert opt-in, opt-out and deletion. No raw GPS or cursor in saved filter records.
- A bounded, restartable worker detecting new public saved-search matches and real same-currency asking-price reductions. Cursor includes updated timestamp and listing UUID; user notifications use a unique dedupe key tied to the approved revision. Run in **dry-run by default**.
- Guest-accessible comparison of 2–4 *public* listings without foreign exchange assumptions, price conversions or title verification; users select items in Saved.
- Invitation-only collaborative property shortlists (maximum five people including owner), verified email invitations, accept/leave/revoke, public-eligible listing additions, per-member votes and private notes. Revoked members lose read/write access; unavailable properties retain a non-revealing placeholder. Shortlist data never becomes public.
- Proposed platform subscription entitlements: solo independent agent (15 listings), agency standard (50 listings/5 seats), agency growth (200 listings/15 seats); free capacity 3. A plan only becomes active after staff-confirmed platform fee; time windows are server-side; expiry preserves existing listings, leads and permissions but blocks over-limit new submissions and invitations.
- Proposed AFN invoice and payment claim flow for **platform services only**, receipt reference deduplication, scoped billing review and audit, manual external reconciliation acknowledgement, reject/resubmit support. Confirmation activates entitlements or a seven-day featured placement within one database transaction. Already confirmed payment/claim cannot be reprocessed.
- Public sponsored results in a **separately labeled** section of Search and subject to the normal published/fresh/active-author/active-agency visibility constraints. Placement expires automatically and cannot resurrect a paused, sold, held or stale listing.
- Agency activity metrics: actual listings, public listings, captured inquiries, open inquiries and deliberate contact taps. No fabricated phone conversations, external WhatsApp completion or completed-sales claims.
- Dedicated staff billing page and separate agency reports/billing pages; ordinary users cannot call staff payment endpoints. Owner-only plan purchase; account-level solo plan is available to approved independent agents.
- Private support requests: user-only tickets, reply threads and localized mobile UI, plus separate staff-only review and replies; request-ID idempotency, five-open-ticket cap and audited staff status changes. Support does not replace urgent fraud reporting.
- Existing email-verification, moderation, staff MFA and audit rules still apply.

## Commercial and security gates

**Default: `AMLAK_BILLING_ENABLED=false`** in the root environment. This blocks invoice creation while allowing the proposed plan catalog to be inspected. Do **not** turn it on merely to test the UI. Before enabling: determine valid domestic payment instructions/provider, confirm official merchant bank/cash reconciliation procedures, publish prices and terms/refunds, perform legal/privacy review, staff billing training, and integration tests with a real bank statement. Never request property down payments, rental deposits, gharawi principal, ownership evidence or escrow through this module.

The current manual claim accepts a verifiable external receipt *reference*, not a screenshot of a bank document. Staff must independently verify the transaction before selecting Confirm and entering a meaningful reason. Receipt references are restricted to billing staff, owner invoices do not echo them, and sensitive records must be governed by a retention/access policy.

## Local developer commands

After fetching this branch and configuring root `.env`, run:

```powershell
pnpm install
pnpm db:diagnose
pnpm db:migrate
pnpm check
pnpm ops:alerts --dry-run
# Only after reviewing the matched counts, enable intentional in-app alerts:
pnpm ops:alerts --execute
```

Run `pnpm dev:api`, `pnpm dev:mobile` and `pnpm dev:admin` as usual; the API remains on **4000**. In CI, use a disposable PostgreSQL test instance. Cron scheduling of alert scans must be configured externally, e.g. every 10–30 minutes subject to actual load/rate limits.

## Acceptance checks before merging/deployment

1. API tests and typechecks pass; PostgreSQL migration applied twice without data loss.
2. No unauthenticated or cross-agency access to private searches, billing or reports.
3. Reject duplicate receipt references; rejecting a claim activates nothing; a confirmed claim activates once.
4. No placement before verified payment, and promotions disappear when expired or listing becomes unsafe/unavailable.
5. Paid limits expire without deleting data and concurrent submissions/invitations cannot cross limits.
6. Opt-out completely stops future saved-search alerts; worker retries do not duplicate notifications.
7. RTL Dari/Pashto and LTR English mobile controls, TalkBack, weak connection, low-end Android and admin MFA tested on real devices.

## Remaining Phase 8 work

- Expo **development-build push implementation is in Step 1**: token lifecycle, explicit OS permission UX, preferences, delivery tickets and receipt tracking. Still requires EAS/FCM configuration and physical-device acceptance; remote push is **disabled by default**. See docs/PHASE-8-STEP-1-PUSH.md.
- Room-labeled media and optional drawn map regions after map-provider cost validation.
- Full E2E payment review and rejection/resubmission scenarios, refund/credit policy, grace/renewal notices and real pilot pricing validation.
- Real-device accessibility/RTL QA, distribution to a controlled pilot, local business/legal validation and full production readiness review.

Do not represent Phase 8 or the marketplace as production-complete until these are finished and the Phase 7 human pilot gate is met.
