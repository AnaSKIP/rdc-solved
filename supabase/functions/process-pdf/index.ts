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
    const { fileUrl } = await req.json()
    if (!fileUrl) throw new Error('fileUrl is required')

    console.log('Fetching PDF from URL:', fileUrl)
    const fileRes = await fetch(fileUrl)
    if (!fileRes.ok) throw new Error('Failed to fetch PDF file')

    const arrayBuffer = await fileRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('Parsing PDF - Iniciando extração factual estrita...')
    const pdfData = await pdf(buffer)
    const text = pdfData.text || ''

    const extractField = (patterns: RegExp[]) => {
      for (const regex of patterns) {
        const match = text.match(regex)
        if (match && match[1]) {
          return match[1].trim().replace(/\s+/g, ' ')
        }
      }
      return null
    }

    const cliente = extractField([
      /(?:Empresa|Cliente|Segurado|Viação|Transportadora)[\s:-]+([^\n\r]{3,50})/i,
    ])

    const placaOnibus = extractField([
      /(?:Placa do Ônibus|Placa do Veículo|Placa Cliente|Placa Segurado)[\s:-]+([A-Z0-9-]{7,8})/i,
      /Veículo Cliente.*?([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})/i,
    ])

    const prefixo = extractField([/(?:Prefixo|Nº do Ônibus|Carro|Frota)[\s:-]+([A-Z0-9-]{3,10})/i])

    const causerName = extractField([
      /(?:Nome do Causador|Causador|Terceiro|Motorista Causador|Nome Terceiro|Condutor Terceiro)[\s:-]+([^\n\r]{3,50})/i,
    ])

    const placaCausador = extractField([
      /(?:Placa do Causador|Placa Terceiro|Placa do Veículo Causador)[\s:-]+([A-Z0-9-]{7,8})/i,
      /Veículo Terceiro.*?([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})/i,
    ])

    const marcaModelo = extractField([
      /(?:Marca\/Modelo|Veículo Causador|Veículo Terceiro|Modelo Terceiro)[\s:-]+([^\n\r]{3,50})/i,
    ])

    const causerDocument = extractField([
      /(?:CPF|CNPJ|Documento)(?:[\s do causador]*|[\s do terceiro]*)[\s:-]+([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}|[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2}|[0-9]{11,14})/i,
    ])

    const causerPhone = extractField([
      /(?:Telefone|Celular|Contato|WhatsApp)(?:[\s do causador]*|[\s do terceiro]*)[\s:-]+(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/i,
    ])

    const proprietarioNome = extractField([
      /(?:Proprietário do Veículo|Nome do Proprietário|Proprietário)[\s:-]+([^\n\r]{3,50})/i,
    ])

    const causerEndereco = extractField([
      /(?:Endereço|Logradouro|Local de Residência)(?:[\s do causador]*|[\s do terceiro]*)[\s:-]+([^\n\r]{5,100})/i,
    ])

    // Busca rígida por sumários sem expansão do texto
    const dinamicaMatch = text.match(
      /(?:Dinâmica do Acidente|Relato do Acidente|Histórico|Descrição|Dinâmica|Resumo do Evento)[\s:-]+([\s\S]{10,2000}?)(?=\n(?:[A-Z][a-zÀ-ÿ]+[\s:-])|\n\n\n|$)/i,
    )
    let dinamica = dinamicaMatch ? dinamicaMatch[1].trim() : null

    if (dinamica) {
      dinamica = dinamica.replace(/\s+/g, ' ')
    }

    const extracted = {
      cliente,
      placaOnibus: placaOnibus ? placaOnibus.replace('-', '') : null,
      prefixo,
      causerName,
      placaCausador: placaCausador ? placaCausador.replace('-', '') : null,
      marcaModelo,
      causerDocument,
      causerPhone,
      causerEndereco,
      proprietarioNome,
      dinamica,
    }

    console.log('Dados extraídos factual e estritamente:', extracted)

    return new Response(JSON.stringify({ success: true, extracted }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    console.error('Edge Function Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
