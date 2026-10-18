CREATE TABLE IF NOT EXISTS support_tickets(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id),request_id uuid NOT NULL,
 category varchar(24) NOT NULL CHECK(category IN ('account','listing','payments','safety','other')),
 subject varchar(150) NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'open' CHECK(status IN ('open','awaiting_user','resolved','closed')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS support_ticket_retry_idx ON support_tickets(user_id,request_id);
CREATE INDEX IF NOT EXISTS support_user_idx ON support_tickets(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS support_queue_idx ON support_tickets(status,updated_at DESC);
CREATE TABLE IF NOT EXISTS support_messages(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
 author_user_id uuid REFERENCES users(id),
 author_staff_id uuid REFERENCES staff(id),request_id uuid NOT NULL,
 body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT support_message_actor_chk CHECK ((author_user_id IS NULL) <> (author_staff_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS support_msg_user_retry_idx ON support_messages(author_user_id,request_id);
CREATE UNIQUE INDEX IF NOT EXISTS support_msg_staff_retry_idx ON support_messages(author_staff_id,request_id);
CREATE INDEX IF NOT EXISTS support_message_ticket_idx ON support_messages(ticket_id,created_at);
