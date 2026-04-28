-- Add is_admin column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed user Ana Maria if not exists
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
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Ana"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
    
    INSERT INTO public.profiles (id, email, name, is_admin)
    VALUES (new_user_id, 'anamaria@rdccobrancas.com.br', 'Ana', true)
    ON CONFLICT (id) DO UPDATE SET name = 'Ana', is_admin = true;
  END IF;
END $$;

-- Update profile for Ana to ensure name is 'Ana' and is_admin is true
UPDATE public.profiles
SET name = 'Ana', is_admin = true
WHERE email = 'anamaria@rdccobrancas.com.br';

-- Update user metadata for Ana
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{name}', '"Ana"')
WHERE email = 'anamaria@rdccobrancas.com.br';

-- Remove Douglas Martin from any relevant tables (preserving the other analysts)
DELETE FROM public.internal_team WHERE name ILIKE '%Douglas Martin%';
DELETE FROM public.analysts WHERE "NOME" ILIKE '%Douglas Martin%';

-- Remove Douglas Martin from auth.users (will cascade to profiles)
DELETE FROM auth.users 
WHERE raw_user_meta_data->>'name' ILIKE '%Douglas Martin%' 
   OR email ILIKE '%douglas.martin%';

-- Fallback delete from profiles just in case it wasn't linked properly via cascade
DELETE FROM public.profiles WHERE name ILIKE '%Douglas Martin%';
