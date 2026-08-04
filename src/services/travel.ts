import { supabase } from '@/lib/supabase/client'

export interface TravelPlanData {
  id?: string
  claim_id: string
  destination_city: string
  responsible_name: string
  start_date?: string | null
  end_date?: string | null
  reason: string
  related_company: string
  status: string

  hotel_name: string
  hotel_daily_rate: number
  hotel_qty: number
  hotel_status: string

  bus_company_line: string
  bus_value: number
  bus_date?: string | null
  bus_status: string

  air_company: string
  air_route: string
  air_value: number
  air_date?: string | null
  air_status: string
}

export interface TravelHotelKB {
  id: string
  destination: string
  hotel_name: string
  price_range: string
  notes: string
  address?: string
  phone?: string
  link_ref?: string
}

export const fetchTravelPlanByClaimId = async (claimId: string): Promise<TravelPlanData | null> => {
  if (!claimId) return null
  const { data, error } = await supabase
    .from('travel_plans')
    .select('*')
    .eq('claim_id', claimId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching travel plan:', error)
  }
  return data as TravelPlanData | null
}

export const saveTravelPlan = async (plan: TravelPlanData): Promise<TravelPlanData | null> => {
  if (!plan.claim_id) return null

  if (plan.id) {
    const { data, error } = await supabase
      .from('travel_plans')
      .update({
        ...plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', plan.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating travel plan:', error)
      throw error
    }
    return data as TravelPlanData
  } else {
    const { data, error } = await supabase
      .from('travel_plans')
      .insert([{ ...plan }])
      .select()
      .single()

    if (error) {
      console.error('Error creating travel plan:', error)
      throw error
    }
    return data as TravelPlanData
  }
}

export const fetchTravelHotelsKB = async (): Promise<TravelHotelKB[]> => {
  const { data, error } = await supabase
    .from('travel_hotels_kb')
    .select('*')
    .order('destination', { ascending: true })

  if (error) {
    console.error('Error fetching hotels KB:', error)
    return []
  }
  return (data as TravelHotelKB[]) || []
}

export const uploadTravelDocument = async (claimId: string, file: File, docType: string) => {
  if (!claimId || !file) return null

  const fileExt = file.name.split('.').pop()
  const fileName = `travel_${docType}_${Date.now()}.${fileExt}`
  const filePath = `claims/${claimId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('claim-attachments')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Upload error:', uploadError)
  }

  const { data: publicUrlData } = supabase.storage.from('claim-attachments').getPublicUrl(filePath)

  const publicUrl = publicUrlData?.publicUrl || filePath

  const { data: attachment, error: attachError } = await supabase
    .from('attachments')
    .insert([
      {
        claim_id: claimId,
        file_name: `${docType.toUpperCase()}_${file.name}`,
        file_type: file.type || fileExt || 'document',
        url: publicUrl,
      },
    ])
    .select()
    .single()

  if (attachError) {
    console.error('Attachment record creation error:', attachError)
  }

  return attachment
}
