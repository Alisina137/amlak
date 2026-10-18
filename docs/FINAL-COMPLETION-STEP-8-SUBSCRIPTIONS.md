# AmlakLink — Final Completion Step 8: Subscription Automation

## Scope and safety boundaries

This step hardens the *already-implemented* professional subscription lifecycle. It **does not** enable billing, make a recurring charge, auto-create invoices, pay a refund, or silently renew an expired plan.

- **Active:** verified paid entitlement still within its confirmed dates; paid listing and agency-seat capacities apply.
- **Grace:** the 72-hour period after expiry is informational. **Free limits apply from the exact expiry instant**, even in grace. Existing published listings, members, inquiries, and conversation history are preserved.
- **Expired:** the grace period ended. Free limits continue. No deletion or automatic unpublishing.
- **Future confirmed plan:** paid entitlement activates only when its verified scheduled start time arrives. A planned downgrade is deferred to that boundary.
- **Renewal notices:** in-app reminders around seven, three and one day before expiry, and at grace start, grace ending and expiry. Users may receive opt-in push only if a separately configured Step 7 worker sends them.

## Engineering changes

1. **Large-queue pagination and alerts:** the prior worker always read the first 100 expiring grant records. In large installations it could repeatedly scan the same records and starve the rest. Step 8 adds stable descending expiry+ID keyset pagination with validated opaque cursor, up to 100 grants per page, `hasMore` and `nextCursor`. Operators may use `--all` for up to **20 pages (2,000 records)** per execution. If anything remains, the job returns non-zero exit **2** and prints the resume cursor so monitoring notices the backlog rather than claiming completion.
2. **Prevent stale renewal warnings:** prior scans suppressed notices only if a paid replacement started at or before the old entitlement expired. Someone who renewed after a short gap could still receive an obsolete "plan expired" message. Now **any subsequently confirmed entitlement with a later expiry** supersedes that old grant for reminder purposes.
3. **Concurrent billing/renewal safety:** reminder creation is in a database transaction using the **same advisory beneficiary lock** as staff confirmation of a subscription invoice. A concurrently confirmed renewal will not be followed by an outdated warning. Per-recipient/per-stage deduplication remains in place.
4. **Read-only dry run:** `--dry-run` never writes user notifications. No subscription, invoice, payment claim or paid quota is modified by either dry-run or execute. Execution inserts only private in-app notices for eligible active agency owners or solo users.
5. **Current UI status:** the professional billing screen refreshes plan and grace/quota information when the app returns to foreground and every hour while active. Requests completed for an old user or agency scope cannot repopulate a different account's invoices or entitlement status.
6. **Regression tests:** unit tests verify cursor validation, current-vs-expired limits and grace semantics; PostgreSQL tests cover paging, owner-only scope, deduplication, concurrent/in-progress renewal suppression and a renewal after a service gap. CI includes a dedicated static automation-policy guard.

## Commands

From `C:\projects\amlak`:

```powershell
git pull origin main
pnpm check
pnpm qa:renewals
pnpm ops:renewals --dry-run --all
```

The above **does not send a reminder**. Only after verifying the recipients, account/agency roles, notification volume and the database environment:

```powershell
pnpm ops:renewals --execute --all
```

For controlled paging:

```powershell
pnpm ops:renewals --dry-run --limit=50
# If hasMore=true, copy the exact nextCursor from the result:
pnpm ops:renewals --dry-run --limit=50 --cursor=<opaque-cursor>
```

**Scheduling:** configure an externally monitored private scheduled job every 12–24 hours (for example an authorized server cron, container scheduler or Task Scheduler). The command should be `pnpm ops:renewals --execute --all`. It must load the correct private database environment, have a single accountable operator, capture only non-sensitive metrics, alert on exit code 1 or 2, and support manual replay. Do **not** place the production DB URL or banking credentials into a public workflow file. The application does **not** schedule this automatically.

**No new SQL migration.** Run earlier project migrations, including the Phase 8 growth schema, before operating on a real DB.

## Verification and production limitations

- Automated CI proves that the code compiles and tests pass on an isolated PostgreSQL service. It does not prove a scheduled production job is running.
- Test expiry at the exact UTC boundary and across Kabul time presentation. Grace ends precisely 72 hours later; free listing/seat limits must hold throughout.
- Confirm that a future **paid downgrade** activates at its confirmed start, never sooner, and that a post-gap paid renewal suppresses stale alerts.
- Run two jobs concurrently against staging to verify per-recipient stage deduplication and no doubled reminders; confirm disabled/suspended users and revoked agency owners are excluded.
- Simulate more than 100 expiring paid plans, verify pagination progresses and exit 2 is raised for an intentionally uncompleted batch. Audit job records and delivery metrics.
- With billing off, plan and past entitlement information remains readable, but claims cannot activate paid benefits. Actual finance/legal review and independent external payment reconciliation are Step 9 gates.
- Android localization, expiry timers after resumed foreground, and real opt-in push delivery need physical-device acceptance (Steps 10–12).

**Step 8 engineering completion != operational sign-off.** Real workers, real paying customers and merchant/legal acceptance remain external.
