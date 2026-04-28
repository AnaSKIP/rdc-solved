CREATE TABLE IF NOT EXISTS public.claim_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES public.claims(id) ON DELETE CASCADE NOT NULL,
  sender_phone text,
  content text,
  is_from_client boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.claim_messages ENABLE ROW LEVEL SECURITY;

-- Add policies
DROP POLICY IF EXISTS "Authenticated Access Claim Messages" ON public.claim_messages;
CREATE POLICY "Authenticated Access Claim Messages" ON public.claim_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Claim Messages" ON public.claim_messages;
CREATE POLICY "Public Access Claim Messages" ON public.claim_messages
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS claim_messages_claim_id_idx ON public.claim_messages (claim_id);
