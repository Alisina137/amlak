# Phase 8 Step 4 — Verified Platform-Fee Billing, Refund and Credit Controls

## Delivered in code

- **Independent financial reconciliation required** before staff may approve an external payment claim. Staff enter the actual independently checked statement/receipt reference, exact **AFN** matched amount, statement date, written rationale and verification acknowledgement. Server rejects missing evidence, mismatched amount and reused statement identifiers. Evidence metadata stays in the finance-only history, never in public marketplace or payer responses.
- Rejected payment claims do **not** activate any plan or placement. User can inspect the review reason in a scoped receipt-history view and submit a **different** genuine payment reference for fresh review. Previously claimed payment references cannot be recycled.
- **Owner-only** adjustment requests against confirmed *AmlakLink platform-service* invoices: refund review or noncash service-credit memo, amount and explanation; idempotency request ID; aggregate pending/approved/settled/issued amounts may **not exceed the paid invoice**. Other users and staff without billing role cannot access these cases.
- Staff accept/reject adjustment requests with a reason. Approved refunds are **not cash movements** and require a **different authorized finance reviewer** to confirm external settlement with unique proof reference and an audit entry. Repeated settlement or attempted settlement by the initial reviewer is rejected.
- Approved credits become **noncash credit memos** (not fiat balances, escrow or deposits); no platform entitlement or cash transfer is automatically created, and credits **cannot yet be spent** against new invoices. Credit redemption, policy, expiry, taxation and chargeback rules need formal local legal/business signoff, which Step 4 cannot substitute.
- Finance dashboard includes adjustments queue, two-person refund settlement, verified payment history. Mobile billing displays claim decisions and reasons, adjustment requests, status history and explicit warnings. In-app billing decisions are notified without leaking payment references.

## Financial safety contract

All money is nominal AFN for AmlakLink's own optional platform services. **No property purchase, rent, advance, gharawi payment, tenant deposit, escrow or owner payout.** No bank transfer is executed by the app.

**Default `AMLAK_BILLING_ENABLED=false` stays unchanged.** This now prevents issuing new platform-fee invoices, submitting new payment claims, **and confirming previously submitted payment claims** (as hardened by Final Completion Step 9). Existing authorized users can request or review corrections on already verified historical invoices; staff can reject historical claims and independently review evidence. Actual historical confirmations require the billing feature to be explicitly enabled after finance approval. Approving a refund request alone never claims money was sent.

Existing subscription periods and promotions **are not silently deleted or retroactively revoked by a refund case**: an approved refund is a financial record, not yet an automated proration/entitlement cancellation. Refund conditions, access after reversal, fraud investigation, consumer rights, credit reuse and accounting obligations must be approved before live transactions.

## Developer commands

Run from `C:\projects\amlak` after pulling main:

```powershell
pnpm install
pnpm db:diagnose
pnpm db:migrate
pnpm check
```

The new **`0010_billing_controls.sql`** migration is necessary. Check staging first and take a database backup before migrating production.

## External acceptance gates

1. Finance staff separately verify external records for a completed payment and ensure amount, date and statement identity correspond to the payer/invoice. No payment should become confirmed from just a checkbox.
2. Verify two distinct billing staff identities for each external refund settlement; no automatic bank transfers, no duplicate refunds, and no settlement without actual transferred funds.
3. Test rejected claims and new receipt references, concurrency/unique constraints, noncash credit memos and the full refund amount ceiling.
4. Validate accounting entries with the domestic payment provider, written policies for refunds, chargebacks and credits, merchant and privacy obligations, dispute windows, evidence retention, customer disclosure and correct roles.
5. Verify RTL Dari/Pashto, English LTR, screen readers, mobile forms and finance dashboard on real pilot devices.

This implementation **does not** certify merchant readiness. Billing stays off until external local approvals and actual reconciliation pilot have passed.
