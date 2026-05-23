ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS notes text;
