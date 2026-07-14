import { supabase } from '@/lib/supabase/client'

export interface JudicialMovement {
  id: string
  claim_id: string
  description: string
  created_at: string
  created_by: string | null
}

export interface JudicialClaim {
  id: string
  ra: string
  stage: string | null
  judicial_process_number: string | null
  judicial_status: string | null
  causer_name: string | null
  causer_document: string | null
  causer_whatsapp: string | null
  placa_causador: string | null
  relato_acidente: string | null
  date: string | null
  created_at: string | null
  financial_total_value: number | null
  client_id: string | null
  company_cnpj: string | null
  attachments: { id: string; url: string; file_name: string; file_type: string }[]
  client_name?: string | null
  client_cnpj?: string | null
}

export const fetchJudicialClaims = async (): Promise<JudicialClaim[]> => {
  const { data, error } = await supabase
    .from('claims')
    .select('*, attachments(id, url, file_name, file_type)')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data) return []

  const judicialClaims = data.filter(
    (c) =>
      (c.judicial_process_number && c.judicial_process_number.trim() !== '') ||
      c.stage === 'Judicial' ||
      c.judicial_status === 'Em Juízo',
  )

  const clientIds = [...new Set(judicialClaims.map((c) => c.client_id).filter(Boolean))] as string[]
  let clientMap = new Map<string, any>()

  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, "RAZÃO SOCIAL", CNPJ')
      .in('id', clientIds)
    clientMap = new Map((clients || []).map((c: any) => [c.id, c]))
  }

  return judicialClaims.map((claim) => {
    const client = clientMap.get(claim.client_id || '')
    return {
      ...claim,
      client_name: client?.['RAZÃO SOCIAL'] || null,
      client_cnpj: client?.CNPJ || null,
    }
  })
}

export const fetchJudicialMovements = async (claimId: string): Promise<JudicialMovement[]> => {
  const { data, error } = await supabase
    .from('judicial_movements' as any)
    .select('*')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as JudicialMovement[]
}

export const addJudicialMovement = async (
  claimId: string,
  description: string,
  userId: string,
): Promise<JudicialMovement | null> => {
  const { data, error } = await supabase
    .from('judicial_movements' as any)
    .insert({ claim_id: claimId, description, created_by: userId })
    .select('*')
    .single()

  if (error) throw error
  return data as JudicialMovement
}

export const updateJudicialStatus = async (claimId: string, status: string): Promise<void> => {
  const { error } = await supabase
    .from('claims')
    .update({ judicial_status: status })
    .eq('id', claimId)

  if (error) throw error
}

export const updateJudicialProcessNumber = async (
  claimId: string,
  processNumber: string,
): Promise<void> => {
  const { error } = await supabase
    .from('claims')
    .update({ judicial_process_number: processNumber })
    .eq('id', claimId)

  if (error) throw error
}
