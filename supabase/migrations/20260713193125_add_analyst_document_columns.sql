-- Add personal document URL columns to analysts table
ALTER TABLE public.analysts
ADD COLUMN IF NOT EXISTS documento_identidade_url TEXT,
ADD COLUMN IF NOT EXISTS comprovante_endereco_url TEXT;

-- Ensure MENSALIDADE column exists (already present in current schema, but ensuring idempotency)
-- No action needed: MENSALIDADE already exists as numeric
