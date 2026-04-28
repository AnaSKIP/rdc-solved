import { supabase } from '@/lib/supabase/client'

export type Claim = {
  id: string
  ra: string
  stage: string
  client_id: string
  causer_name: string
  analyst_id: string
  insurance_id: string
  status: 'pending' | 'loading' | 'enriched'
  date: string
  phone?: string
  attachments?: { id: string; url: string; file_name: string; file_type: string }[]
}

export const fetchClaimsPaginated = async (filter: string, page: number, pageSize: number) => {
  let query = supabase
    .from('claims')
    .select('*, attachments(id, url, file_name, file_type)', { count: 'exact' })

  if (filter !== 'all') {
    query = query.eq('stage', filter)
  } else {
    query = query.in('stage', ['Sem acordo', 'Repescagem'])
  }

  const from = (page - 1) * pageSize
  return await query.order('date', { ascending: false }).range(from, from + pageSize - 1)
}

export const enrichClaims = async (ids: string[]) => {
  for (const id of ids) {
    await supabase.from('claims').update({ status: 'enriched', is_enriched: true }).eq('id', id)
  }
}

export const fetchClaimMessages = async (claimId: string) => {
  const { data, error } = await supabase
    .from('claim_messages')
    .select('*')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}
