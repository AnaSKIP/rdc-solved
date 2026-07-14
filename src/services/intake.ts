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

export const extractOcrForLead = async (lead: any): Promise<OcrExtractedData | null> => {
  const docs = parseDocumentosAnexados(lead.documentos_anexados)
  const pdfDoc = docs.find((d) => d.type === 'pdf' || d.url.toLowerCase().endsWith('.pdf'))
  if (!pdfDoc) return null

  const extracted = await processPdfOcr(pdfDoc.url)

  const update: Record<string, unknown> = { texto_extraido_ocr: JSON.stringify(extracted) }
  if (extracted.causerName) update.causador_nome = extracted.causerName
  if (extracted.causerDocument) update.causador_cpf = extracted.causerDocument
  if (extracted.placaCausador) update.placa_causador = extracted.placaCausador
  if (extracted.dinamica) update.dinamica_acidente = extracted.dinamica
  if (extracted.marcaModelo) update.modelo_causador = extracted.marcaModelo
  if (extracted.anoCausador) update.ano_causador = extracted.anoCausador
  if (extracted.causerEndereco) update.causador_endereco = extracted.causerEndereco
  if (extracted.causerPhone) update.causador_telefone = extracted.causerPhone
  if (extracted.causer_whatsapp) update.causador_whatsapp = extracted.causer_whatsapp
  if (extracted.proprietarioNome) update.proprietario_veiculo_causador = extracted.proprietarioNome
  if (extracted.proprietarioTelefone) update.proprietario_telefone = extracted.proprietarioTelefone
  if (extracted.dataAcidente) {
    const parsed = parseDate(extracted.dataAcidente)
    if (parsed) update.data_acidente = parsed
  }
  if (extracted.horaAcidente) update.hora_acidente = extracted.horaAcidente
  if (extracted.localAcidente) update.local_acidente = extracted.localAcidente

  await supabase.from('caixa_entrada').update(update).eq('id_ra', lead.id_ra)
  return extracted
}

export interface BatchProgress {
  processed: number
  total: number
  currentRa: string
  phase: string
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

    const ocrBatch = await Promise.all(
      batch.map(async (lead, idx) => {
        onProgress({ processed: processed + idx, total, currentRa: lead.id_ra, phase: 'OCR' })
        try {
          await extractOcrForLead(lead)
        } catch {
          // Continue even if OCR fails for a specific lead
        }
        const { data: refreshed } = await supabase
          .from('caixa_entrada')
          .select('*')
          .eq('id_ra', lead.id_ra)
          .single()
        return refreshed || lead
      }),
    )

    const enrichedBatch = await Promise.all(
      ocrBatch.map(async (lead, idx) => {
        onProgress({
          processed: processed + idx,
          total,
          currentRa: lead.id_ra,
          phase: 'Enriquecimento',
        })
        let enrichedData: any = null
        if (lead.placa_causador) {
          try {
            const { data } = await supabase.functions.invoke('enrich-infocar-sci', {
              body: { placa: lead.placa_causador },
            })
            if (data?.success && data?.data) enrichedData = data.data
          } catch {
            // Continue with original data
          }
        }
        return {
          ...lead,
          causador_nome: enrichedData?.causerName || lead.causador_nome,
          causador_cpf: enrichedData?.causerDocument || lead.causador_cpf,
          causador_telefone: enrichedData?.causerPhone || lead.causador_telefone,
          causador_endereco: enrichedData?.causerEndereco || lead.causador_endereco,
          proprietario_veiculo_causador:
            enrichedData?.proprietarioNome || lead.proprietario_veiculo_causador,
          proprietario_telefone:
            enrichedData?.proprietarioTelefone || lead.proprietario_telefone || null,
          status_processamento: 'ENRIQUECIDO',
          historico_processamento: [
            ...(Array.isArray(lead.historico_processamento) ? lead.historico_processamento : []),
            { data: new Date().toISOString(), acao: 'OCR + Enriquecimento concluído' },
          ],
        }
      }),
    )

    const claimsToInsert = enrichedBatch.map((lead) => {
      const cName = (lead.cliente_nome || '').toLowerCase()
      const matchedClient = clientsDb?.find((c) => {
        const rs = (c['RAZÃO SOCIAL'] || '').toLowerCase()
        return rs && cName && (rs.includes(cName) || cName.includes(rs))
      })
      return {
        ra: lead.id_ra,
        client_id: matchedClient?.id || null,
        stage: 'Atribuir',
        status: 'pending',
        placa_causador: lead.placa_causador || null,
        causer_name: lead.causador_nome || null,
        phone:
          lead.causador_telefone || lead.causador_whatsapp || lead.proprietario_telefone || null,
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
    })

    const { data: insertedClaims, error: insertError } = await supabase
      .from('claims')
      .upsert(claimsToInsert, { onConflict: 'ra,date,placa_causador', ignoreDuplicates: false })
      .select('id, ra')

    if (!insertError && insertedClaims && insertedClaims.length > 0) {
      const attachmentsToInsert: any[] = []
      for (const lead of enrichedBatch) {
        const claim = insertedClaims.find((c) => c.ra === lead.id_ra)
        if (claim) {
          const docs = parseDocumentosAnexados(lead.documentos_anexados)
          for (const doc of docs) {
            attachmentsToInsert.push({
              claim_id: claim.id,
              url: doc.url,
              file_name: doc.name,
              file_type: doc.type,
            })
          }
        }
      }
      if (attachmentsToInsert.length > 0) {
        await supabase
          .from('attachments')
          .upsert(attachmentsToInsert, { onConflict: 'id', ignoreDuplicates: true })
      }
      const idsToDelete = enrichedBatch.map((l) => l.id_ra)
      await supabase.from('caixa_entrada').delete().in('id_ra', idsToDelete)
    }

    processed += batch.length
    onProgress({
      processed: Math.min(processed, total),
      total,
      currentRa: '',
      phase: 'Lote concluído',
    })
  }
}
