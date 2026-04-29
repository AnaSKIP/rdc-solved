DO $$
BEGIN
  -- Remover todos os registros que contêm dados identificados como fictícios ou testes
  DELETE FROM public.claims 
  WHERE 
    causer_name ILIKE '%Teste%' OR 
    causer_name ILIKE '%João Silva%' OR 
    phone = '(11) 99999-9999' OR 
    phone = '11999999999' OR
    ra ILIKE '%TEST%' OR
    causer_name ILIKE '%Mock%';

  DELETE FROM public.caixa_entrada 
  WHERE 
    causador_nome ILIKE '%Teste%' OR
    id_ra ILIKE '%TEST%';

  DELETE FROM public.caixa_entrada_importacao 
  WHERE 
    causador_nome ILIKE '%Teste%' OR
    id_ra ILIKE '%TEST%';

  -- Registrar log simples para fins de transparência 
  RAISE NOTICE 'Ação executada: Dados falsos removidos com sucesso.';
END $$;
