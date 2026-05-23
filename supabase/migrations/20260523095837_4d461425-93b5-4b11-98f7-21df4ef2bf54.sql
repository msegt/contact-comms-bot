CREATE SCHEMA IF NOT EXISTS "CAFmensajes";

CREATE TABLE "CAFmensajes".contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "CAFmensajes".messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wamid text UNIQUE,
  contact_id uuid REFERENCES "CAFmensajes".contacts(id) ON DELETE SET NULL,
  recipient_phone text NOT NULL,
  message_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX idx_messages_wamid ON "CAFmensajes".messages(wamid);
CREATE INDEX idx_messages_sent_at ON "CAFmensajes".messages(sent_at DESC);

CREATE TABLE "CAFmensajes".incoming_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wamid text,
  from_phone text NOT NULL,
  message_body text,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "CAFmensajes".contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CAFmensajes".messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CAFmensajes".incoming_messages ENABLE ROW LEVEL SECURITY;

-- Demo policies: open access (no auth in this build)
CREATE POLICY "Anyone can read contacts" ON "CAFmensajes".contacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contacts" ON "CAFmensajes".contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update contacts" ON "CAFmensajes".contacts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete contacts" ON "CAFmensajes".contacts FOR DELETE USING (true);

CREATE POLICY "Anyone can read messages" ON "CAFmensajes".messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON "CAFmensajes".messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update messages" ON "CAFmensajes".messages FOR UPDATE USING (true);

CREATE POLICY "Anyone can read incoming_messages" ON "CAFmensajes".incoming_messages FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE "CAFmensajes".messages;
ALTER TABLE "CAFmensajes".messages REPLICA IDENTITY FULL;
