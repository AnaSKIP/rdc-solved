import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import pdf from 'npm:pdf-parse@1.1.1'
import { Buffer } from 'node:buffer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const PLATE_REGEX = /[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}/i

function isPlateLike(text: string): boolean {
  return PLATE_REGEX.test(text)
}

function cleanPlaca(placa: string | null): string | null {
  if (!placa) return null
  const matched = placa.match(PLATE_REGEX)
  return (matched ? matched[0] : placa).replace(/-/g, '').toUpperCase()
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

function extractDateWithPriority(text: string): string | null {
  const labels = [
    'Data do Acidente',
    'Data do Sinistro',
    'Data do Evento',
    'Data da Ocorrência',
    'Data',
  ]
  for (const label of labels) {
    const result = extractField(text, [
      new RegExp(`(?:${label})[\\s:-]+(\\d{2}\\/\\d{2}\\/\\d{4}|\\d{4}-\\d{2}-\\d{2})`, 'i'),
    ])
    if (result) return result
  }
  return null
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(url)
}

async function runTesseractOcr(buffer: Buffer): Promise<string> {
  try {
    const Tesseract = await import('npm:tesseract.js@5.1.1')
    const worker = await Tesseract.createWorker('por+eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`Tesseract OCR progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })
    await worker.setParameters({
      tessedit_pageseg_mode: '6' as any,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    })
    const { data } = await worker.recognize(buffer)
    await worker.terminate()
    return data.text || ''
  } catch (err: any) {
    console.warn('Tesseract OCR fallback failed:', err.message)
    return ''
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { fileUrl } = await req.json()
    if (!fileUrl) throw new Error('fileUrl is required')

    console.log('Fetching document from URL:', fileUrl)
    const fileRes = await fetch(fileUrl)
    if (!fileRes.ok) throw new Error('Failed to fetch document file')

    const arrayBuffer = await fileRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let text = ''
    let ocrMethod = 'pdf-parse'
    let needsHandwritingOcr = false

    if (isImageUrl(fileUrl)) {
      console.log('Image detected — running Tesseract OCR...')
      ocrMethod = 'tesseract-handwriting'
      text = await runTesseractOcr(buffer)
    } else {
      console.log('PDF detected — attempting pdf-parse for embedded text...')
      try {
        const pdfData = await pdf(buffer)
        text = pdfData.text || ''
        console.log(`pdf-parse extracted ${text.length} characters`)
      } catch (pdfErr: any) {
        console.warn('pdf-parse failed:', pdfErr.message)
      }
      if (text.trim().length < 50) {
        console.log(
          `Insufficient text (${text.trim().length} chars) — flagging for handwriting OCR`,
        )
        needsHandwritingOcr = true
        ocrMethod = 'pdf-parse+flagged-handwriting'
      }
    }

    const cliente = extractField(text, [
      /(?:Empresa|Cliente|Segurado|Viação|Transportadora|Razão Social)[\s:-]+([^\n\r]{3,50})/i,
    ])

    const placaOnibusRaw = extractField(text, [
      /(?:Placa do Ônibus|Placa do Onibus|Placa do Veículo Cliente|Placa Cliente|Placa Segurado|Placa do Veículo Avariado|Placa do Veículo)[\s:-]+([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})/i,
      /(?:Veículo Cliente|Veículo Segurado|Ônibus)[\s:-]+([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})/i,
      /(?:Placa)[\s:-]+([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})/i,
    ])
    const placaOnibus = cleanPlaca(placaOnibusRaw)

    const prefixo = extractField(text, [
      /(?:Prefixo|Nº do Ônibus|Carro|Frota|Nº Frota|Pref)[\s:-]+([A-Z0-9-]{3,10})/i,
    ])

    let causerName = extractField(text, [
      /(?:Nome do Causador|Nome do Terceiro|Motorista Causador|Nome Terceiro|Condutor Terceiro|Condutor do Veículo Causador|Proprietário do Veículo Causador|Proprietário|Causador)[\s:-]+([^\n\r]{3,50})/i,
      /(?<!Veículo\s)(?<!Veiculo\s)(?:Terceiro)[\s:-]+([^\n\r]{3,50})/i,
    ])
    if (causerName && isPlateLike(causerName)) {
      causerName = null
    }

    let placaCausadorRaw = extractField(text, [
      /(?:Placa do Causador|Placa do Terceiro|Placa Terceiro|Placa do Veículo Causador|Placa do Veículo Terceiro|Veículo Causador Placa)[\s:-]+([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})/i,
      /(?:Veículo Terceiro|Veículo Causador|Veículo do Terceiro|Veículo do Causador)[\s:-]+([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})/i,
    ])

    const veiculoGenerico = extractField(text, [
      /(?:Veículo)(?!\s+(?:Terceiro|Causador|do Terceiro|do Causador|Cliente|Segurado))[\s:-]+([^\n\r]{3,50})/i,
    ])

    if (!placaCausadorRaw && veiculoGenerico && isPlateLike(veiculoGenerico)) {
      placaCausadorRaw = veiculoGenerico.match(PLATE_REGEX)?.[0] || null
    }

    const placaCausador = cleanPlaca(placaCausadorRaw)

    let marcaModelo = extractField(text, [
      /(?:Marca\/Modelo|Modelo Terceiro|Modelo do Veículo Causador|Marca e Modelo do Terceiro|Modelo do Terceiro)[\s:-]+([^\n\r]{3,50})/i,
    ])

    if (!marcaModelo) {
      const veiculoTerceiroRaw = extractField(text, [
        /(?:Veículo Terceiro|Veículo Causador|Veículo do Terceiro|Veículo do Causador)[\s:-]+([^\n\r]{3,50})/i,
      ])
      if (veiculoTerceiroRaw && !isPlateLike(veiculoTerceiroRaw)) {
        marcaModelo = veiculoTerceiroRaw
      }
    }

    if (!marcaModelo && veiculoGenerico && !isPlateLike(veiculoGenerico)) {
      marcaModelo = veiculoGenerico
    }

    const causerDocument = extractField(text, [
      /(?:CPF|CNPJ|Documento)(?:[\s do causador]*|[\s do terceiro]*)[\s:-]+([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}|[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2}|[0-9]{11,14})/i,
    ])

    const causerPhone = extractField(text, [
      /(?:Telefone|Celular|Contato)(?:[\s do causador]*|[\s do terceiro]*)[\s:-]+(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/i,
    ])

    const causerWhatsapp =
      extractField(text, [
        /(?:WhatsApp)(?:[\s do causador]*|[\s do terceiro]*)[\s:-]+(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/i,
      ]) || causerPhone

    const proprietarioNome = extractField(text, [
      /(?:Proprietário do Veículo|Nome do Proprietário|Proprietário)[\s:-]+([^\n\r]{3,50})/i,
    ])

    const proprietarioTelefone = extractField(text, [
      /(?:Telefone do Proprietário|Telefone Proprietário|Contato do Proprietário)[\s:-]+(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/i,
    ])

    const causerEndereco = extractField(text, [
      /(?:Endereço|Logradouro|Local de Residência|Endereço do Causador|Endereço do Terceiro)(?:[\s do causador]*|[\s do terceiro]*)[\s:-]+([^\n\r]{5,100})/i,
    ])

    const dataAcidente = extractDateWithPriority(text)

    const horaAcidente = extractField(text, [
      /(?:Hora(?: do)?(?: Acidente| Sinistro| Evento| Ocorrência))[\s:-]+(\d{2}:\d{2}(?::\d{2})?)/i,
      /(?:Hora)[\s:-]+(\d{2}:\d{2}(?::\d{2})?)/i,
    ])

    const localAcidente = extractField(text, [
      /(?:Local(?: do)?(?: Acidente| Sinistro| Evento| Ocorrência)|Endereço do Acidente|Local do Sinistro)[\s:-]+([^\n\r]{5,150})/i,
    ])

    const anoCausador = extractField(text, [
      /(?:Ano(?: do)?(?: Veículo Causador| Causador| Terceiro)|Ano Fabricação)[\s:-]+(\d{4})/i,
      /(?:Ano)[\s:-]+(\d{4})/i,
    ])

    const dinamicaMatch = text.match(
      /(?:Dinâmica do Acidente|Relato do Acidente|Histórico|Descrição|Dinâmica|Resumo do Evento|Descrição do Acidente)[\s:-]+([\s\S]{10,2000}?)(?=\n(?:[A-Z][a-zÀ-ÿ]+[\s:-])|\n\n\n|$)/i,
    )
    let dinamica = dinamicaMatch ? dinamicaMatch[1].trim() : null
    if (dinamica) {
      dinamica = dinamica.replace(/\s+/g, ' ')
    }

    const extracted = {
      cliente,
      placaOnibus,
      prefixo,
      causerName,
      placaCausador,
      marcaModelo,
      causerDocument,
      causerPhone,
      causer_whatsapp: causerWhatsapp,
      causerEndereco,
      proprietarioNome,
      proprietarioTelefone,
      dinamica,
      dataAcidente,
      horaAcidente,
      localAcidente,
      anoCausador,
    }

    console.log('Dados extraídos:', extracted)
    console.log(`OCR Method: ${ocrMethod}, Handwriting flag: ${needsHandwritingOcr}`)

    return new Response(
      JSON.stringify({
        success: true,
        extracted,
        ocrMethod,
        needsHandwritingOcr,
        textLength: text.length,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (err: any) {
    console.error('Edge Function Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
