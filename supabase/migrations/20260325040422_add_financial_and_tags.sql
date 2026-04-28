ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS financial_total_value NUMERIC DEFAULT 0;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS financial_fixed_value NUMERIC DEFAULT 0;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS financial_commission_value NUMERIC DEFAULT 0;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS installments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS probability NUMERIC DEFAULT 0;
