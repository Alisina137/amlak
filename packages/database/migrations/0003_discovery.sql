CREATE TABLE IF NOT EXISTS property_favorites(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id),
 listing_id uuid NOT NULL REFERENCES listings(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT property_favorites_user_listing_unique UNIQUE(user_id,listing_id)
);
CREATE INDEX IF NOT EXISTS property_favorites_user_created_idx ON property_favorites(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS property_contact_taps(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 listing_id uuid NOT NULL REFERENCES listings(id),
 channel varchar(12) NOT NULL CHECK (channel IN ('call','whatsapp')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_taps_listing_date_idx ON property_contact_taps(listing_id,created_at);
CREATE INDEX IF NOT EXISTS listing_revision_geo_idx ON listing_revisions((data->'location'->>'provinceId'));
CREATE INDEX IF NOT EXISTS listing_revision_transaction_idx ON listing_revisions((data->>'transactionType'));
CREATE INDEX IF NOT EXISTS listing_revision_type_idx ON listing_revisions((data->>'propertyType'));
