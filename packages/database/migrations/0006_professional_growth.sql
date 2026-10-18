-- Phase 8 foundation. Rerunnable SQL; money refers ONLY to AmlakLink platform fees.
CREATE TABLE IF NOT EXISTS saved_searches(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES users(id),
 title varchar(80) NOT NULL,filters jsonb NOT NULL,alerts_enabled boolean NOT NULL DEFAULT false,
 last_scanned_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saved_search_owner_idx ON saved_searches(user_id,created_at);
CREATE TABLE IF NOT EXISTS growth_invoices(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),payer_id uuid NOT NULL REFERENCES users(id),
 agency_id uuid REFERENCES agencies(id),listing_id uuid REFERENCES listings(id),
 request_id uuid NOT NULL,product_code varchar(32) NOT NULL,
 amount_afn integer NOT NULL CHECK(amount_afn>0),
 status varchar(16) NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid','submitted','confirmed','rejected')),
 reviewed_by uuid REFERENCES staff(id),reviewed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT growth_invoice_retry_idx UNIQUE(payer_id,request_id),
 CONSTRAINT growth_invoice_scope_chk CHECK ((agency_id IS NULL) OR (listing_id IS NULL))
);
CREATE INDEX IF NOT EXISTS growth_invoice_owner_idx ON growth_invoices(payer_id,created_at DESC);
CREATE TABLE IF NOT EXISTS growth_payment_claims(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),invoice_id uuid NOT NULL REFERENCES growth_invoices(id),
 submitted_by uuid NOT NULL REFERENCES users(id),method varchar(20) NOT NULL,
 reference varchar(120) NOT NULL,reference_hash varchar(64) NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','confirmed','rejected')),
 review_reason varchar(700),reviewed_by uuid REFERENCES staff(id),reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),CONSTRAINT growth_claim_reference_idx UNIQUE(reference_hash)
);
CREATE INDEX IF NOT EXISTS growth_claim_queue_idx ON growth_payment_claims(status,created_at);
CREATE TABLE IF NOT EXISTS growth_entitlements(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),invoice_id uuid NOT NULL UNIQUE REFERENCES growth_invoices(id),
 agency_id uuid REFERENCES agencies(id),user_id uuid REFERENCES users(id),
 plan_code varchar(32) NOT NULL,seat_limit integer NOT NULL,listing_limit integer NOT NULL,
 starts_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,
 CONSTRAINT growth_entitlement_scope_chk CHECK ((agency_id IS NULL) <> (user_id IS NULL)),
 CONSTRAINT growth_entitlement_period_chk CHECK (expires_at>starts_at)
);
CREATE INDEX IF NOT EXISTS growth_entitlement_agency_idx ON growth_entitlements(agency_id,expires_at);
CREATE INDEX IF NOT EXISTS growth_entitlement_user_idx ON growth_entitlements(user_id,expires_at);
CREATE TABLE IF NOT EXISTS growth_promotions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),invoice_id uuid NOT NULL UNIQUE REFERENCES growth_invoices(id),
 listing_id uuid NOT NULL REFERENCES listings(id),starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,CONSTRAINT growth_promotion_period_chk CHECK(ends_at>starts_at)
);
CREATE INDEX IF NOT EXISTS growth_promotion_live_idx ON growth_promotions(starts_at,ends_at);
