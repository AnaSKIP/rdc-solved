import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'

export type ImportStatus = 'idle' | 'syncing' | 'transferring' | 'completed' | 'error'

export type OdooStage = {
  id: number
  name: string
}

export type LogEntry = {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
}

export type OdooCredentials = {
  url: string
  db: string
  username: string
  apiKey: string
}

const SYNC_LIMIT = 500
const STORAGE_KEY = 'odoo_credentials'

interface OdooImportContextType {
  credentials: OdooCredentials
  setCredentials: (creds: OdooCredentials) => void
  status: ImportStatus
  logs: LogEntry[]
  progress: number
  totalLeads: number
  processedLeads: number
  selectedStageIds: number[]
  setSelectedStageIds: (ids: number[]) => void
  syncWithOdoo: () => Promise<void>
  transferLeads: () => Promise<void>
  clearLogs: () => void
}

const OdooImportContext = createContext<OdooImportContextType | undefined>(undefined)

export const useOdooImportStore = () => {
  const ctx = useContext(OdooImportContext)
  if (!ctx) throw new Error('useOdooImportStore must be used within OdooImportProvider')
  return ctx
}

export const OdooImportProvider = ({ children }: { children: ReactNode }) => {
  const [credentials, setCredentialsState] = useState<OdooCredentials>({
    url: '',
    db: '',
    username: '',
    apiKey: '',
  })
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [progress, setProgress] = useState(0)
  const [totalLeads, setTotalLeads] = useState(0)
  const [processedLeads, setProcessedLeads] = useState(0)
  const [selectedStageIds, setSelectedStageIds] = useState<number[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCredentialsState(JSON.parse(stored))
    } catch {
      /* noop */
    }
  }, [])

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString('pt-BR'), level, message },
    ])
  }, [])

  const setCredentials = useCallback((creds: OdooCredentials) => {
    setCredentialsState(creds)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds))
    } catch {
      /* noop */
    }
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  const syncWithOdoo = useCallback(async () => {
    if (!credentials.url || !credentials.db || !credentials.username || !credentials.apiKey) {
      toast({
        title: 'Erro',
        description: 'Credenciais do Odoo incompletas',
        variant: 'destructive',
      })
      return
    }
    setStatus('syncing')
    setProgress(0)
    setProcessedLeads(0)
    addLog('info', 'Iniciando sincronização com Odoo...')

    try {
      const { data, error } = await supabase.functions.invoke('odoo-sync', {
        body: {
          ...credentials,
          limit: SYNC_LIMIT,
          offset: 0,
          stage_ids: selectedStageIds.length > 0 ? selectedStageIds : undefined,
        },
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido')

      const leads = data.leads || []
      setTotalLeads(leads.length)
      addLog('success', `${leads.length} leads encontrados no Odoo`)
      if (leads.length === 0) {
        addLog('info', 'Nenhum lead encontrado.')
        setStatus('completed')
        setProgress(100)
        return
      }

      const raList = leads.map((l: any) => String(l.x_ra || l.name || `RA-${l.id}`).trim())
      const [{ data: existingImport }, { data: existingClaims }] = await Promise.all([
        supabase.from('caixa_entrada_importacao').select('id_ra').in('id_ra', raList),
        supabase.from('claims').select('ra').in('ra', raList),
      ])
      const existingSet = new Set<string>()
      ;(existingImport || []).forEach((r: any) => existingSet.add(r.id_ra))
      ;(existingClaims || []).forEach((c: any) => existingSet.add(c.ra))

      let imported = 0,
        skipped = 0
      for (const lead of leads) {
        const ra = String(lead.x_ra || lead.name || `RA-${lead.id}`).trim()
        if (existingSet.has(ra)) {
          skipped++
          continue
        }
        const partnerName =
          lead.company_name_enriched || lead.partner_name || (lead.partner_id?.[1] ?? null)
        const { error: insertError } = await supabase.from('caixa_entrada_importacao').insert({
          id_ra: ra,
          cliente_nome: partnerName,
          cliente_cnpj: lead.vat || lead.x_cnpj || lead.x_cpf_cnpj || null,
          placa_onibus: lead.x_placa_onibus || null,
          prefixo_onibus: lead.x_prefixo_onibus || null,
          causador_nome: lead.x_nome_causador || null,
          causador_cpf: lead.x_cpf_cnpj_causador || null,
          placa_causador: lead.x_placa_causador || null,
          data_acidente: lead.x_data_acidente || null,
          dinamica_acidente: null,
          valor_dano_estimado: lead.expected_revenue ? parseFloat(lead.expected_revenue) : null,
          status_atual: 'IMPORTADO',
          status_transferencia: 'PENDENTE',
          status_validacao: 'VÁLIDO',
          data_importacao: new Date().toISOString(),
          lote_importacao: Date.now(),
        })
        if (insertError) {
          addLog('error', `RA ${ra}: ${insertError.message}`)
        } else {
          imported++
        }
        existingSet.add(ra)
      }

      setProcessedLeads(imported + skipped)
      setProgress(50)
      addLog('success', `${imported} importados, ${skipped} duplicados ignorados`)

      if (imported > 0) {
        addLog('info', 'Transferindo leads para o Kanban...')
        const { data: tData, error: tError } = await supabase.functions.invoke(
          'transferir-todos-leads',
          {},
        )
        if (tError) {
          addLog('error', `Transferência: ${tError.message}`)
        } else if (tData) {
          addLog(
            'success',
            `Transferência: ${tData.transferred || 0} transferidos, ${tData.skipped || 0} ignorados`,
          )
        }
      }

      setProgress(100)
      setStatus('completed')
    } catch (err: any) {
      addLog('error', err.message || 'Erro na sincronização')
      setStatus('error')
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }, [credentials, selectedStageIds, addLog])

  const transferLeads = useCallback(async () => {
    setStatus('transferring')
    addLog('info', 'Iniciando transferência de leads...')
    try {
      const { data, error } = await supabase.functions.invoke('transferir-todos-leads', {})
      if (error) throw error
      addLog(
        'success',
        `Transferência concluída: ${data?.transferred || 0} transferidos, ${data?.skipped || 0} ignorados`,
      )
      setStatus('completed')
    } catch (err: any) {
      addLog('error', err.message || 'Erro na transferência')
      setStatus('error')
    }
  }, [addLog])

  return (
    <OdooImportContext.Provider
      value={{
        credentials,
        setCredentials,
        status,
        logs,
        progress,
        totalLeads,
        processedLeads,
        selectedStageIds,
        setSelectedStageIds,
        syncWithOdoo,
        transferLeads,
        clearLogs,
      }}
    >
      {children}
    </OdooImportContext.Provider>
  )
}
