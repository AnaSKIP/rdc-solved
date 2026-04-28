-- Adicionar novas colunas na tabela claims para gerenciar termos de acordo
ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS agreement_notes TEXT,
  ADD COLUMN IF NOT EXISTS agreement_signed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreement_generated BOOLEAN DEFAULT false;

-- Inserir usuário Admin inicial (senha: senha1234)
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'anamaria@rdccobrancas.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'anamaria@rdccobrancas.com.br',
      crypt('senha1234', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Ana Maria"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.internal_team (id, email, name, role)
    VALUES (new_user_id, 'anamaria@rdccobrancas.com.br', 'Ana Maria', 'Admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Criar tabela de Base de Conhecimento da IA (Treinamento de Objeções)
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objection_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  suggested_response TEXT NOT NULL,
  evidence_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Authenticated Access AI KB" ON public.ai_knowledge_base;
CREATE POLICY "Authenticated Access AI KB" ON public.ai_knowledge_base
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access AI KB" ON public.ai_knowledge_base;
CREATE POLICY "Public Access AI KB" ON public.ai_knowledge_base
  FOR ALL TO anon USING (true) WITH CHECK (true);

