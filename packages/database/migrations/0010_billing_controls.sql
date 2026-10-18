-- All adjustments are only for platform services, never real-estate deposits or escrow.
ALTER TABLE growth_payment_claims ADD COLUMN IF NOT EXISTS reconciliation_reference_hash varchar(64);
ALTER TABLE growth_payment_claims ADD COLUMN IF NOT EXISTS reconciliation_amount_afn integer;
ALTER TABLE growth_payment_claims ADD COLUMN IF NOT EXISTS reconciliation_date date;
CREATE UNIQUE INDEX IF NOT EXISTS growth_claim_reconciliation_unique
 ON growth_payment_claims(reconciliation_reference_hash);
ALTER TABLE growth_payment_claims DROP CONSTRAINT IF EXISTS growth_claim_amount_positive;
ALTER TABLE growth_payment_claims ADD CONSTRAINT growth_claim_amount_positive
 CHECK (reconciliation_amount_afn IS NULL OR reconciliation_amount_afn > 0);
CREATE TABLE IF NOT EXISTS growth_billing_adjustments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 invoice_id uuid NOT NULL REFERENCES growth_invoices(id),
 payer_id uuid NOT NULL REFERENCES users(id),
 request_id uuid NOT NULL,
 kind varchar(8) NOT NULL CHECK(kind IN ('refund','credit')),
 amount_afn integer NOT NULL CHECK(amount_afn > 0),
 reason varchar(700) NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'requested'
   CHECK(status IN ('requested','approved','rejected','settled','issued')),
 reviewed_by uuid REFERENCES staff(id),reviewed_at timestamptz,
 review_reason varchar(700),settled_by uuid REFERENCES staff(id),
 settled_at timestamptz,settlement_method varchar(20),
 settlement_reference_hash varchar(64),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT billing_adjustment_retry_idx UNIQUE(payer_id,request_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS billing_adjustment_settlement_idx
 ON growth_billing_adjustments(settlement_reference_hash);
CREATE INDEX IF NOT EXISTS billing_adjustment_invoice_idx
 ON growth_billing_adjustments(invoice_id,created_at DESC);
CREATE INDEX IF NOT EXISTS billing_adjustment_queue_idx
 ON growth_billing_adjustments(status,created_at DESC);
