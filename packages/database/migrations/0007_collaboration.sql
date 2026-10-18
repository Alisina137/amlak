-- Invitation-only collaborative shortlists; no public endpoint exposes this data.
CREATE TABLE IF NOT EXISTS shared_shortlists(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES users(id),
 title varchar(100) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shortlist_owner_idx ON shared_shortlists(owner_id);
CREATE TABLE IF NOT EXISTS shared_shortlist_members(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shortlist_id uuid NOT NULL REFERENCES shared_shortlists(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id),
 status varchar(12) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','revoked')),
 created_at timestamptz NOT NULL DEFAULT now(),joined_at timestamptz,
 CONSTRAINT shortlist_member_unique UNIQUE(shortlist_id,user_id)
);
CREATE INDEX IF NOT EXISTS shortlist_member_user_idx ON shared_shortlist_members(user_id,status);
CREATE TABLE IF NOT EXISTS shared_shortlist_items(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shortlist_id uuid NOT NULL REFERENCES shared_shortlists(id) ON DELETE CASCADE,
 listing_id uuid NOT NULL REFERENCES listings(id),
 added_by uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT shortlist_item_unique UNIQUE(shortlist_id,listing_id)
);
CREATE INDEX IF NOT EXISTS shortlist_items_created_idx ON shared_shortlist_items(shortlist_id,created_at);
CREATE TABLE IF NOT EXISTS shared_shortlist_votes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 item_id uuid NOT NULL REFERENCES shared_shortlist_items(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id),
 vote varchar(12) NOT NULL CHECK(vote IN ('interested','pass')),
 note varchar(500) NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT shortlist_vote_unique UNIQUE(item_id,user_id)
);
