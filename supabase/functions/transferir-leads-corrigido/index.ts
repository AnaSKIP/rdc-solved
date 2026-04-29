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

    // AÇÃO 1: Conecta ao Supabase e busca TODOS os registros em caixa_entrada_importacao
    let allLeads: any[] = []
    let hasMore = true
    let offset = 0
    const limit = 1000

    while (hasMore) {
      const { data, error } = await supabase
        .from('caixa_entrada_importacao')
        .select('*')
        .neq('status_transferencia', 'TRANSFERIDO')
        .range(offset, offset + limit - 1)

      if (error) throw error

      if (data && data.length > 0) {
        allLeads.push(...data)
        offset += limit
      } else {
        hasMore = false
      }
    }

    if (allLeads.length === 0) {
      const { data, error } = await supabase.from('caixa_entrada_importacao').select('*')

      if (error) throw error
      if (data) allLeads = data
    }

    let transferidos = 0
    let erros = 0

    const validLeads: any[] = []
    const successfullyTransferredIds: string[] = []

    for (const lead of allLeads) {
      if (lead.id_ra) {
        // Extrai dados e insere com status NOVO
        validLeads.push({
          id_ra: lead.id_ra,
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
          status_processamento: 'NOVO', // Definido como NOVO
          status_conformidade: 'PENDENTE',
        })
        successfullyTransferredIds.push(lead.id_ra)
      } else {
        erros++
      }
    }

    const batchSize = 500
    for (let i = 0; i < validLeads.length; i += batchSize) {
      const batch = validLeads.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('caixa_entrada')
        .upsert(batch, { onConflict: 'id_ra' })

      if (insertError) {
        console.error('Erro ao inserir lote:', insertError)
        erros += batch.length
      } else {
        transferidos += batch.length
      }
    }

    // Atualiza caixa_entrada_importacao.status = TRANSFERIDO
    for (let i = 0; i < successfullyTransferredIds.length; i += batchSize) {
      const batchIds = successfullyTransferredIds.slice(i, i + batchSize)
      await supabase
        .from('caixa_entrada_importacao')
        .update({ status_transferencia: 'TRANSFERIDO', status_atual: 'TRANSFERIDO' })
        .in('id_ra', batchIds)
    }

    // Retorna conforme esperado
    return new Response(
      JSON.stringify({
        sucesso: true,
        total_transferidos: transferidos,
        mensagem: `${transferidos} leads transferidos com sucesso para a Caixa de Entrada.`,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ sucesso: false, error: err.message, mensagem: 'Erro interno no servidor' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  }
})
