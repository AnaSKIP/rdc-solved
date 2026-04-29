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

    // AÇÃO 1: Conecta ao Supabase e busca registros não transferidos em caixa_entrada_importacao
    const { data: allLeads, error: fetchError } = await supabase
      .from('caixa_entrada_importacao')
      .select('*')
      .neq('status_transferencia', 'TRANSFERIDO')
      .limit(3000)

    if (fetchError) throw fetchError

    if (!allLeads || allLeads.length === 0) {
      return new Response(
        JSON.stringify({
          sucesso: true,
          total_transferidos: 0,
          total_ignorados_existentes: 0,
          total_erros: 0,
          mensagem: 'Nenhum lead pendente de transferência encontrado.',
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    let transferidos = 0
    let erros = 0
    let ignorados = 0

    const validLeads: any[] = []
    const successfullyTransferredIds: string[] = []

    for (const lead of allLeads) {
      if (!lead.id_ra) {
        erros++
        continue
      }

      // Regra de Unicidade: Combinar RA e CNPJ para diferenciar RAs repetidos
      const cnpjStr = lead.cliente_cnpj ? String(lead.cliente_cnpj).replace(/\D/g, '') : ''
      let finalRa = String(lead.id_ra)
      if (cnpjStr && !finalRa.includes(cnpjStr)) {
        finalRa = `${finalRa}-${cnpjStr}`
      }

      validLeads.push({
        id_ra: finalRa,
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
      })

      // Salva o ID original para atualizar depois
      successfullyTransferredIds.push(lead.id_ra)
    }

    // Processamento em lotes (Bulk) para evitar timeout
    const batchSize = 200
    for (let i = 0; i < validLeads.length; i += batchSize) {
      const batch = validLeads.slice(i, i + batchSize)
      const batchRAs = batch.map((b) => b.id_ra)

      // Importação Inteligente (Check-Exist)
      const { data: existing, error: checkError } = await supabase
        .from('caixa_entrada')
        .select('id_ra')
        .in('id_ra', batchRAs)

      if (checkError) {
        console.error('Check error:', checkError)
        erros += batch.length
        continue
      }

      const existingRAs = new Set(existing?.map((e) => e.id_ra) || [])
      const newLeads = batch.filter((b) => !existingRAs.has(b.id_ra))

      ignorados += batch.length - newLeads.length

      if (newLeads.length > 0) {
        const { error: upsertError } = await supabase
          .from('caixa_entrada')
          .upsert(newLeads, { onConflict: 'id_ra', ignoreDuplicates: true })

        if (upsertError) {
          console.error('Upsert error:', upsertError)
          erros += newLeads.length
        } else {
          transferidos += newLeads.length
        }
      }
    }

    // Atualiza tabela origem de forma segmentada
    for (let i = 0; i < successfullyTransferredIds.length; i += batchSize) {
      const batchIds = successfullyTransferredIds.slice(i, i + batchSize)
      await supabase
        .from('caixa_entrada_importacao')
        .update({ status_transferencia: 'TRANSFERIDO', status_atual: 'TRANSFERIDO' })
        .in('id_ra', batchIds)
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        total_transferidos: transferidos,
        total_ignorados_existentes: ignorados,
        total_erros: erros,
        mensagem: `${transferidos} leads transferidos com sucesso. ${ignorados} foram ignorados pois já existiam.`,
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
