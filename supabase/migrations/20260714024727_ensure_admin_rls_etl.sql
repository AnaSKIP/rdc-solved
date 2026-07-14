-- Ensure RLS policies on caixa_entrada and caixa_entrada_importacao allow authenticated users (including admins) to read and write

ALTER TABLE public.caixa_entrada_importacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_entrada ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_caixa_entrada_importacao" ON public.caixa_entrada_importacao;
CREATE POLICY "auth_all_caixa_entrada_importacao" ON public.caixa_entrada_importacao
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_caixa_entrada" ON public.caixa_entrada;
CREATE POLICY "auth_all_caixa_entrada" ON public.caixa_entrada
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure proprietario_telefone column exists on both ETL tables
ALTER TABLE public.caixa_entrada_importacao ADD COLUMN IF NOT EXISTS proprietario_telefone TEXT;
ALTER TABLE public.caixa_entrada ADD COLUMN IF NOT EXISTS proprietario_telefone TEXT;
