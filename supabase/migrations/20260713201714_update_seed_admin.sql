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
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Ana Maria"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, is_admin, force_password_change, raw_password_view)
    VALUES (new_user_id, 'anamaria@rdccobrancas.com.br', 'Ana Maria', true, false, 'Skip@Pass')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

UPDATE public.profiles
SET is_admin = true,
    force_password_change = false,
    raw_password_view = 'Skip@Pass'
WHERE email = 'anamaria@rdccobrancas.com.br';
