DO $$ BEGIN CREATE TYPE inquiry_status AS ENUM ('new','open','responded','closed','blocked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lead_status AS ENUM ('new','contacted','viewing','negotiating','won','lost','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE viewing_status AS ENUM ('requested','counterproposed','confirmed','declined','cancelled','completed','no_show'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS inquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 listing_id uuid NOT NULL REFERENCES listings(id),
 seeker_id uuid NOT NULL REFERENCES users(id),
 agency_id uuid REFERENCES agencies(id),
 advertiser_id uuid NOT NULL REFERENCES users(id),
 assigned_to uuid REFERENCES users(id),
 request_id uuid NOT NULL,
 status inquiry_status NOT NULL DEFAULT 'new',
 lead_status lead_status NOT NULL DEFAULT 'new',
 price_snapshot jsonb NOT NULL,
 last_message_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT inquiry_seeker_listing_unique UNIQUE(seeker_id,listing_id),
 CONSTRAINT inquiry_seeker_request_unique UNIQUE(seeker_id,request_id)
);
CREATE INDEX IF NOT EXISTS inquiry_seeker_idx ON inquiries(seeker_id,last_message_at DESC);
CREATE INDEX IF NOT EXISTS inquiry_advertiser_idx ON inquiries(advertiser_id,last_message_at DESC);
CREATE INDEX IF NOT EXISTS inquiry_agency_idx ON inquiries(agency_id,last_message_at DESC);
CREATE INDEX IF NOT EXISTS inquiry_assignee_idx ON inquiries(assigned_to,last_message_at DESC);
CREATE TABLE IF NOT EXISTS inquiry_messages(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 inquiry_id uuid NOT NULL REFERENCES inquiries(id),
 author_id uuid NOT NULL REFERENCES users(id),
 client_request_id uuid NOT NULL,
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 3000),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT message_retry_unique UNIQUE(inquiry_id,author_id,client_request_id)
);
CREATE INDEX IF NOT EXISTS message_inquiry_created_idx ON inquiry_messages(inquiry_id,created_at);
CREATE TABLE IF NOT EXISTS property_viewings(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 inquiry_id uuid NOT NULL REFERENCES inquiries(id),
 seeker_id uuid NOT NULL REFERENCES users(id),
 client_request_id uuid NOT NULL,
 proposed_slots jsonb NOT NULL,
 counter_slot timestamptz,
 confirmed_slot timestamptz,
 note varchar(500),
 status viewing_status NOT NULL DEFAULT 'requested',
 version integer NOT NULL DEFAULT 1 CHECK (version>0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT viewing_request_retry_unique UNIQUE(seeker_id,client_request_id)
);
CREATE INDEX IF NOT EXISTS viewing_inquiry_idx ON property_viewings(inquiry_id,created_at DESC);
CREATE TABLE IF NOT EXISTS inquiry_lead_notes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 inquiry_id uuid NOT NULL REFERENCES inquiries(id),
 agency_id uuid NOT NULL REFERENCES agencies(id),
 author_id uuid NOT NULL REFERENCES users(id),
 body varchar(1000) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_notes_inquiry_idx ON inquiry_lead_notes(inquiry_id,created_at);
CREATE TABLE IF NOT EXISTS user_notifications(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id),
 kind varchar(50) NOT NULL,
 title varchar(160) NOT NULL,
 reference_id uuid,
 dedupe_key varchar(150) NOT NULL,
 is_read boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT notification_recipient_dedupe_idx UNIQUE(user_id,dedupe_key)
);
CREATE INDEX IF NOT EXISTS notification_user_idx ON user_notifications(user_id,is_read,created_at DESC);
CREATE TABLE IF NOT EXISTS user_blocks(
 blocker_id uuid NOT NULL REFERENCES users(id),
 blocked_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT block_user_pair UNIQUE(blocker_id,blocked_id),
 CONSTRAINT cannot_block_self CHECK (blocker_id<>blocked_id)
);
