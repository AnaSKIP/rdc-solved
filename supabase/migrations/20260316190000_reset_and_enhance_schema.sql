-- Database Cleanup (Reset)
TRUNCATE TABLE public.attachments CASCADE;
TRUNCATE TABLE public.claims CASCADE;
TRUNCATE TABLE public.contacts CASCADE;

-- Enhanced Contact Management Schema
ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS cellphone TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS custom_commission_config JSONB;
