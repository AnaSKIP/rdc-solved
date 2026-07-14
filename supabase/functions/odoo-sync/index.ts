import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

async function odooJsonRpc(
  cleanUrl: string,
  params: Record<string, unknown>,
  errorContext: string,
): Promise<any> {
  let res: Response
  try {
    res = await fetch(`${cleanUrl}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params,
      }),
    })
  } catch (networkErr: any) {
    throw new Error(
      `${errorContext}: Não foi possível conectar ao servidor Odoo em ${cleanUrl}. Verifique a URL e a conexão de rede. Detalhe: ${networkErr.message}`,
    )
  }

  if (!res.ok) {
    throw new Error(`${errorContext}: HTTP ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (data.error) {
    const errorMsg = data.error?.data?.message || data.error?.message || 'Erro desconhecido do Odoo'
    throw new Error(`${errorContext}: ${errorMsg}`)
  }

  return data.result
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const reqBody = await req.json()
    const {
      url,
      db,
      username,
      apiKey,
      offset = 0,
      limit = 100,
      countOnly = false,
      attachmentId,
      claimId,
      start_date,
      end_date,
    } = reqBody

    if (!url || !db || !username || !apiKey) {
      throw new Error(
        'Credenciais do Odoo incompletas. Verifique URL, Banco de Dados, Usuário e Chave de API.',
      )
    }

    const cleanUrl = url.replace(/\/$/, '')

    const uid = await odooJsonRpc(
      cleanUrl,
      {
        service: 'common',
        method: 'authenticate',
        args: [db, username, apiKey, {}],
      },
      'Falha na autenticação do Odoo',
    )

    if (!uid || uid === false) {
      throw new Error(
        'Autenticação falhou no Odoo: credenciais inválidas. Verifique o usuário e a chave de API.',
      )
    }

    if (attachmentId) {
      const fullAtt = await odooJsonRpc(
        cleanUrl,
        {
          service: 'object',
          method: 'execute_kw',
          args: [
            db,
            uid,
            apiKey,
            'ir.attachment',
            'search_read',
            [[['id', '=', attachmentId]]],
            { fields: ['id', 'name', 'res_id', 'mimetype', 'datas'] },
          ],
        },
        'Erro ao buscar anexo no Odoo',
      )

      const attachment = fullAtt?.[0]
      if (!attachment || !attachment.datas) {
        throw new Error('Conteúdo do anexo não encontrado no Odoo.')
      }

      const binaryString = atob(attachment.datas)
      const sizeMB = binaryString.length / (1024 * 1024)
      if (sizeMB > 25) {
        throw new Error(
          `Anexo muito grande (${sizeMB.toFixed(1)}MB). Tamanho máximo suportado: 25MB.`,
        )
      }

      const mimeType = attachment.mimetype || 'application/octet-stream'
      const safeName = attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${Date.now()}_${attachment.id}_${safeName}`
      const targetClaimId = claimId || 'unknown'
      const filePath = `${targetClaimId}/${fileName}`

      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

      const { error: uploadError } = await supabaseAdmin.storage
        .from('claim_attachments')
        .upload(filePath, bytes.buffer, { contentType: mimeType, upsert: false })

      if (uploadError) {
        throw new Error(`Erro no upload do anexo para o Storage: ${uploadError.message}`)
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('claim_attachments')
        .getPublicUrl(filePath)

      return new Response(
        JSON.stringify({
          success: true,
          publicUrl: publicUrlData.publicUrl,
          mimeType,
          name: attachment.name,
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const stageIds = await odooJsonRpc(
      cleanUrl,
      {
        service: 'object',
        method: 'execute_kw',
        args: [db, uid, apiKey, 'crm.stage', 'search', [[['name', 'ilike', 'Repescagem']]]],
      },
      'Erro ao buscar estágio "Repescagem" no Odoo',
    )

    if (!stageIds || stageIds.length === 0) {
      throw new Error(
        'Nenhum estágio "Repescagem" encontrado no Odoo. Verifique se o estágio existe no pipeline CRM do Odoo.',
      )
    }

    const domain: any[] = [['stage_id', 'in', stageIds]]

    if (start_date && typeof start_date === 'string' && start_date.trim()) {
      domain.push(['create_date', '>=', start_date.trim()])
    }
    if (end_date && typeof end_date === 'string' && end_date.trim()) {
      domain.push(['create_date', '<=', `${end_date.trim()} 23:59:59`])
    }

    if (countOnly) {
      const count = await odooJsonRpc(
        cleanUrl,
        {
          service: 'object',
          method: 'execute_kw',
          args: [db, uid, apiKey, 'crm.lead', 'search_count', [domain]],
        },
        'Erro ao contar leads no Odoo',
      )

      return new Response(JSON.stringify({ success: true, count: count || 0 }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const leads =
      (await odooJsonRpc(
        cleanUrl,
        {
          service: 'object',
          method: 'execute_kw',
          args: [db, uid, apiKey, 'crm.lead', 'search_read', [domain], { offset, limit }],
        },
        'Erro ao buscar leads no Odoo',
      )) || []

    let filteredLeads = leads
    if (leads.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

      const raList = leads.map((l: any) => String(l.x_ra || l.name || `RA-${l.id}`).trim())
      const existingRas = new Set<string>()

      const { data: existingClaims } = await supabaseAdmin
        .from('claims')
        .select('ra')
        .in('ra', raList)
      if (existingClaims) existingClaims.forEach((c: any) => existingRas.add(c.ra))

      const { data: existingImportacao } = await supabaseAdmin
        .from('caixa_entrada_importacao')
        .select('id_ra')
        .in('id_ra', raList)
      if (existingImportacao) existingImportacao.forEach((c: any) => existingRas.add(c.id_ra))

      const { data: existingCaixa } = await supabaseAdmin
        .from('caixa_entrada')
        .select('id_ra')
        .in('id_ra', raList)
      if (existingCaixa) existingCaixa.forEach((c: any) => existingRas.add(c.id_ra))

      if (existingRas.size > 0) {
        filteredLeads = leads.filter((l: any) => {
          const lRa = String(l.x_ra || l.name || `RA-${l.id}`).trim()
          return !existingRas.has(lRa)
        })
      }
    }

    const leadIds = filteredLeads.map((l: any) => l.id)

    const partnerIds = filteredLeads
      .map((l: any) => (l.partner_id && Array.isArray(l.partner_id) ? l.partner_id[0] : null))
      .filter(Boolean)
    const uniquePartnerIds = [...new Set(partnerIds)]

    let partners: any[] = []
    if (uniquePartnerIds.length > 0) {
      try {
        partners =
          (await odooJsonRpc(
            cleanUrl,
            {
              service: 'object',
              method: 'execute_kw',
              args: [
                db,
                uid,
                apiKey,
                'res.partner',
                'search_read',
                [[['id', 'in', uniquePartnerIds]]],
                {
                  fields: [
                    'id',
                    'name',
                    'vat',
                    'phone',
                    'mobile',
                    'email',
                    'l10n_br_cnpj_cpf',
                    'x_cnpj',
                    'x_cpf_cnpj',
                    'x_ra',
                    'x_placa',
                  ],
                },
              ],
            },
            'Erro ao buscar parceiros no Odoo',
          )) || []
      } catch (e) {
        console.error('Partner fetch error (non-fatal):', e instanceof Error ? e.message : e)
      }
    }

    const partnerMap = new Map(partners.map((p) => [p.id, p]))
    for (const lead of filteredLeads) {
      if (lead.partner_id && Array.isArray(lead.partner_id)) {
        const p = partnerMap.get(lead.partner_id[0])
        if (p) {
          lead.company_name_enriched = p.name
          if (!lead.vat && !lead.x_cnpj && !lead.x_cpf_cnpj) {
            lead.vat = p.vat || p.l10n_br_cnpj_cpf || p.x_cnpj || p.x_cpf_cnpj
          }
          if (!lead.phone && !lead.mobile) {
            lead.phone = p.phone || p.mobile
          }
          if (!lead.x_ra && p.x_ra) lead.x_ra = p.x_ra
        }
      }
    }

    let attachments: any[] = []
    if (leadIds.length > 0) {
      try {
        attachments =
          (await odooJsonRpc(
            cleanUrl,
            {
              service: 'object',
              method: 'execute_kw',
              args: [
                db,
                uid,
                apiKey,
                'ir.attachment',
                'search_read',
                [
                  [
                    ['res_model', '=', 'crm.lead'],
                    ['res_id', 'in', leadIds],
                  ],
                ],
                { fields: ['id', 'name', 'res_id', 'mimetype'] },
              ],
            },
            'Erro ao buscar metadados de anexos no Odoo',
          )) || []
      } catch (e) {
        console.error(
          'Attachment metadata fetch error (non-fatal):',
          e instanceof Error ? e.message : e,
        )
      }
    }

    return new Response(JSON.stringify({ success: true, leads: filteredLeads, attachments }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    console.error('Odoo Sync Error:', err.message)
    const statusCode = err.message.toLowerCase().includes('autenticação') ? 401 : 500
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
