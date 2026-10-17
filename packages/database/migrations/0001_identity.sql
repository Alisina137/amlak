CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active','suspended','deleted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE agency_status AS ENUM ('pending','active','rejected','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE agency_role AS ENUM ('owner','manager','agent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE membership_status AS ENUM ('pending','active','revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE staff_role AS ENUM ('moderator','verification','billing','support','admin','super_admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), display_name varchar(100) NOT NULL,
 email varchar(254) NOT NULL UNIQUE, password_hash text NOT NULL,
 email_verified_at timestamptz, status user_status NOT NULL DEFAULT 'active',
 locale varchar(2) NOT NULL DEFAULT 'fa', advertiser_enabled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS staff (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(254) NOT NULL UNIQUE,
 display_name varchar(100) NOT NULL, password_hash text NOT NULL,
 role staff_role NOT NULL, totp_secret_encrypted text NOT NULL, last_totp_step integer NOT NULL DEFAULT 0,
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS verification_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id),
 email varchar(254) NOT NULL, purpose varchar(24) NOT NULL, secret_hash text NOT NULL,
 attempts integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL,
 sent_at timestamptz NOT NULL DEFAULT now(), consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS challenge_email_idx ON verification_challenges(email,purpose,sent_at DESC);
CREATE TABLE IF NOT EXISTS sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id),
 staff_id uuid REFERENCES staff(id), audience varchar(8) NOT NULL,
 token_hash varchar(64) NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL, revoked_at timestamptz,
 CONSTRAINT correct_session_owner CHECK ((audience='user' AND user_id IS NOT NULL AND staff_id IS NULL) OR (audience='staff' AND staff_id IS NOT NULL AND user_id IS NULL))
);
CREATE INDEX IF NOT EXISTS session_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS session_staff_idx ON sessions(staff_id);
CREATE TABLE IF NOT EXISTS agencies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(160) NOT NULL,
 province_id varchar(50) NOT NULL DEFAULT 'kabul',status agency_status NOT NULL DEFAULT 'pending',
 creator_id uuid NOT NULL REFERENCES users(id),reviewed_by uuid REFERENCES staff(id),
 reviewed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agency_creator_idx ON agencies(creator_id);
CREATE TABLE IF NOT EXISTS agency_memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), agency_id uuid NOT NULL REFERENCES agencies(id),
 user_id uuid NOT NULL REFERENCES users(id), role agency_role NOT NULL,
 status membership_status NOT NULL DEFAULT 'pending',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(agency_id,user_id)
);
CREATE INDEX IF NOT EXISTS membership_user_idx ON agency_memberships(user_id);
CREATE TABLE IF NOT EXISTS audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_type varchar(12) NOT NULL,
 actor_id uuid,action varchar(100) NOT NULL,target_type varchar(36) NOT NULL,
 target_id uuid,reason text,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_target_idx ON audit_events(target_type,target_id);
