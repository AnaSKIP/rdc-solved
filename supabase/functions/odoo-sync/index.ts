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
      throw new Error('Missing Odoo credentials')
    }

    const cleanUrl = url.replace(/\/$/, '')

    // 1. Authenticate via JSON-RPC
    const authRes = await fetch(`${cleanUrl}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [db, username, apiKey, {}],
        },
      }),
    })

    if (!authRes.ok) {
      throw new Error(`HTTP Error: ${authRes.status}`)
    }

    const authData = await authRes.json()
    const uid = authData.result

    if (!uid) {
      throw new Error(
        `Autenticação falhou no Odoo: ${authData.error?.data?.message || 'Credenciais inválidas'}`,
      )
    }

    if (attachmentId) {
      const attRes = await fetch(`${cleanUrl}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [
              db,
              uid,
              apiKey,
              'ir.attachment',
              'search_read',
              [[['id', '=', attachmentId]]],
              {
                fields: ['id', 'name', 'res_id', 'mimetype', 'datas'],
              },
            ],
          },
        }),
      })
      const attData = await attRes.json()
      if (attData.error) throw new Error(attData.error.data.message)

      const fullAtt = attData.result?.[0]
      if (!fullAtt || !fullAtt.datas) {
        throw new Error('Attachment content not found')
      }

      // Converte e faz upload direto do backend para o Storage (Evita travar o frontend com arquivos grandes)
      const mimeType = fullAtt.mimetype || 'application/octet-stream'
      const safeName = fullAtt.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${Date.now()}_${fullAtt.id}_${safeName}`
      const targetClaimId = claimId || 'unknown'
      const filePath = `${targetClaimId}/${fileName}`

      const binaryString = atob(fullAtt.datas)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('claim_attachments')
        .upload(filePath, bytes.buffer, {
          contentType: mimeType,
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabaseAdmin.storage
        .from('claim_attachments')
        .getPublicUrl(filePath)

      return new Response(
        JSON.stringify({
          success: true,
          publicUrl: publicUrlData.publicUrl,
          mimeType: mimeType,
          name: fullAtt.name,
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // 2. Fetch Stage IDs by name
    const stageRes = await fetch(`${cleanUrl}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [db, uid, apiKey, 'crm.stage', 'search', [['name', 'ilike', 'Repescagem']]],
        },
      }),
    })

    const stageData = await stageRes.json()
    if (stageData.error) throw new Error(stageData.error.data.message)
    const stageIds = stageData.result || []

    const domain: any[] = []
    if (stageIds.length > 0) {
      domain.push(['stage_id', 'in', stageIds])
    }
    if (start_date) {
      domain.push(['create_date', '>=', start_date])
    }
    if (end_date) {
      domain.push(['create_date', '<=', end_date + ' 23:59:59'])
    }
    if (domain.length === 0) {
      domain.push(['id', '=', -1])
    }

    if (countOnly) {
      const countRes = await fetch(`${cleanUrl}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'object',
            method: 'execute_kw',
            args: [db, uid, apiKey, 'crm.lead', 'search_count', [domain]],
          },
        }),
      })
      const countData = await countRes.json()
      if (countData.error) throw new Error(countData.error.data.message)

      return new Response(JSON.stringify({ success: true, count: countData.result }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 3. Search Leads (Buscando o objeto completo para garantir todos os custom fields)
    const searchRes = await fetch(`${cleanUrl}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            db,
            uid,
            apiKey,
            'crm.lead',
            'search_read',
            [domain],
            {
              offset: offset,
              limit: limit,
            },
          ],
        },
      }),
    })

    const searchData = await searchRes.json()
    if (searchData.error) throw new Error(searchData.error.data.message)

    let leads = searchData.result || []

    // FILTRO DE DUPLICIDADE: Remove os que já existem no Supabase (Claims, Caixa de Entrada e Importação)
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
      if (existingClaims) {
        existingClaims.forEach((c: any) => existingRas.add(c.ra))
      }

      const { data: existingImportacao } = await supabaseAdmin
        .from('caixa_entrada_importacao')
        .select('id_ra')
        .in('id_ra', raList)
      if (existingImportacao) {
        existingImportacao.forEach((c: any) => existingRas.add(c.id_ra))
      }

      const { data: existingCaixa } = await supabaseAdmin
        .from('caixa_entrada')
        .select('id_ra')
        .in('id_ra', raList)
      if (existingCaixa) {
        existingCaixa.forEach((c: any) => existingRas.add(c.id_ra))
      }

      if (existingRas.size > 0) {
        leads = leads.filter((l: any) => {
          const lRa = String(l.x_ra || l.name || `RA-${l.id}`).trim()
          return !existingRas.has(lRa)
        })
      }
    }

    const leadIds = leads.map((l: any) => l.id)

    // 3.5. Fetch Partners (Contacts) to enrich leads with missing data
    const partnerIds = leads
      .map((l: any) => (l.partner_id && Array.isArray(l.partner_id) ? l.partner_id[0] : null))
      .filter(Boolean)
    const uniquePartnerIds = [...new Set(partnerIds)]

    let partners: any[] = []
    if (uniquePartnerIds.length > 0) {
      const partnerRes = await fetch(`${cleanUrl}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
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
        }),
      })
      const partnerData = await partnerRes.json()
      if (partnerData.result) {
        partners = partnerData.result
      }
    }

    const partnerMap = new Map(partners.map((p) => [p.id, p]))
    for (const lead of leads) {
      if (lead.partner_id && Array.isArray(lead.partner_id)) {
        const p = partnerMap.get(lead.partner_id[0])
        if (p) {
          // O partner no Odoo é geralmente a empresa (Cliente), então p.name = Cliente
          // Não mapear p.name para o nome do causador
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

    // 4. Search Attachments for these leads
    let attachments: any[] = []
    if (leadIds.length > 0) {
      const attRes = await fetch(`${cleanUrl}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
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
              {
                fields: ['id', 'name', 'res_id', 'mimetype'],
              },
            ],
          },
        }),
      })
      const attData = await attRes.json()
      if (attData.result) {
        attachments = attData.result
      } else if (attData.error) {
        console.error('Error fetching attachments:', attData.error.data.message)
      }
    }

    return new Response(JSON.stringify({ success: true, leads, attachments }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    console.error('Odoo Sync Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
