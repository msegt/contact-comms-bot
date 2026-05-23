
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wamid text UNIQUE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  recipient_phone text NOT NULL,
  message_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX idx_messages_wamid ON public.messages(wamid);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at DESC);

CREATE TABLE public.incoming_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wamid text,
  from_phone text NOT NULL,
  message_body text,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_messages ENABLE ROW LEVEL SECURITY;

-- Demo policies: open access (no auth in this build)
CREATE POLICY "Anyone can read contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contacts" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update contacts" ON public.contacts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete contacts" ON public.contacts FOR DELETE USING (true);

CREATE POLICY "Anyone can read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update messages" ON public.messages FOR UPDATE USING (true);

CREATE POLICY "Anyone can read incoming_messages" ON public.incoming_messages FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
