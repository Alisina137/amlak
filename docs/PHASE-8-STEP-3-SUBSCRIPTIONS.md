# Phase 8 — Step 3: Subscription Lifecycle (implementation)

## Included
- Server-side current paid entitlement, forthcoming **confirmed** subscription, expiration countdown, grace and expired state in `GET /v1/entitlements`. Existing `plan`, `listingLimit`, `seatLimit`, and `expiresAt` fields remain compatible.
- Renewals are **NOT auto-charged**. A payer chooses a new platform-service invoice and submits an independently verifiable external payment claim; authorized billing staff confirm before a new entitlement is scheduled. Confirmation transaction serializes grants per agency or independent agent to prevent paid periods from accidentally overlapping.
- Renewal is scheduled to start at the **latest confirmed entitlement expiry** if coverage is still paid; otherwise it starts at time of staff confirmation. Switching from a higher to a lower tier therefore takes effect **at the scheduled boundary**, never halfway through an existing paid period.
- Explicit **three-calendar-day renewal window** after a period expires. This is a **grace window for communication/reconciliation**, not a paid subscription extension: effective quotas revert immediately to the free plan at expiry. Already published listings, active agency memberships, inquiries, leads, and conversation history are preserved. Newly submitted listings and accepted invitations cannot bypass the current free-tier capacity.
- Mobile owner/agent plan screen shows active or free tier, expiry, days remaining, a queued paid plan with upcoming start date, grace days remaining, notices, and renewal guidance. Dari/Pashto/English.
- Scheduled in-app notices for expiry at approximately seven, three and one day, grace commencement, grace ending and expiration. Agency notifications go only to **active owner** accounts; solo notifications only to the plan user. Stale past reminders are not sent in a catch-up burst. Alerts are deduplicated by entitlement and notice stage. A pre-confirmed renewal covering expiry suppresses expiry warnings. Inbox/push deep links go to the scoped plan page.
- Bounded dry-run/execute operations script and API/integration regression tests.

## Policy and commercial safety
- **Billing remains disabled by default** (`AMLAK_BILLING_ENABLED=false`), as required by local payment, merchant, licensing, pricing and refund verification. Read-only subscription status works regardless. This step does not activate recurring subscriptions, charge cards, automatically issue invoices or reimburse anyone.
- No unverified paid quota in grace. A downgraded/expired agency retains access to existing members and historic data, but future invitations/accepted invites and new listing submissions obey current limits.
- Existing property listing visibility remains governed by published status, freshness, fraud/safety and author/agency active checks; a lapse in an AmlakLink platform fee **does not automatically hide old published listings**.
- Automation creates **in-app notices only**, which may subsequently be delivered by the explicitly opted-in Step 1 push worker if configured.

## Runbook

From the repository root:
```powershell
pnpm install
pnpm db:diagnose
pnpm db:migrate
pnpm check
pnpm ops:renewals --dry-run
# Enable intentionally after inspecting reminders and user scopes:
pnpm ops:renewals --execute
```

`pnpm ops:renewals` has no implicit automatic scheduler; deploy it as a separate periodic job (e.g. every 12–24 hours) once staging trials have passed. `--dry-run` writes nothing. No new database migration is required for Step 3.

## Required external acceptance
- Test real owner and agent accounts in Dari/Pashto RTL and English LTR and inspect dates using Kabul locale.
- Test concurrent staff confirmations for multiple verified invoices under one beneficiary; ensure no overlap and no quota increase until the future effective date.
- Test on-boundary expiry, pending invitation acceptance after downgrade, historical data preservation and grace start/end.
- Review grace semantics, legal pricing terms and full refund/credit policies with local business/legal owners. Test actual payment reconciliation before enabling invoicing.

**Not a production release.** Phase 7 pilot acceptance and Phase 8 billing verification still remain.
