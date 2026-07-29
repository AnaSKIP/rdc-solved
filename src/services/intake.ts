import { supabase } from '@/lib/supabase/client'
import { processPdfOcr, OcrExtractedData } from '@/services/ocr'
import { parseDocumentosAnexados } from '@/lib/document-utils'

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return dateStr
}

export const PROCESSING_STEPS = [
  {
    id: 1,
    name: 'Upload',
    description: 'Receber e armazenar documentos no Supabase Storage',
  },
  {
    id: 2,
    name: 'OCR',
    description: 'Extrair texto e dados estruturados dos documentos',
  },
  {
    id: 3,
    name: 'Enriquecimento',
    description: 'Consultar bases externas (Infocar/SCI) com a placa extraída',
  },
  {
    id: 4,
    name: 'Validação',
    description: 'Validar dados extraídos e enriquecidos antes da transferência',
  },
  {
    id: 5,
    name: 'Transferência',
    description: 'Mover lead processado para a tabela de claims no Kanban',
  },
] as const

export interface BatchProgress {
  processed: number
  total: number
  currentRa: string
  phase: string
  step?: number
  stepName?: string
}

interface StepResult<T> {
  success: boolean
  data?: T
  error?: string
}

export const step1Upload = async (
  lead: any,
): Promise<StepResult<{ docs: ReturnType<typeof parseDocumentosAnexados>; ra: string }>> => {
  try {
    const docs = parseDocumentosAnexados(lead.documentos_anexados)
    if (docs.length === 0) {
      return { success: false, error: 'Nenhum documento anexado ao lead.' }
    }
    return {
      success: true,
      data: { docs, ra: lead.id_ra },
    }
  } catch (err: any) {
    return { success: false, error: `Erro no upload: ${err.message}` }
  }
}

export const step2Ocr = async (
  lead: any,
  docs: ReturnType<typeof parseDocumentosAnexados>,
): Promise<StepResult<OcrExtractedData | null>> => {
  try {
    const pdfDoc = docs.find((d) => d.type === 'pdf' || d.url.toLowerCase().endsWith('.pdf'))
    if (!pdfDoc) return { success: true, data: null }

    const extracted = await processPdfOcr(pdfDoc.url)

    const update: Record<string, unknown> = { texto_extraido_ocr: JSON.stringify(extracted) }
    if (extracted.placaOnibus) update.placa_onibus = extracted.placaOnibus
    if (extracted.prefixo) update.prefixo_onibus = extracted.prefixo
    if (extracted.causerName) update.causador_nome = extracted.causerName
    if (extracted.causerDocument) update.causador_cpf = extracted.causerDocument
    if (extracted.placaCausador) update.placa_causador = extracted.placaCausador
    if (extracted.dinamica) update.dinamica_acidente = extracted.dinamica
    if (extracted.marcaModelo) update.modelo_causador = extracted.marcaModelo
    if (extracted.anoCausador) update.ano_causador = extracted.anoCausador
    if (extracted.causerEndereco) update.causador_endereco = extracted.causerEndereco
    if (extracted.causerPhone) update.causador_telefone = extracted.causerPhone
    if (extracted.causer_whatsapp) update.causador_whatsapp = extracted.causer_whatsapp
    if (extracted.proprietarioNome)
      update.proprietario_veiculo_causador = extracted.proprietarioNome
    if (extracted.proprietarioTelefone)
      update.proprietario_telefone = extracted.proprietarioTelefone
    if (extracted.dataAcidente) {
      const parsed = parseDate(extracted.dataAcidente)
      if (parsed) update.data_acidente = parsed
    }
    if (extracted.horaAcidente) update.hora_acidente = extracted.horaAcidente
    if (extracted.localAcidente) update.local_acidente = extracted.localAcidente

    await supabase.from('caixa_entrada').update(update).eq('id_ra', lead.id_ra)

    return { success: true, data: extracted }
  } catch (err: any) {
    return { success: false, error: `Erro no OCR: ${err.message}` }
  }
}

export const step3Enrichment = async (lead: any): Promise<StepResult<any>> => {
  try {
    if (!lead.placa_causador) return { success: true, data: null }

    const { data, error } = await supabase.functions.invoke('enrich-infocar-sci', {
      body: { placa: lead.placa_causador },
    })

    if (error) return { success: false, error: `Erro no enriquecimento: ${error.message}` }
    if (!data?.success || !data?.data) return { success: true, data: null }

    const enriched = data.data
    const update: Record<string, unknown> = {}

    if (enriched.causerName) update.causador_nome = enriched.causerName
    if (enriched.causerDocument) update.causador_cpf = enriched.causerDocument
    if (enriched.causerPhone) update.causador_telefone = enriched.causerPhone
    if (enriched.causerEndereco) update.causador_endereco = enriched.causerEndereco
    if (enriched.proprietarioNome) update.proprietario_veiculo_causador = enriched.proprietarioNome
    if (enriched.proprietarioTelefone) update.proprietario_telefone = enriched.proprietarioTelefone

    if (Object.keys(update).length > 0) {
      await supabase.from('caixa_entrada').update(update).eq('id_ra', lead.id_ra)
    }

    return { success: true, data: enriched }
  } catch (err: any) {
    return { success: false, error: `Erro no enriquecimento: ${err.message}` }
  }
}

export const step4Validation = async (lead: any): Promise<StepResult<any>> => {
  try {
    const { data: refreshed } = await supabase
      .from('caixa_entrada')
      .select('*')
      .eq('id_ra', lead.id_ra)
      .single()

    const validated = refreshed || lead
    const warnings: string[] = []

    if (!validated.causador_nome) warnings.push('Nome do causador não extraído')
    if (!validated.placa_causador) warnings.push('Placa do causador não extraída')
    if (!validated.causador_cpf) warnings.push('CPF/CNPJ do causador não extraído')

    return {
      success: true,
      data: { ...validated, _validationWarnings: warnings },
    }
  } catch (err: any) {
    return { success: false, error: `Erro na validação: ${err.message}` }
  }
}

export const step5Transfer = async (
  validatedLead: any,
  clientsDb: any[] | null,
): Promise<StepResult<{ claimId: string | null }>> => {
  try {
    const lead = validatedLead
    const cName = (lead.cliente_nome || '').toLowerCase()
    const matchedClient = clientsDb?.find((c) => {
      const rs = (c['RAZÃO SOCIAL'] || '').toLowerCase()
      return rs && cName && (rs.includes(cName) || cName.includes(rs))
    })

    const claimRecord = {
      ra: lead.id_ra,
      client_id: matchedClient?.id || null,
      stage: 'Atribuir',
      status: 'pending',
      placa_causador: lead.placa_causador || null,
      causer_name: lead.causador_nome || null,
      phone: lead.causador_telefone || lead.causador_whatsapp || lead.proprietario_telefone || null,
      relato_acidente: lead.dinamica_acidente || null,
      placa_onibus: lead.placa_onibus || null,
      prefixo_onibus: lead.prefixo_onibus || null,
      financial_total_value: lead.valor_dano_estimado || 0,
      is_validated: true,
      is_enriched: true,
      date: lead.data_acidente
        ? new Date(lead.data_acidente).toISOString()
        : new Date().toISOString(),
      causer_document: lead.causador_cpf || null,
      causer_endereco: lead.causador_endereco || null,
      tipo_veiculo_causador: lead.modelo_causador || null,
      proprietario_veiculo_causador: lead.proprietario_veiculo_causador || null,
      proprietario_telefone: lead.proprietario_telefone || null,
    }

    const { data: insertedClaims, error: insertError } = await supabase
      .from('claims')
      .upsert(claimRecord, {
        onConflict: 'ra,date,placa_causador',
        ignoreDuplicates: false,
      })
      .select('id, ra')

    if (insertError) throw insertError

    const claimId = insertedClaims?.[0]?.id || null

    if (claimId) {
      const docs = parseDocumentosAnexados(lead.documentos_anexados)
      if (docs.length > 0) {
        const attachmentsToInsert = docs.map((doc) => ({
          claim_id: claimId,
          url: doc.url,
          file_name: doc.name,
          file_type: doc.type,
        }))
        await supabase
          .from('attachments')
          .upsert(attachmentsToInsert, { onConflict: 'id', ignoreDuplicates: true })
      }

      await supabase.from('caixa_entrada').delete().eq('id_ra', lead.id_ra)
    }

    return { success: true, data: { claimId } }
  } catch (err: any) {
    return { success: false, error: `Erro na transferência: ${err.message}` }
  }
}

export const extractOcrForLead = async (lead: any): Promise<OcrExtractedData | null> => {
  const uploadResult = await step1Upload(lead)
  if (!uploadResult.success || !uploadResult.data) return null

  const ocrResult = await step2Ocr(lead, uploadResult.data.docs)
  if (!ocrResult.success) throw new Error(ocrResult.error || 'Erro no OCR')
  return ocrResult.data
}

export const processBatchWithOcr = async (
  pendingLeads: any[],
  clientsDb: any[] | null,
  onProgress: (p: BatchProgress) => void,
) => {
  const batchSize = 10
  const total = pendingLeads.length
  let processed = 0

  for (let i = 0; i < pendingLeads.length; i += batchSize) {
    const batch = pendingLeads.slice(i, i + batchSize)

    for (let j = 0; j < batch.length; j++) {
      const lead = batch[j]
      const idx = i + j

      onProgress({
        processed: idx,
        total,
        currentRa: lead.id_ra,
        phase: 'Upload',
        step: 1,
        stepName: 'Upload',
      })

      const uploadResult = await step1Upload(lead)
      if (!uploadResult.success || !uploadResult.data) {
        console.error(`[INTAKE] Lead ${lead.id_ra} skipped — Upload failed: ${uploadResult.error}`)
        processed++
        continue
      }

      onProgress({
        processed: idx,
        total,
        currentRa: lead.id_ra,
        phase: 'OCR',
        step: 2,
        stepName: 'OCR',
      })

      const ocrResult = await step2Ocr(lead, uploadResult.data.docs)

      onProgress({
        processed: idx,
        total,
        currentRa: lead.id_ra,
        phase: 'Enriquecimento',
        step: 3,
        stepName: 'Enriquecimento',
      })

      const enrichResult = await step3Enrichment(lead)

      onProgress({
        processed: idx,
        total,
        currentRa: lead.id_ra,
        phase: 'Validação',
        step: 4,
        stepName: 'Validação',
      })

      const validationResult = await step4Validation(lead)
      if (!validationResult.success || !validationResult.data) {
        console.error(
          `[INTAKE] Lead ${lead.id_ra} skipped — Validation failed: ${validationResult.error}`,
        )
        processed++
        continue
      }

      onProgress({
        processed: idx,
        total,
        currentRa: lead.id_ra,
        phase: 'Transferência',
        step: 5,
        stepName: 'Transferência',
      })

      await step5Transfer(validationResult.data, clientsDb)

      processed++
    }

    onProgress({
      processed: Math.min(processed, total),
      total,
      currentRa: '',
      phase: 'Lote concluído',
      step: 5,
      stepName: 'Transferência',
    })
  }
}
