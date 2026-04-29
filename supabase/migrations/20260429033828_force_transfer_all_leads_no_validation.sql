DO $$
DECLARE
  count_pendentes INT;
BEGIN
  -- Verifica quantos registros ainda nao foram transferidos
  SELECT count(*) INTO count_pendentes FROM public.caixa_entrada_importacao WHERE status_transferencia IS DISTINCT FROM 'TRANSFERIDO';

  IF count_pendentes > 0 THEN
    -- Transfere TODOS imediatamente, sem validações, sem filtros, sem lotes (Force Direct Move)
    INSERT INTO public.caixa_entrada (
      id_ra,
      cliente_nome,
      cliente_cnpj,
      placa_onibus,
      prefixo_onibus,
      causador_nome,
      causador_cpf,
      causador_telefone,
      causador_whatsapp,
      causador_endereco,
      proprietario_veiculo_causador,
      placa_causador,
      modelo_causador,
      ano_causador,
      cor_causador,
      data_acidente,
      hora_acidente,
      local_acidente,
      dinamica_acidente,
      valor_dano_estimado,
      documentos_anexados,
      data_criacao,
      status_processamento,
      status_conformidade
    )
    SELECT 
      COALESCE(id_ra, 'RA-GEN-' || gen_random_uuid()::text),
      cliente_nome,
      cliente_cnpj,
      placa_onibus,
      prefixo_onibus,
      causador_nome,
      causador_cpf,
      causador_telefone,
      causador_whatsapp,
      causador_endereco,
      proprietario_veiculo_causador,
      placa_causador,
      modelo_causador,
      ano_causador,
      cor_causador,
      data_acidente,
      hora_acidente,
      local_acidente,
      dinamica_acidente,
      valor_dano_estimado,
      documentos_anexados,
      data_criacao,
      'NOVO',
      'PENDENTE'
    FROM public.caixa_entrada_importacao
    WHERE status_transferencia IS DISTINCT FROM 'TRANSFERIDO'
    ON CONFLICT (id_ra) DO UPDATE SET
      cliente_nome = EXCLUDED.cliente_nome,
      cliente_cnpj = EXCLUDED.cliente_cnpj,
      placa_onibus = EXCLUDED.placa_onibus,
      causador_nome = EXCLUDED.causador_nome,
      causador_cpf = EXCLUDED.causador_cpf,
      causador_telefone = EXCLUDED.causador_telefone,
      causador_whatsapp = EXCLUDED.causador_whatsapp,
      data_acidente = EXCLUDED.data_acidente,
      documentos_anexados = EXCLUDED.documentos_anexados,
      status_processamento = 'NOVO';

    -- Marca como transferidos na origem
    UPDATE public.caixa_entrada_importacao
    SET status_transferencia = 'TRANSFERIDO', status_atual = 'TRANSFERIDO'
    WHERE status_transferencia IS DISTINCT FROM 'TRANSFERIDO';
  END IF;
END $$;
