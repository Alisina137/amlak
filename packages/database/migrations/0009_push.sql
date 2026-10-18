-- Phase 8 / Step 1: opt-in device push with durable delivery attempts.
CREATE TABLE IF NOT EXISTS push_preferences(
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT false,
 saved_searches boolean NOT NULL DEFAULT true,
 inquiries boolean NOT NULL DEFAULT true,
 viewings boolean NOT NULL DEFAULT true,
 account boolean NOT NULL DEFAULT true,
 enabled_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS push_devices(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 installation_id uuid NOT NULL,
 expo_token varchar(256) NOT NULL,
 token_hash varchar(64) NOT NULL,
 project_id uuid NOT NULL,
 platform varchar(8) NOT NULL CHECK(platform IN ('android','ios')),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT push_device_user_installation_unique UNIQUE(user_id,installation_id),
 CONSTRAINT push_token_hash_unique UNIQUE(token_hash)
);
CREATE INDEX IF NOT EXISTS push_device_user_active_idx ON push_devices(user_id,active);
CREATE TABLE IF NOT EXISTS push_deliveries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 notification_id uuid NOT NULL REFERENCES user_notifications(id) ON DELETE CASCADE,
 device_id uuid NOT NULL REFERENCES push_devices(id) ON DELETE CASCADE,
 status varchar(16) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','delivered','failed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts >= 0),
 next_try_at timestamptz NOT NULL DEFAULT now(),
 lease_until timestamptz,
 expo_ticket_id varchar(120),last_error varchar(120),
 sent_at timestamptz,receipt_checked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT push_delivery_notification_device_unique UNIQUE(notification_id,device_id)
);
CREATE INDEX IF NOT EXISTS push_delivery_queue_idx ON push_deliveries(status,next_try_at);
CREATE INDEX IF NOT EXISTS push_delivery_receipt_idx ON push_deliveries(status,receipt_checked_at);
