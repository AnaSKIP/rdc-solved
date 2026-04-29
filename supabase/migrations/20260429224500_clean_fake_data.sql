DO $$
BEGIN
  -- Limpeza de dados claramente simulados na tabela de claims
  DELETE FROM public.claims 
  WHERE 
    ra ILIKE '%fake%' OR 
    ra ILIKE '%teste%' OR 
    causer_name ILIKE '%teste%' OR 
    phone = '+5511999999999' OR 
    client_id IN (SELECT id::text FROM public.clients WHERE "RAZÃO SOCIAL" ILIKE '%teste%');

  -- Limpeza de dados claramente simulados na caixa de entrada
  DELETE FROM public.caixa_entrada 
  WHERE 
    id_ra ILIKE '%fake%' OR 
    id_ra ILIKE '%teste%' OR 
    causador_nome ILIKE '%teste%';

  -- Limpeza de dados na importação
  DELETE FROM public.caixa_entrada_importacao 
  WHERE 
    id_ra ILIKE '%fake%' OR 
    id_ra ILIKE '%teste%';

  -- Limpeza de leads antigos falsos
  DELETE FROM public.leads 
  WHERE 
    ra ILIKE '%fake%' OR 
    ra ILIKE '%teste%';

END $$;
