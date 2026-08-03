import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'

export type KanbanClaim = {
  id: string
  ra: string
  stage: string
  client_name: string | null
  causer_name: string | null
  phone: string | null
  placa_onibus: string | null
  placa_causador: string | null
  date: string | null
  probability: number | null
  financial_total_value: number | null
  causer_whatsapp: string | null
  is_enriched: boolean | null
  causer_document: string | null
  company_cnpj: string | null
}

interface KanbanContextType {
  claims: KanbanClaim[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  refreshClaims: () => Promise<void>
  updateClaimStage: (id: string, stage: string) => Promise<void>
  selectedClaim: KanbanClaim | null
  setSelectedClaim: (claim: KanbanClaim | null) => void
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined)

export const useKanbanStore = () => {
  const ctx = useContext(KanbanContext)
  if (!ctx) throw new Error('useKanbanStore must be used within KanbanProvider')
  return ctx
}

export const KanbanProvider = ({ children }: { children: ReactNode }) => {
  const [claims, setClaims] = useState<KanbanClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClaim, setSelectedClaim] = useState<KanbanClaim | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .in('stage', ['Sem acordo', 'Repescagem'])
        .order('date', { ascending: false })
      if (claimsError) throw claimsError

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, "RAZÃO SOCIAL", CNPJ')

      const clientById = new Map<string, string>()
      const clientByCnpj = new Map<string, string>()
      ;(clientsData || []).forEach((c) => {
        if (c.id) clientById.set(c.id, c['RAZÃO SOCIAL'])
        if (c.CNPJ) clientByCnpj.set(c.CNPJ, c['RAZÃO SOCIAL'])
      })

      const kanbanClaims: KanbanClaim[] = (claimsData || []).map((claim) => {
        const clientName =
          (claim.client_id && clientById.get(claim.client_id)) ||
          (claim.company_cnpj && clientByCnpj.get(claim.company_cnpj)) ||
          null

        return {
          id: claim.id,
          ra: claim.ra,
          stage: claim.stage || 'Sem acordo',
          client_name: clientName,
          causer_name: claim.causer_name || null,
          phone: claim.phone || null,
          placa_onibus: claim.placa_onibus || null,
          placa_causador: claim.placa_causador || null,
          date: claim.date || null,
          probability: claim.probability || null,
          financial_total_value: claim.financial_total_value || null,
          causer_whatsapp: claim.causer_whatsapp || null,
          is_enriched: claim.is_enriched || false,
          causer_document: claim.causer_document || null,
          company_cnpj: claim.company_cnpj || null,
        }
      })

      setClaims(kanbanClaims)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateClaimStage = useCallback(async (id: string, stage: string) => {
    const { error: updateError } = await supabase.from('claims').update({ stage }).eq('id', id)
    if (updateError) throw updateError
    setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <KanbanContext.Provider
      value={{
        claims,
        loading,
        error,
        refresh,
        refreshClaims: refresh,
        updateClaimStage,
        selectedClaim,
        setSelectedClaim,
      }}
    >
      {children}
    </KanbanContext.Provider>
  )
}
