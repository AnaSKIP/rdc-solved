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

    // Credenciais de conexão para a automação (podem ser buscadas do banco se preferível)
    const credentials = {
      url: Deno.env.get('ODOO_URL') || 'https://odoo.rdccobrancas.com.br',
      db: Deno.env.get('ODOO_DB') || 'rdc_prod',
      username: Deno.env.get('ODOO_USERNAME') || 'admin',
      apiKey: Deno.env.get('ODOO_API_KEY') || 'demo-key-123',
    }

    // Busca leads pendentes no Odoo
    const { data: odooData, error: syncError } = await supabase.functions.invoke('odoo-sync', {
      body: {
        ...credentials,
        offset: 0,
        limit: 30,
      },
    })

    if (syncError) throw syncError

    const realLeads = odooData?.leads || []
    const odooAttachments = odooData?.attachments || []

    if (realLeads.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Nenhum lead encontrado.' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { data: existingClaims } = await supabase.from('claims').select('ra, causer_document')

    const batchRecords: any[] = []
    const odooIdToRa = new Map<number, string>()

    for (const lead of realLeads) {
      const getVal = (val: any) => (val === false ? null : val)

      const isMockedData = (l: any) => {
        const placeholders = [
          'xyz-9876',
          'abc1234',
          'ex: abc1234',
          'ex: ford / ecosport',
          'ex: 1002',
          '(00) 00000-0000',
          'selecione o cliente...',
          'cliente desconhecido',
        ]
        const fictitiousNames = [
          'roberto almeida',
          'ana oliveira',
          'douglas martins',
          'elisicler ia santos',
          'transmimo ltda',
        ]

        const checkStr = (v: any) => (v ? String(v).toLowerCase() : '')

        const clientName = checkStr(l.company_name_enriched || l.partner_name || l.contact_name)
        const causerName = checkStr(l.x_nome_causador || l.x_causador_nome)
        const placaOnibus = checkStr(l.x_placa_onibus)
        const placaCausador = checkStr(l.x_placa_causador)
        const desc = checkStr(l.description)

        if (
          placeholders.some(
            (p) =>
              clientName.includes(p) ||
              causerName.includes(p) ||
              placaOnibus.includes(p) ||
              placaCausador.includes(p),
          )
        )
          return true
        if (fictitiousNames.some((n) => clientName.includes(n) || causerName.includes(n)))
          return true
        if (desc.includes('<div') || desc.includes('<!--')) return true

        return false
      }

      if (isMockedData(lead)) {
        continue
      }

      const baseRa = String(getVal(lead.x_ra) || getVal(lead.name) || `RA-${lead.id}`).trim()

      // Limpeza de campos residuais caso a validação geral passe, mas haja sujeira num campo isolado
      const cleanResidualData = (val: any) => {
        if (!val) return null
        const noHtml = String(val)
          .replace(/<[^>]*>?/gm, '')
          .trim()
        if (!noHtml) return null
        return noHtml
      }

      const causer_name =
        cleanResidualData(getVal(lead.x_nome_causador) || getVal(lead.x_causador_nome)) || ''
      const rawCnpj =
        cleanResidualData(
          getVal(lead.x_cpf_cnpj_causador) ||
            getVal(lead.x_cnpj_causador) ||
            getVal(lead.x_cpf_causador),
        ) || null

      const fullText = `${rawCnpj || ''} ${cleanResidualData(getVal(lead.description)) || ''} ${causer_name}`
      const cnpjMatch = fullText.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14}/)
      const cnpj = rawCnpj || (cnpjMatch ? cnpjMatch[0] : null)

      const existingWithBaseRa =
        existingClaims?.filter((c: any) => c.ra === baseRa || c.ra?.startsWith(`${baseRa}\n`)) || []

      let finalRa = baseRa
      let isDuplicate = false

      if (existingWithBaseRa.length > 0) {
        const sameCnpj = existingWithBaseRa.find(
          (c: any) => c.causer_document === cnpj || (!c.causer_document && !cnpj),
        )
        if (sameCnpj) {
          isDuplicate = true
        } else {
          finalRa = `${baseRa}\n${cnpj || 'S-CNPJ'}`
        }
      }

      if (isDuplicate) {
        odooIdToRa.set(lead.id, finalRa)
        continue
      }

      odooIdToRa.set(lead.id, finalRa)

      const dateStr = getVal(lead.create_date)
      const date = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()
      const stageName =
        lead.stage_id && Array.isArray(lead.stage_id) ? lead.stage_id[1] : 'Sem Acordo'
      const stage = stageName.includes('Repescagem') ? 'Repescagem' : 'Sem Acordo'

      batchRecords.push({
        ra: finalRa,
        stage: stage,
        status: 'pending',
        date,
        causer_name: causer_name,
        causer_document: cnpj,
        financial_total_value: getVal(lead.expected_revenue) || 0,
        analyst_id: lead.user_id && Array.isArray(lead.user_id) ? lead.user_id[1] : null,
        relato_acidente: cleanResidualData(getVal(lead.description)),
        phone: cleanResidualData(getVal(lead.phone) || getVal(lead.mobile)),
        placa_onibus: cleanResidualData(getVal(lead.x_placa_onibus)),
        prefixo_onibus: cleanResidualData(getVal(lead.x_prefixo_onibus)),
        motorista_onibus: cleanResidualData(getVal(lead.x_motorista_onibus)),
        placa_causador: cleanResidualData(getVal(lead.x_placa_causador)),
        tipo_veiculo_causador: cleanResidualData(getVal(lead.x_tipo_veiculo_causador)),
        is_enriched: false,
      })
    }

    if (batchRecords.length > 0) {
      await supabase.from('claims').upsert(batchRecords, {
        onConflict: 'ra,date,placa_causador',
        ignoreDuplicates: true,
      })
    }

    // Processamento otimizado de mídias/anexos na própria Automação
    if (odooAttachments.length > 0) {
      const raList = Array.from(odooIdToRa.values())
      const { data: claimsData } = await supabase.from('claims').select('id, ra').in('ra', raList)

      const raToClaimId = new Map<string, string>()
      claimsData?.forEach((c: any) => raToClaimId.set(c.ra, c.id))

      for (const att of odooAttachments) {
        const ra = odooIdToRa.get(att.res_id)
        if (!ra) continue
        const claimId = raToClaimId.get(ra)
        if (!claimId) continue

        const { data: existingAtt } = await supabase
          .from('attachments')
          .select('id')
          .eq('claim_id', claimId)
          .eq('file_name', att.name)
          .maybeSingle()

        if (existingAtt) continue

        const { data: attData } = await supabase.functions.invoke('odoo-sync', {
          body: {
            ...credentials,
            attachmentId: att.id,
            claimId: claimId,
          },
        })

        if (attData?.success) {
          const mimeType = attData.mimeType || 'application/octet-stream'
          await supabase.from('attachments').insert({
            claim_id: claimId,
            file_name: attData.name || att.name,
            file_type: mimeType.includes('pdf')
              ? 'pdf'
              : mimeType.includes('image')
                ? 'image'
                : 'file',
            url: attData.publicUrl,
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: batchRecords.length }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
