-- Add return subject and claim numbers to claims table
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS return_subject text;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS causer_claim_number text;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS client_claim_number text;
