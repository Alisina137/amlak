DO $$ BEGIN CREATE TYPE report_reason AS ENUM ('false_price','inaccurate_details','unavailable','duplicate','impersonation','inappropriate_media','suspected_fraud','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE safety_case_status AS ENUM ('open','triaged','investigating','resolved','rejected','appealed','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS safety_hold boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS safety_reports(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),listing_id uuid NOT NULL REFERENCES listings(id),
 reporter_id uuid NOT NULL REFERENCES users(id),request_id uuid NOT NULL,reason report_reason NOT NULL,
 details varchar(2000) NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT safety_report_retry_idx UNIQUE(reporter_id,request_id)
);
CREATE INDEX IF NOT EXISTS safety_report_listing_idx ON safety_reports(listing_id,created_at DESC);
CREATE TABLE IF NOT EXISTS safety_cases(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),listing_id uuid NOT NULL REFERENCES listings(id),
 report_id uuid REFERENCES safety_reports(id),status safety_case_status NOT NULL DEFAULT 'open',
 severity varchar(10) NOT NULL DEFAULT 'normal' CHECK (severity IN ('normal','high')),
 assigned_to uuid REFERENCES staff(id),resolution text,version integer NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),resolved_at timestamptz,
 CONSTRAINT safety_case_report_idx UNIQUE(report_id)
);
CREATE INDEX IF NOT EXISTS safety_case_state_idx ON safety_cases(status,created_at DESC);
CREATE INDEX IF NOT EXISTS safety_case_listing_idx ON safety_cases(listing_id,created_at DESC);
CREATE TABLE IF NOT EXISTS safety_appeals(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),case_id uuid NOT NULL REFERENCES safety_cases(id),
 appellant_id uuid NOT NULL REFERENCES users(id),reason varchar(2000) NOT NULL,
 decision varchar(12) CHECK (decision IS NULL OR decision IN ('upheld','overturned')),
 reviewer_id uuid REFERENCES staff(id),review_reason varchar(1000),
 reviewed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT safety_appeal_case_once_idx UNIQUE(case_id)
);
CREATE TABLE IF NOT EXISTS verification_records(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),subject_kind varchar(12) NOT NULL CHECK(subject_kind IN ('user','agency','listing')),
 subject_id uuid NOT NULL,scope varchar(40) NOT NULL CHECK(scope IN ('identity_reviewed','agency_registration_reviewed','professional_application_reviewed','listing_authorization_reviewed')),
 method varchar(80) NOT NULL,result varchar(20) NOT NULL CHECK(result IN ('approved','rejected','expired','revoked')),
 reviewer_id uuid NOT NULL REFERENCES staff(id),review_reason varchar(1000) NOT NULL,
 expires_at timestamptz,reviewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verification_subject_idx ON verification_records(subject_kind,subject_id,reviewed_at DESC);
CREATE TABLE IF NOT EXISTS duplicate_candidates(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),listing_id uuid NOT NULL REFERENCES listings(id),
 other_listing_id uuid NOT NULL REFERENCES listings(id),status varchar(12) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','distinct','duplicate')),
 rationale varchar(200) NOT NULL,reviewed_by uuid REFERENCES staff(id),review_reason varchar(500),
 reviewed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT duplicate_pair_unique_idx UNIQUE(listing_id,other_listing_id),
 CONSTRAINT duplicate_pair_order CHECK(listing_id<other_listing_id)
);
CREATE INDEX IF NOT EXISTS duplicate_status_idx ON duplicate_candidates(status,created_at DESC);
