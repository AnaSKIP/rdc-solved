CREATE TABLE IF NOT EXISTS public.caixa_entrada_importacao (
    id_ra TEXT PRIMARY KEY,
    cliente_nome TEXT,
    cliente_cnpj TEXT,
    placa_onibus TEXT,
    prefixo_onibus TEXT,
    causador_nome TEXT,
    causador_cpf TEXT,
    causador_telefone TEXT,
    causador_whatsapp TEXT,
    causador_endereco TEXT,
    proprietario_veiculo_causador TEXT,
    placa_causador TEXT,
    modelo_causador TEXT,
    ano_causador TEXT,
    cor_causador TEXT,
    data_acidente DATE,
    hora_acidente TIME,
    local_acidente TEXT,
    dinamica_acidente TEXT,
    valor_dano_estimado NUMERIC,
    status_atual TEXT,
    status_validacao TEXT DEFAULT 'VÁLIDO',
    status_transferencia TEXT DEFAULT 'PENDENTE',
    analista_atribuido TEXT,
    documentos_anexados JSONB DEFAULT '[]'::jsonb,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    data_importacao TIMESTAMPTZ DEFAULT NOW(),
    lote_importacao INTEGER,
    id_transferencia UUID
);

CREATE TABLE IF NOT EXISTS public.caixa_entrada (
    id_ra TEXT PRIMARY KEY,
    cliente_nome TEXT,
    cliente_cnpj TEXT,
    placa_onibus TEXT,
    prefixo_onibus TEXT,
    causador_nome TEXT,
    causador_cpf TEXT,
    causador_telefone TEXT,
    causador_whatsapp TEXT,
    causador_endereco TEXT,
    proprietario_veiculo_causador TEXT,
    placa_causador TEXT,
    modelo_causador TEXT,
    ano_causador TEXT,
    cor_causador TEXT,
    data_acidente DATE,
    hora_acidente TIME,
    local_acidente TEXT,
    dinamica_acidente TEXT,
    valor_dano_estimado NUMERIC,
    status_processamento TEXT DEFAULT 'AGUARDANDO PROCESSAMENTO',
    status_conformidade TEXT DEFAULT 'PENDENTE',
    documentos_anexados JSONB DEFAULT '[]'::jsonb,
    texto_extraido_ocr TEXT,
    dados_odoo_anteriores JSONB,
    comparacao_odoo JSONB,
    historico_processamento JSONB DEFAULT '[]'::jsonb,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    data_processamento TIMESTAMPTZ,
    id_transferencia UUID,
    data_transferencia TIMESTAMPTZ,
    lote_numero INTEGER
);

CREATE TABLE IF NOT EXISTS public.transferencia_log (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    tipo_acao TEXT,
    id_ra TEXT,
    lote_numero INTEGER,
    status TEXT,
    mensagem TEXT,
    detalhes_erro TEXT
);

ALTER TABLE public.caixa_entrada_importacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencia_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_caixa_entrada_importacao" ON public.caixa_entrada_importacao;
CREATE POLICY "auth_all_caixa_entrada_importacao" ON public.caixa_entrada_importacao FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_caixa_entrada" ON public.caixa_entrada;
CREATE POLICY "auth_all_caixa_entrada" ON public.caixa_entrada FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_transferencia_log" ON public.transferencia_log;
CREATE POLICY "auth_all_transferencia_log" ON public.transferencia_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.caixa_entrada_importacao (
    id_ra, cliente_nome, cliente_cnpj, placa_onibus, causador_nome, causador_telefone, placa_causador, status_atual, status_validacao, status_transferencia, data_importacao, lote_importacao, valor_dano_estimado
) VALUES 
('RA-TEST-001', 'Viação Teste', '12.345.678/0001-90', 'ABC-1234', 'João Causador', '(11) 98765-4321', 'XYZ-9876', 'REPESCAGEM', 'VÁLIDO', 'PENDENTE', NOW(), 1, 1500.50),
('RA-TEST-002', 'Expresso Teste', '98.765.432/0001-10', 'DEF-5678', 'Maria Causadora', '(21) 91234-5678', 'WWW-1111', 'SEM ACORDO', 'VÁLIDO', 'PENDENTE', NOW(), 1, 2000.00)
ON CONFLICT (id_ra) DO NOTHING;
