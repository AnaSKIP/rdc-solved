ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS proprietario_telefone TEXT;
ALTER TABLE public.caixa_entrada ADD COLUMN IF NOT EXISTS proprietario_telefone TEXT;
ALTER TABLE public.caixa_entrada_importacao ADD COLUMN IF NOT EXISTS proprietario_telefone TEXT;
