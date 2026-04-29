import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Busca os pendentes de forma direta
    const { data: allLeads, error: fetchError } = await supabase
      .from('caixa_entrada_importacao')
      .select('*')
      .neq('status_transferencia', 'TRANSFERIDO')

    if (fetchError) throw fetchError

    let totalMovidos = 0

    if (allLeads && allLeads.length > 0) {
      // Mapeia TODOS os leads sem aplicar filtros, isMockedRA ou perdas de dados
      const recordsToInsert = allLeads.map((lead) => ({
        id_ra: lead.id_ra || `RA-GEN-${crypto.randomUUID()}`,
        cliente_nome: lead.cliente_nome,
        cliente_cnpj: lead.cliente_cnpj,
        placa_onibus: lead.placa_onibus,
        prefixo_onibus: lead.prefixo_onibus,
        causador_nome: lead.causador_nome,
        causador_cpf: lead.causador_cpf,
        causador_telefone: lead.causador_telefone,
        causador_whatsapp: lead.causador_whatsapp,
        causador_endereco: lead.causador_endereco,
        proprietario_veiculo_causador: lead.proprietario_veiculo_causador,
        placa_causador: lead.placa_causador,
        modelo_causador: lead.modelo_causador,
        ano_causador: lead.ano_causador,
        cor_causador: lead.cor_causador,
        data_acidente: lead.data_acidente,
        hora_acidente: lead.hora_acidente,
        local_acidente: lead.local_acidente,
        dinamica_acidente: lead.dinamica_acidente,
        valor_dano_estimado: lead.valor_dano_estimado,
        documentos_anexados: lead.documentos_anexados,
        data_criacao: lead.data_criacao,
        status_processamento: 'NOVO',
        status_conformidade: 'PENDENTE',
      }))

      // Insere tudo diretamente em bulk (sem lotes manuais para forçar operação direta)
      const { error: upsertError } = await supabase
        .from('caixa_entrada')
        .upsert(recordsToInsert, { onConflict: 'id_ra', ignoreDuplicates: false })

      if (upsertError) throw upsertError

      totalMovidos = recordsToInsert.length

      // Atualiza a tabela origem globalmente para concluídos
      const { error: updateError } = await supabase
        .from('caixa_entrada_importacao')
        .update({ status_transferencia: 'TRANSFERIDO', status_atual: 'TRANSFERIDO' })
        .neq('status_transferencia', 'TRANSFERIDO')

      if (updateError) throw updateError
    }

    // Conta o total final na tabela destino para confirmação visual
    const { count: countDestinoFinal } = await supabase
      .from('caixa_entrada')
      .select('*', { count: 'exact', head: true })

    return new Response(
      JSON.stringify({
        sucesso: true,
        total_movidos: totalMovidos,
        total_final_caixa_entrada: countDestinoFinal || 0,
        mensagem: 'Transferência direta concluída.',
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ sucesso: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
