import { supabase } from '@/lib/supabase/client'
import { parseDocumentosAnexados } from '@/lib/document-utils'

export interface OcrExtractedData {
  cliente: string | null
  placaOnibus: string | null
  prefixo: string | null
  causerName: string | null
  placaCausador: string | null
  marcaModelo: string | null
  causerDocument: string | null
  causerPhone: string | null
  causer_whatsapp: string | null
  causerEndereco: string | null
  proprietarioNome: string | null
  proprietarioTelefone: string | null
  dinamica: string | null
  dataAcidente: string | null
  horaAcidente: string | null
  localAcidente: string | null
  anoCausador: string | null
}

export const processPdfOcr = async (fileUrl: string): Promise<OcrExtractedData> => {
  const { data, error } = await supabase.functions.invoke('process-pdf', {
    body: { fileUrl },
  })
  if (error) throw new Error('Erro na comunicação com a Edge Function: ' + error.message)
  if (data?.error) throw new Error('Erro na extração OCR: ' + data.error)
  if (!data?.success || !data?.extracted) throw new Error('Nenhum dado extraído do documento.')
  return data.extracted as OcrExtractedData
}

export const uploadAndProcessPdf = async (file: File): Promise<OcrExtractedData> => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
  const filePath = `uploads/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('claim_attachments')
    .upload(filePath, file)

  if (uploadError) throw new Error('Falha no upload do documento: ' + uploadError.message)

  const { data: publicUrlData } = supabase.storage.from('claim_attachments').getPublicUrl(filePath)

  return processPdfOcr(publicUrlData.publicUrl)
}

export const processOcrForBatchDinamica = async (
  table: 'caixa_entrada_importacao' | 'caixa_entrada',
  ras: string[],
): Promise<{ processed: number; skipped: number; failed: number }> => {
  if (ras.length === 0) return { processed: 0, skipped: 0, failed: 0 }

  const { data: records } = await supabase
    .from(table)
    .select('id_ra, dinamica_acidente, documentos_anexados')
    .in('id_ra', ras)

  if (!records || records.length === 0) return { processed: 0, skipped: 0, failed: 0 }

  let processed = 0
  let skipped = 0
  let failed = 0

  for (const record of records) {
    if (record.dinamica_acidente) {
      skipped++
      continue
    }

    const docs = parseDocumentosAnexados(record.documentos_anexados)
    const pdfDocs = docs.filter((d) => d.type === 'pdf' || d.name.toLowerCase().endsWith('.pdf'))

    if (pdfDocs.length === 0) {
      skipped++
      continue
    }

    let extracted = false
    for (const pdfDoc of pdfDocs) {
      try {
        const result = await processPdfOcr(pdfDoc.url)
        if (result.dinamica) {
          await supabase
            .from(table)
            .update({ dinamica_acidente: result.dinamica })
            .eq('id_ra', record.id_ra)
          processed++
          extracted = true
          break
        }
      } catch {
        // Continue to next PDF
      }
    }

    if (!extracted) failed++
  }

  return { processed, skipped, failed }
}

export const processOcrForNullDinamica = async (
  table: 'caixa_entrada_importacao' | 'caixa_entrada',
  limit = 100,
): Promise<number> => {
  const { data: records } = await supabase
    .from(table)
    .select('id_ra')
    .is('dinamica_acidente', null)
    .limit(limit)

  if (!records || records.length === 0) return 0

  const ras = records.map((r) => r.id_ra)
  const result = await processOcrForBatchDinamica(table, ras)
  return result.processed
}
