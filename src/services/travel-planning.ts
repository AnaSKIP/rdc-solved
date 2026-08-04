import { supabase } from '@/lib/supabase/client'

export interface TravelPlan {
  id?: string
  claim_id: string
  destination_city?: string
  responsible_name?: string
  start_date?: string | null
  end_date?: string | null
  reason?: string
  related_company?: string
  status?: string
  hotel_name?: string
  hotel_daily_rate?: number
  hotel_qty?: number
  hotel_status?: string
  bus_company_line?: string
  bus_value?: number
  bus_date?: string | null
  bus_status?: string
  air_company?: string
  air_route?: string
  air_value?: number
  air_date?: string | null
  air_status?: string
  created_at?: string
  updated_at?: string
}

export interface TravelHotelKB {
  id: string
  destination: string
  hotel_name: string
  address?: string | null
  phone?: string | null
  price_range?: string | null
  notes?: string | null
  link_ref?: string | null
  created_at?: string
}

export async function fetchTravelPlanByClaimId(claimId: string): Promise<TravelPlan | null> {
  const { data, error } = await supabase
    .from('travel_plans')
    .select('*')
    .eq('claim_id', claimId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao carregar planejamento de viagem:', error)
    return null
  }
  return data as TravelPlan | null
}

export async function upsertTravelPlan(
  travelPlan: Partial<TravelPlan> & { claim_id: string },
): Promise<TravelPlan | null> {
  const payload = {
    ...travelPlan,
    updated_at: new Date().toISOString(),
  }

  if (travelPlan.id) {
    const { data: updateData, error: updateError } = await supabase
      .from('travel_plans')
      .update(payload)
      .eq('id', travelPlan.id)
      .select()
      .single()

    if (!updateError && updateData) return updateData as TravelPlan
  }

  const { data: insertData, error: insertError } = await supabase
    .from('travel_plans')
    .insert(payload)
    .select()
    .single()

  if (insertError) {
    console.error('Erro ao salvar planejamento de viagem:', insertError)
    return null
  }
  return insertData as TravelPlan
}

export async function fetchHotelKB(searchQuery?: string): Promise<TravelHotelKB[]> {
  let query = supabase
    .from('travel_hotels_kb')
    .select('*')
    .order('destination', { ascending: true })

  if (searchQuery && searchQuery.trim()) {
    const q = `%${searchQuery.trim()}%`
    query = query.or(`destination.ilike.${q},hotel_name.ilike.${q},notes.ilike.${q}`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao consultar a base de hotéis:', error)
    return []
  }

  return (data || []) as TravelHotelKB[]
}
