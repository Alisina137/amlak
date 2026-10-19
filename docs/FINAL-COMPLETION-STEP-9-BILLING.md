# AmlakLink — Final Completion Step 9: Billing and Payment Safety

## Engineering improvements

- **Billing remains disabled by default** via `AMLAK_BILLING_ENABLED=false`. When disabled, the API now blocks new payment claims and staff confirmation of pending claims, in addition to existing invoice creation restrictions. This closes a route that could otherwise activate paid entitlements while billing was paused.
- Finance staff may still reject pending historical claims and process existing refund/credit cases while billing is paused. Read-only history remains available.
- Identical invoice requests now reuse their original invoice if concurrent network requests share a request ID. A reused ID with different attributes remains an error.
- The mobile billing screen retains an invoice request ID after an unknown network outcome, avoiding a duplicate new invoice on retry.
- Refund/credit requests similarly reuse the same ID when retrying an unchanged request. Account-switch isolation protects private adjustment and claim history from delayed older responses.
- Added a **staff-only, read-only billing exception report**: confirmed invoices without a claim, confirmed claims with incomplete reconciliation metadata, paid subscriptions without entitlement rows, paid promotions without placements, and settled refund records missing required settlement metadata. Each category is capped at 50 IDs; these are internal warning indicators, not independent account verification.
- The admin finance panel displays these warnings alongside the existing platform fee reconciliation totals.
- The new `pnpm qa:billing` guard is included in CI, and database-backed API regression tests cover disabled billing, role-based access, claims and adjustment workflows.

## Existing safeguards

Independent external payment verification with amount, date and reference is required for a paid claim; the system cannot send real payments. Adjustment amounts cannot exceed the original platform invoice. Settled refunds require review by a separate authorized finance staff member and evidence of a transfer conducted outside the app. Service credits remain noncash memos and cannot be spent, refunded automatically, or used to activate subscription privileges.

The product handles platform-service fees only; it never handles property purchase, rental deposits or escrow.

## Local verification

```powershell
git pull origin main
pnpm db:diagnose
pnpm db:migrate
pnpm qa:billing
pnpm check
pnpm dev:api
```

No new SQL migration was added in Step 9. The earlier `0010_billing_controls.sql` migration must already be applied.

## Remaining real-world acceptance

Use staging accounts and test the full paid claim, approval, rejection, refund, adjustment and audit sequence. Validate duplicate attempts, concurrency, finance-role permissions, EAS notification privacy and three-language interfaces. Review local merchant, refund, accounting, tax, privacy and retention policies with appropriately authorized professionals. Actual provider account statements, payout proof and physical Android tests have not been verified by this GitHub change.

**Release remains blocked** until independent real-world finance/legal acceptance. Leave billing disabled until approval.

### Additional Step 9 exception checks

The read-only staff exception report now also flags (with at most 50 invoice/entitlement IDs per category) confirmed platform invoices whose stored AFN amount no longer matches the configured product catalog, and entitlement rows linked to an invoice that is not confirmed. These checks detect internal consistency problems only; they do not prove a bank transfer, authorize a refund, or automatically change financial records. Investigate every finding against independent external evidence before making a manual, audited correction.

Run `pnpm qa:billing` and `pnpm check` after pulling. Existing migration `0010_billing_controls.sql` is still required; this change introduces no migration.
