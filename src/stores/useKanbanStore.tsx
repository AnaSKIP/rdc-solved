import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'

export type KanbanClaim = {
  id: string
  raNumber: string | null
  stage: string
  companyName: string | null
  companyCnpj: string | null
  analyst: string | null
  analystId: string | null
  phone: string | null
  placaOnibus: string | null
  placaCausador: string | null
  date: string | null
  rawDate: string | null
  createdAt: string | null
  probability: number | null
  financialTotalValue: number | null
  causerWhatsapp: string | null
  isEnriched: boolean
  causerDocument: string | null
  tags: string[]
  hasPositiveInteraction: boolean
  attachments: { id: string; url: string; file_name: string; file_type: string }[]
  dinamicaAcidente: string | null
  insuranceCompany: string | null
  causerClaimNumber: string | null
  clientClaimNumber: string | null
}

interface KanbanContextType {
  claims: KanbanClaim[]
  loading: boolean
  error: string | null
  isSyncing: boolean
  syncFromOdoo: () => Promise<void>
  refresh: () => Promise<void>
  refreshClaims: () => Promise<void>
  updateClaim: (id: string, data: Record<string, any>) => Promise<void>
  updateClaimStage: (id: string, stage: string) => Promise<void>
  moveClaim: (id: string, stage: string) => Promise<void>
  selectedClaim: KanbanClaim | null
  setSelectedClaim: (claim: KanbanClaim | null) => void
  analystFilter: string
  setAnalystFilter: (v: string) => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  tagFilters: string[]
  setTagFilters: (v: string[]) => void
  dateFilter: string
  setDateFilter: (v: string) => void
  viewMode: 'board' | 'list'
  setViewMode: (v: 'board' | 'list') => void
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined)
let moduleState: KanbanContextType | null = null

export const useKanbanStore = Object.assign(
  (): KanbanContextType => {
    const ctx = useContext(KanbanContext)
    if (!ctx) throw new Error('useKanbanStore must be used within KanbanProvider')
    return ctx
  },
  { getState: (): KanbanContextType | null => moduleState },
)

export const KanbanProvider = ({ children }: { children: ReactNode }) => {
  const [claims, setClaims] = useState<KanbanClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<KanbanClaim | null>(null)
  const [analystFilter, setAnalystFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('*, attachments(id, url, file_name, file_type)')
        .order('date', { ascending: false })
      if (claimsError) throw claimsError

      const [{ data: clientsData }, { data: analystsData }, { data: teamData }] = await Promise.all(
        [
          supabase.from('clients').select('id, "RAZÃO SOCIAL", CNPJ'),
          supabase.from('analysts').select('id, NOME'),
          supabase.from('internal_team').select('id, name'),
        ],
      )

      const clientById = new Map<string, string>()
      const clientByCnpj = new Map<string, string>()
      ;(clientsData || []).forEach((c) => {
        if (c.id) clientById.set(c.id, c['RAZÃO SOCIAL'])
        if (c.CNPJ) clientByCnpj.set(c.CNPJ, c['RAZÃO SOCIAL'])
      })

      const analystMap = new Map<string, string>()
      ;(analystsData || []).forEach((a) => {
        if (a.id) analystMap.set(a.id, a.NOME)
      })
      ;(teamData || []).forEach((t) => {
        if (t.id) analystMap.set(t.id, t.name)
      })

      const kanbanClaims: KanbanClaim[] = (claimsData || []).map((c) => ({
        id: c.id,
        raNumber: c.ra || null,
        stage: c.stage || 'Caixa de Entrada',
        companyName:
          (c.client_id && clientById.get(c.client_id)) ||
          (c.company_cnpj && clientByCnpj.get(c.company_cnpj)) ||
          c.causer_name ||
          null,
        companyCnpj: c.company_cnpj || null,
        analyst: c.analyst_id ? analystMap.get(c.analyst_id) || 'Não Atribuído' : 'Não Atribuído',
        analystId: c.analyst_id || null,
        phone: c.phone || null,
        placaOnibus: c.placa_onibus || null,
        placaCausador: c.placa_causador || null,
        date: c.date || null,
        rawDate: c.date || null,
        createdAt: c.created_at || null,
        probability: c.probability || null,
        financialTotalValue: c.financial_total_value || null,
        causerWhatsapp: c.causer_whatsapp || null,
        isEnriched: c.is_enriched || false,
        causerDocument: c.causer_document || null,
        tags: c.tags || [],
        hasPositiveInteraction: c.has_positive_interaction || false,
        attachments: c.attachments || [],
        dinamicaAcidente: c.relato_acidente || null,
        insuranceCompany: null,
        causerClaimNumber: c.causer_claim_number || null,
        clientClaimNumber: c.client_claim_number || null,
      }))

      setClaims(kanbanClaims)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const syncFromOdoo = useCallback(async () => {
    setIsSyncing(true)
    try {
      await supabase.functions.invoke('odoo-sync', { body: {} })
      await refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSyncing(false)
    }
  }, [refresh])

  const updateClaimStage = useCallback(async (id: string, stage: string) => {
    const { error: e } = await supabase.from('claims').update({ stage }).eq('id', id)
    if (e) throw e
    setClaims((p) => p.map((c) => (c.id === id ? { ...c, stage } : c)))
  }, [])

  const moveClaim = updateClaimStage

  const updateClaim = useCallback(async (id: string, data: Record<string, any>) => {
    const dbData: Record<string, any> = {}
    if (data.analystId !== undefined) dbData.analyst_id = data.analystId
    if (data.stage !== undefined) dbData.stage = data.stage
    if (data.tags !== undefined) dbData.tags = data.tags
    const { error: e } = await supabase.from('claims').update(dbData).eq('id', id)
    if (e) throw e
    setClaims((p) => p.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value: KanbanContextType = {
    claims,
    loading,
    error,
    isSyncing,
    syncFromOdoo,
    refresh,
    refreshClaims: refresh,
    updateClaim,
    updateClaimStage,
    moveClaim,
    selectedClaim,
    setSelectedClaim,
    analystFilter,
    setAnalystFilter,
    searchQuery,
    setSearchQuery,
    tagFilters,
    setTagFilters,
    dateFilter,
    setDateFilter,
    viewMode,
    setViewMode,
  }
  moduleState = value

  return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>
}
