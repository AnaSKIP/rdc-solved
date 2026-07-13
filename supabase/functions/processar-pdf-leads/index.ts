import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import pdf from 'npm:pdf-parse@1.1.1'
import { Buffer } from 'node:buffer'
import { corsHeaders } from '../_shared/cors.ts'

interface ExtractedData {
  ra: string | null
  empresa: string | null
  cnpj: string | null
  valor: number | null
  status: string | null
  dataEntrada: string | null
  analistaId: string | null
}

function extractField(text: string, patterns: RegExp[]): string | null {
  for (const regex of patterns) {
    const match = text.match(regex)
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ')
    }
  }
  return null
}

function extractPdfData(text: string): ExtractedData {
  const cnpj = extractField(text, [
    /(?:CNPJ)[:\s]*([0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2})/i,
    /(?:CNPJ)[:\s]*([0-9]{14})/i,
    /([0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2})/i,
  ])

  const empresa = extractField(text, [
    /(?:Segurado|Cliente|Empresa|Viação|Transportadora|Razão Social|Razão Social)[:\s-]+([^\n\r]{3,60})/i,
    /(?:Empresa|Cliente)[:\s:-]+([^\n\r]{3,50})/i,
  ])

  const ra = extractField(text, [
    /(?:Sinistro|Processo|Protocolo|Registro|RA)(?:\s*(?:Nº|nº|No|no))?[\s:-]+([A-Z0-9.-]+)/i,
    /Número[\s:-]+([A-Z0-9.-]+)/i,
  ])

  const valorStr = extractField(text, [
    /(?:Valor(?: Total)?|Orçamento|Indenização|Franquia|Prejuízo|Total)[\s:-]+R?\$?\s*([\d.,]+)/i,
  ])
  const valor = valorStr ? parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) : null

  const status = extractField(text, [/(?:Status|Fase|Situação|Andamento)[\s:-]+([^\n\r]{3,30})/i])

  const dinamicaMatch = text.match(
    /(?:Dinâmica do Acidente|Relato do Acidente|Histórico|Descrição|Dinâmica|Resumo do Evento)[\s:-]+([\s\S]{10,2000}?)(?=\n[A-Z][a-zÀ-ÿ]+[\s:-]|\n\n\n|$)/i,
  )
  const dinamica = dinamicaMatch ? dinamicaMatch[1].trim().replace(/\s+/g, ' ') : null

  let dataEntrada: string | null = null
  const dataStr = extractField(text, [
    /(?:Data(?: do)?(?: Sinistro| Acidente| Evento| Aviso| Entrada)|Criado em)[\s:-]+(\d{2}\/\d{2}\/\d{4})/i,
    /(?:Data(?: do)?(?: Sinistro| Acidente| Evento| Aviso| Entrada)|Criado em)[\s:-]+([\d-]{10})/i,
    /Data[\s:-]+(\d{2}\/\d{2}\/\d{4})/i,
  ])
  if (dataStr) {
    if (dataStr.includes('/')) {
      const parts = dataStr.split('/')
      if (parts.length === 3) {
        dataEntrada = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString()
      }
    } else {
      const parsed = new Date(dataStr)
      if (!isNaN(parsed.getTime())) dataEntrada = parsed.toISOString()
    }
  }

  const analistaId = extractField(text, [
    /(?:Analista(?: ID)?|Responsável|Corretor|Atendente)[\s:-]+([^\n\r]{3,50})/i,
  ])

  return { ra, empresa, cnpj, valor, status, dataEntrada, analistaId }
}

async function lookupClientByCnpj(supabase: any, cnpj: string) {
  const { data: client } = await supabase
    .from('clients')
    .select('id, "RAZÃO SOCIAL", "CNPJ"')
    .eq('CNPJ', cnpj)
    .single()
  if (client) return client

  const cnpjClean = cnpj.replace(/[^0-9]/g, '')
  const { data: clientClean } = await supabase
    .from('clients')
    .select('id, "RAZÃO SOCIAL", "CNPJ"')
    .eq('CNPJ', cnpjClean)
    .single()
  return clientClean || null
}

async function processPdfBuffer(buffer: Buffer, fileName: string, supabase: any): Promise<boolean> {
  try {
    const pdfData = await pdf(buffer)
    const text = pdfData.text || ''
    if (!text || text.trim().length < 10) return false

    const extracted = extractPdfData(text)

    let clientId: string | null = null
    let resolvedEmpresa = extracted.empresa

    if (extracted.cnpj) {
      const client = await lookupClientByCnpj(supabase, extracted.cnpj)
      if (client) {
        clientId = client.id
        resolvedEmpresa = client['RAZÃO SOCIAL'] || extracted.empresa
      }
    }

    const payload: any = {
      ra: extracted.ra,
      empresa: resolvedEmpresa,
      cnpj: extracted.cnpj,
      valor: extracted.valor,
      status: extracted.status,
      data_entrada: extracted.dataEntrada,
      analista_id: extracted.analistaId,
    }

    if (!extracted.ra) {
      console.warn(`RA not found in ${fileName}, skipping.`)
      return false
    }

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, ra, cnpj, empresa')
      .eq('ra', extracted.ra)
      .single()

    let leadId: string | null = null

    if (!existingLead) {
      const { data: lead, error: insertError } = await supabase
        .from('leads')
        .insert(payload)
        .select()
        .single()
      if (insertError) {
        console.error(`Failed to insert lead from ${fileName}:`, insertError)
        return false
      }
      leadId = lead?.id || null
      console.log(`Lead created from ${fileName}: ${extracted.ra}`)
    } else {
      if (!existingLead.cnpj && extracted.cnpj) {
        const { error: updateError } = await supabase
          .from('leads')
          .update({ cnpj: extracted.cnpj, empresa: resolvedEmpresa || existingLead.empresa })
          .eq('id', existingLead.id)
        if (updateError) {
          console.error(`Failed to update lead ${extracted.ra}:`, updateError)
          return false
        }
        console.log(`Lead updated with CNPJ: ${extracted.ra}`)
      } else {
        console.log(`Lead ${extracted.ra} already has CNPJ, skipping.`)
        return false
      }
      leadId = existingLead.id
    }

    if (extracted.ra) {
      const { data: claim } = await supabase
        .from('claims')
        .select('id')
        .eq('ra', extracted.ra)
        .single()
      if (claim) {
        await supabase
          .from('claims')
          .update({
            client_id: clientId,
            company_cnpj: extracted.cnpj,
            causer_name: resolvedEmpresa,
          })
          .eq('id', claim.id)
      }
    }

    return true
  } catch (err: any) {
    console.error(`Error parsing ${fileName}:`, err.message)
    return false
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const allFiles: { name: string; path: string }[] = []

    const { data: storageFiles, error: listError } = await supabase.storage
      .from('claim_attachments')
      .list()
    if (!listError && storageFiles) {
      for (const f of storageFiles) {
        if (f.name && !f.name.endsWith('/')) {
          allFiles.push({ name: f.name, path: f.name })
        }
      }
    }

    const { data: attachmentRecords } = await supabase.from('attachments').select('file_name, url')
    if (attachmentRecords) {
      for (const att of attachmentRecords) {
        const name = att.file_name || (att.url ? att.url.split('/').pop() : '')
        if (name) allFiles.push({ name, path: name })
      }
    }

    const seen = new Set<string>()
    const uniqueFiles = allFiles.filter((f) => {
      if (seen.has(f.name)) return false
      seen.add(f.name)
      return true
    })

    let extractedCount = 0

    for (const fileInfo of uniqueFiles) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('claim_attachments')
        .download(fileInfo.path)

      if (downloadError || !fileData) {
        console.log(`Storage download failed for ${fileInfo.name}, trying URL fetch...`)
        try {
          const fileRes = await fetch(fileInfo.path)
          if (!fileRes.ok) continue
          const arrayBuffer = await fileRes.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const processed = await processPdfBuffer(buffer, fileInfo.name, supabase)
          if (processed) extractedCount++
        } catch (e) {
          console.log(`URL fetch failed for ${fileInfo.name}`)
        }
        continue
      }

      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const processed = await processPdfBuffer(buffer, fileInfo.name, supabase)
      if (processed) extractedCount++
    }

    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, count: count || 0, extractedCount }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    console.error('Erro na função processar-pdf-leads:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
