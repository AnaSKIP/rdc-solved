DO $$
BEGIN
  -- Limpeza de rastros do RA mockado específico que aparecia na interface de Intake
  DELETE FROM public.claims WHERE ra = 'RA-2025-8472';
  DELETE FROM public.caixa_entrada WHERE id_ra = 'RA-2025-8472';
  DELETE FROM public.caixa_entrada_importacao WHERE id_ra = 'RA-2025-8472';
  DELETE FROM public.leads WHERE ra = 'RA-2025-8472';
END $$;
