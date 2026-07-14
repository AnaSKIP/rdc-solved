import { supabase } from '@/lib/supabase/client'

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
