
-- Drop demo open-access policies
DROP POLICY "Anyone can read contacts" ON public.contacts;
DROP POLICY "Anyone can insert contacts" ON public.contacts;
DROP POLICY "Anyone can update contacts" ON public.contacts;
DROP POLICY "Anyone can delete contacts" ON public.contacts;

DROP POLICY "Anyone can read messages" ON public.messages;
DROP POLICY "Anyone can insert messages" ON public.messages;
DROP POLICY "Anyone can update messages" ON public.messages;

DROP POLICY "Anyone can read incoming_messages" ON public.incoming_messages;

-- contacts: any authenticated user (single-tenant internal tool)
CREATE POLICY "Authenticated users can read contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- messages: authenticated users can read/insert/update.
-- Status updates from the webhook use the service role key which bypasses RLS entirely.
CREATE POLICY "Authenticated users can read messages"
  ON public.messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- incoming_messages: authenticated users can read.
-- Inserts come exclusively from the webhook via the service role key (bypasses RLS).
CREATE POLICY "Authenticated users can read incoming_messages"
  ON public.incoming_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);
