INSERT INTO public.ai_knowledge_base (id, objection_type, difficulty, suggested_response, evidence_text)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Corretor exigindo fotos (não obrigatórias)', 'Alta', 'Informar que as fotos do veículo não são obrigatórias para a abertura do sinistro de segurado. Sugerir que o próprio cliente ligue na central de seguros (ex: Porto Seguro) para confirmar, ou informar que a empresa tomará as medidas judiciais caso a abertura seja recusada injustificadamente.', 'Analista: "Isso não é obrigatorio para fazer a abertura de um sinistro. Ele ta mentindo... Ou você pega o telefone e faz a abertura do sinistro o senhor. Ou você manda ele fazer... Liga na Central do seu seguro... Vai ver que nãoprecisa de foto"'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Assunção de culpa pendente (Carta de Responsabilidade)', 'Média', 'Explicar que a seguradora exige um documento (carta) onde o causador assume a responsabilidade do evento para liberar os reparos do ônibus. Enviar um modelo preenchido para facilitar, bastando o cliente copiar a próprio punho e assinar.', 'Analista: "Onde o senhor tem que assumir a responsabilidade do evento se não não teremos atendimento... Ja preenchi com as informações que o senhor tem que por, só tem que escrever a proprio punho E me manda essa carta assinada"')
ON CONFLICT (id) DO UPDATE SET 
  objection_type = EXCLUDED.objection_type,
  difficulty = EXCLUDED.difficulty,
  suggested_response = EXCLUDED.suggested_response,
  evidence_text = EXCLUDED.evidence_text;
