DO $$
BEGIN
  -- Limpeza da tabela caixa_entrada (removendo dados fictícios/mockados e placeholders)
  DELETE FROM public.caixa_entrada
  WHERE cliente_nome ILIKE '%Cliente Desconhecido%'
     OR placa_causador = 'XYZ-9876'
     OR placa_onibus = 'XYZ-9876'
     OR causador_nome IN ('Roberto Almeida', 'Ana Oliveira', 'Douglas Martins', 'Elisicler ia Santos', 'TRANSMIMO LTDA');

  -- Limpeza da tabela caixa_entrada_importacao (origem dos dados da integração Odoo/ETL)
  DELETE FROM public.caixa_entrada_importacao
  WHERE cliente_nome ILIKE '%Cliente Desconhecido%'
     OR placa_causador = 'XYZ-9876'
     OR placa_onibus = 'XYZ-9876'
     OR causador_nome IN ('Roberto Almeida', 'Ana Oliveira', 'Douglas Martins', 'Elisicler ia Santos', 'TRANSMIMO LTDA')
     OR status_atual = 'Não Atribuído';

  -- Limpeza da tabela claims (utilizada pelo fluxo visual e integrações)
  DELETE FROM public.claims
  WHERE placa_causador = 'XYZ-9876'
     OR placa_onibus = 'XYZ-9876'
     OR causer_name IN ('Roberto Almeida', 'Ana Oliveira', 'Douglas Martins', 'Elisicler ia Santos', 'TRANSMIMO LTDA', 'Cliente Desconhecido');

  -- Os documentos anexados serão deletados por cascata graças ao ON DELETE CASCADE configurado nas Foreign Keys
END $$;
