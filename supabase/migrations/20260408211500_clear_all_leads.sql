DO $$
BEGIN
  -- Removemos todas as transações financeiras para evitar registros órfãos,
  -- já que a foreign key é ON DELETE SET NULL.
  DELETE FROM public.financial_transactions;
  
  -- Removemos todos os sinistros (leads).
  -- Isso irá remover automaticamente em cascata os registros em:
  -- 1. claim_messages (mensagens do whatsapp vinculadas)
  -- 2. attachments (anexos vinculados)
  DELETE FROM public.claims;
END $$;
