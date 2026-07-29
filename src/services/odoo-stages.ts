import { supabase } from '@/lib/supabase/client'
import type { OdooCredentials } from '@/stores/useOdooImportStore'

export interface OdooStage {
  id: number
  name: string
}

export async function fetchOdooStages(
  credentials: OdooCredentials,
): Promise<{ data: OdooStage[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('list-odoo-stages', {
      body: { ...credentials },
    })
    if (error) {
      return { data: null, error: error.message || 'Erro ao buscar estágios.' }
    }
    if (data?.error) {
      return { data: null, error: data.error }
    }
    return { data: data?.stages || [], error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'Erro desconhecido ao buscar estágios.' }
  }
}
