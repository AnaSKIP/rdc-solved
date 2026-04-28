import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import pdf from 'npm:pdf-parse@1.1.1'
import { Buffer } from 'node:buffer'

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

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('claim_attachments')
      .download('Documento-para-o-skip.pdf')

    let extractedCount = 0

    if (fileData) {
      console.log('Arquivo Documento-para-o-skip.pdf encontrado, iniciando extração real...')
      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const pdfData = await pdf(buffer)
      const text = pdfData.text || ''
      console.log('Texto extraído com sucesso. Início do texto:', text.substring(0, 200))

      const extractField = (patterns: RegExp[]) => {
        for (const regex of patterns) {
          const match = text.match(regex)
          if (match && match[1]) {
            return match[1].trim().replace(/\s+/g, ' ')
          }
        }
        return null
      }

      // Procura por campos reais variados do PDF
      const ra = extractField([
        /(?:Sinistro|Processo|Protocolo|Registro|RA)(?:\s*(?:Nº|nº|No|no))?[\s:-]+([A-Z0-9.-]+)/i,
        /Número[\s:-]+([A-Z0-9.-]+)/i,
      ])

      const empresa = extractField([
        /(?:Segurado|Terceiro|Cliente|Condutor|Motorista|Proprietário|Empresa|Nome)[\s:-]+([^\n\r]{3,50})/i,
      ])

      const valorStr = extractField([
        /(?:Valor(?: Total)?|Orçamento|Indenização|Franquia|Prejuízo|Total)[\s:-]+R?\$?\s*([\d.,]+)/i,
      ])
      const valor = valorStr ? parseFloat(valorStr.replace(/\./g, '').replace(',', '.')) : null

      const status = extractField([/(?:Status|Fase|Situação|Andamento)[\s:-]+([^\n\r]{3,30})/i])

      let dataEntrada = null
      const dataStr = extractField([
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
          if (!isNaN(parsed.getTime())) {
            dataEntrada = parsed.toISOString()
          }
        }
      }

      const analistaId = extractField([
        /(?:Analista(?: ID)?|Responsável|Corretor|Atendente)[\s:-]+([^\n\r]{3,50})/i,
      ])

      const payload = {
        ra: ra || null,
        empresa: empresa || null,
        valor: valor || null,
        status: status || null,
        data_entrada: dataEntrada || null,
        analista_id: analistaId || null,
      }

      console.log('Payload extraído do PDF:', payload)

      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('ra', payload.ra || 'unknown')
        .single()

      if (!existingLead && payload.ra) {
        const { data: lead, error: insertError } = await supabase
          .from('leads')
          .insert(payload)
          .select()
          .single()
        if (!insertError && lead) {
          extractedCount++
          console.log(`Lead salvo com sucesso e inserido na tabela: ${lead.ra}`)
        } else {
          console.error(`Falha ao inserir lead:`, insertError)
        }
      } else if (!payload.ra) {
        console.warn(
          'RA não encontrado no PDF. O registro não será inserido para evitar duplicatas inválidas.',
        )
      } else {
        console.log(`Lead com RA ${payload.ra} já existe no banco.`)
      }
    } else {
      console.log('Arquivo específico não encontrado no storage. Usando contagem atual do banco.')
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
