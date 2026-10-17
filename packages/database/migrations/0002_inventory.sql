DO $$ BEGIN CREATE TYPE listing_status AS ENUM ('draft','pending_review','published','paused','sold','rented','rejected','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE publisher_kind AS ENUM ('private','independent_agent','agency'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE revision_status AS ENUM ('draft','submitted','approved','rejected','withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS listings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 author_id uuid NOT NULL REFERENCES users(id),
 agency_id uuid REFERENCES agencies(id),
 publisher publisher_kind NOT NULL,
 client_request_id uuid NOT NULL,
 status listing_status NOT NULL DEFAULT 'draft',
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 current_revision_id uuid,
 approved_revision_id uuid,
 last_confirmed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz,
 CONSTRAINT publisher_agency_consistent CHECK ((publisher='agency' AND agency_id IS NOT NULL) OR (publisher <> 'agency' AND agency_id IS NULL)),
 CONSTRAINT listing_create_idempotency UNIQUE(author_id,client_request_id)
);
CREATE INDEX IF NOT EXISTS listing_author_status_idx ON listings(author_id,status);
CREATE INDEX IF NOT EXISTS listing_agency_status_idx ON listings(agency_id,status);
CREATE INDEX IF NOT EXISTS listing_public_idx ON listings(status,published_at DESC);
CREATE TABLE IF NOT EXISTS listing_revisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 listing_id uuid NOT NULL REFERENCES listings(id),
 sequence integer NOT NULL CHECK(sequence>0),
 status revision_status NOT NULL DEFAULT 'draft',
 data jsonb NOT NULL,
 moderator_id uuid REFERENCES staff(id),
 reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 CONSTRAINT revision_sequence_unique UNIQUE (listing_id,sequence)
);
CREATE INDEX IF NOT EXISTS revision_queue_idx ON listing_revisions(status,created_at);
CREATE TABLE IF NOT EXISTS listing_photos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 listing_id uuid NOT NULL REFERENCES listings(id),
 uploader_id uuid NOT NULL REFERENCES users(id),
 storage_key text NOT NULL,
 storage_mode varchar(16) NOT NULL,
 content_type varchar(50) NOT NULL DEFAULT 'image/webp',
 bytes integer NOT NULL CHECK(bytes>0),
 width integer NOT NULL CHECK(width>0),
 height integer NOT NULL CHECK(height>0),
 fingerprint varchar(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photos_listing_idx ON listing_photos(listing_id);
CREATE INDEX IF NOT EXISTS photos_fingerprint_idx ON listing_photos(fingerprint);
