import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import useContactStore from '@/stores/useContactStore'
import { PipelineStage } from './useCaseStore'

const PIPELINE_STAGES = [
  'Atribuir',
  'Em análise',
  'Negociação',
  'Acordo Feito',
  'Concluído',
  'Sem acordo',
  'Repescagem',
]

export interface KanbanClaim {
  id: string
  raNumber: string
  companyId: string | null
  companyName: string
  companyCnpj: string
  analyst: string
  analystId?: string | null
  stage: PipelineStage
  placaCausador: string | null
  dinamicaAcidente: string | null
  date: string
  rawDate: string
  createdAt: string
  insuranceCompany?: string
  causerClaimNumber?: string | null
  clientClaimNumber?: string | null
  placaOnibus?: string
  prefixoOnibus?: string
  motoristaOnibus?: string
  returnScheduledAt?: string | null
  returnSubject?: string | null
  hasPositiveInteraction?: boolean
  vistoriaDate?: string | null
  vistoriaLink?: string | null
  judicialProcessNumber?: string | null
  agreementNotes?: string | null
  agreementSigned?: boolean
  agreementGenerated?: boolean
  attachments?: { id: string; url: string; file_name: string; file_type: string }[]
  tags?: string[]
  financialTotalValue?: number
  financialFixedValue?: number
  financialCommissionValue?: number
  installments?: any[]
  probability?: number
  causerName?: string | null
  causerPhone?: string | null
  causerDocument?: string | null
  tipoVeiculoCausador?: string | null
  causerModelo?: string | null
  causerAno?: string | null
  causerWhatsapp?: string | null
  causerEndereco?: string | null
  proprietarioVeiculoCausador?: string | null
  dataPrescricao?: string | null
  formaPagamento?: string | null
  dataUltimaTentativa?: string | null
  proximaTentativaRepescagem?: string | null
  motivoFinalizacao?: string | null
  dataFinalizacao?: string | null
}

interface KanbanState {
  claims: KanbanClaim[]
  selectedClaim: KanbanClaim | null
  setSelectedClaim: (claim: KanbanClaim | null) => void
  isSyncing: boolean
  syncFromOdoo: () => void
  analystFilter: string
  setAnalystFilter: (analyst: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  tagFilters: string[]
  setTagFilters: (tags: string[]) => void
  dateFilter: string
  setDateFilter: (filter: string) => void
  viewMode: 'board' | 'list'
  setViewMode: (mode: 'board' | 'list') => void
  moveClaim: (claimId: string, newStage: PipelineStage) => void
  updateClaim: (claimId: string, updates: Partial<KanbanClaim>) => void
  refreshClaims: () => Promise<void>
}

const KanbanContext = createContext<KanbanState | null>(null)

export const KanbanProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast()
  const { contacts } = useContactStore()
  const [claims, setClaims] = useState<KanbanClaim[]>([])
  const [selectedClaim, setSelectedClaim] = useState<KanbanClaim | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [analystFilter, setAnalystFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')

  const refreshClaims = useCallback(async () => {
    const { data, error } = await supabase
      .from('claims')
      .select('*, attachments(id, url, file_name, file_type)')
      .order('date', { ascending: false })
    if (error) {
      console.error(error)
      return
    }
    if (data) {
      const mapped: KanbanClaim[] = data
        .map((d) => {
          const clientContact = contacts.find((c) => c?.id === d?.client_id?.toString())
          const clientByCnpj =
            !clientContact && (d as any)?.company_cnpj
              ? contacts.find((c) => c?.cnpj?.toString() === (d as any)?.company_cnpj?.toString())
              : null
          const resolvedContact = clientContact || clientByCnpj
          const companyName =
            resolvedContact?.name?.toString() ||
            d?.causer_name?.toString() ||
            'Cliente Desconhecido'
          const companyCnpj =
            resolvedContact?.cnpj?.toString() || (d as any)?.company_cnpj?.toString() || ''

          const ra = d?.ra?.toString() || 'S/N'

          return {
            id: d?.id?.toString() || '',
            raNumber: ra,
            companyId: d?.client_id?.toString() || null,
            companyName,
            companyCnpj,
            analyst:
              contacts.find((c) => c?.id === d?.analyst_id?.toString())?.name?.toString() ||
              d?.analyst_id?.toString() ||
              'Não Atribuído',
            analystId: d?.analyst_id?.toString() || null,
            stage: (() => {
              let rawStage = d?.stage?.toString() || 'Atribuir'
              if (d?.status?.toString() === 'Repescagem' || rawStage === 'Repescagem') {
                rawStage = 'Repescagem'
              }
              const matchedStage = PIPELINE_STAGES.find(
                (s) => s.toLowerCase() === rawStage.toLowerCase(),
              )
              return (matchedStage || 'Atribuir') as PipelineStage
            })(),
            placaCausador: d?.placa_causador?.toString() || null,
            dinamicaAcidente: d?.relato_acidente?.toString() || null,
            date: new Date(d?.date || d?.created_at || new Date()).toLocaleDateString('pt-BR'),
            rawDate: d?.date?.toString() || d?.created_at?.toString() || new Date().toISOString(),
            createdAt: d?.created_at?.toString() || new Date().toISOString(),
            insuranceCompany: d?.insurance_id?.toString() || '',
            causerClaimNumber: (d as any)?.causer_claim_number?.toString() || null,
            clientClaimNumber: (d as any)?.client_claim_number?.toString() || null,
            placaOnibus: d?.placa_onibus?.toString() || '',
            prefixoOnibus: d?.prefixo_onibus?.toString() || '',
            motoristaOnibus: d?.motorista_onibus?.toString() || '',
            returnScheduledAt: d?.return_scheduled_at?.toString() || null,
            returnSubject: (d as any)?.return_subject?.toString() || null,
            hasPositiveInteraction: d?.has_positive_interaction || false,
            vistoriaDate: d?.vistoria_date?.toString() || null,
            vistoriaLink: d?.vistoria_link?.toString() || null,
            judicialProcessNumber: d?.judicial_process_number?.toString() || null,
            agreementNotes: d?.agreement_notes?.toString() || '',
            agreementSigned: d?.agreement_signed || false,
            agreementGenerated: d?.agreement_generated || false,
            attachments: (d as any)?.attachments || [],
            tags: d?.tags || [],
            financialTotalValue: Number(d?.financial_total_value) || 0,
            financialFixedValue: Number(d?.financial_fixed_value) || 0,
            financialCommissionValue: Number(d?.financial_commission_value) || 0,
            installments: d?.installments || [],
            probability: Number(d?.probability) || 0,
            causerName: d?.causer_name?.toString() || null,
            causerPhone: d?.phone?.toString() || null,
            causerDocument: (d as any)?.causer_document?.toString() || null,
            tipoVeiculoCausador: d?.tipo_veiculo_causador?.toString() || null,
            causerModelo: (d as any)?.causer_modelo?.toString() || null,
            causerAno: (d as any)?.causer_ano?.toString() || null,
            causerWhatsapp: (d as any)?.causer_whatsapp?.toString() || null,
            causerEndereco: (d as any)?.causer_endereco?.toString() || null,
            proprietarioVeiculoCausador:
              (d as any)?.proprietario_veiculo_causador?.toString() || null,
            dataPrescricao: (d as any)?.data_prescricao?.toString() || null,
            formaPagamento: (d as any)?.forma_pagamento?.toString() || null,
            dataUltimaTentativa: (d as any)?.data_ultima_tentativa?.toString() || null,
            proximaTentativaRepescagem:
              (d as any)?.proxima_tentativa_repescagem?.toString() || null,
            motivoFinalizacao: (d as any)?.motivo_finalizacao?.toString() || null,
            dataFinalizacao: (d as any)?.data_finalizacao?.toString() || null,
          }
        })
        .filter((c) => c.id)
      setClaims(mapped)

      setSelectedClaim((prev) => {
        if (!prev) return null
        const updatedSelected = mapped.find((c) => c.id === prev.id)
        return updatedSelected || prev
      })
    }
  }, [contacts])

  useEffect(() => {
    refreshClaims()
    const channel = supabase
      .channel('claims_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, () =>
        refreshClaims(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attachments' }, () =>
        refreshClaims(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshClaims])

  const syncFromOdoo = useCallback(async () => {
    setIsSyncing(true)
    setTimeout(() => {
      refreshClaims()
      setIsSyncing(false)
      toast({ title: 'Sincronização Concluída', className: 'bg-green-50 text-green-900' })
    }, 1500)
  }, [refreshClaims, toast])

  const moveClaim = useCallback(async (claimId: string, newStage: PipelineStage) => {
    setClaims((prev) => prev.map((c) => (c.id === claimId ? { ...c, stage: newStage } : c)))

    const dbUpdates: any = { stage: newStage }

    if (newStage === 'Concluído') {
      dbUpdates.motivo_finalizacao = 'Negociação bem-sucedida'
      dbUpdates.data_finalizacao = new Date().toISOString()
    } else if (newStage === 'Sem acordo') {
      dbUpdates.motivo_finalizacao = 'Causador recusou pagamento'
      dbUpdates.data_finalizacao = new Date().toISOString()
    }

    await supabase.from('claims').update(dbUpdates).eq('id', claimId)
  }, [])

  const updateClaim = useCallback(async (claimId: string, updates: Partial<KanbanClaim>) => {
    setClaims((prev) => prev.map((c) => (c.id === claimId ? { ...c, ...updates } : c)))
    setSelectedClaim((prev) => (prev?.id === claimId ? { ...prev, ...updates } : prev))

    const dbUpdates: any = {}
    if (updates.placaOnibus !== undefined) dbUpdates.placa_onibus = updates.placaOnibus
    if (updates.prefixoOnibus !== undefined) dbUpdates.prefixo_onibus = updates.prefixoOnibus
    if (updates.motoristaOnibus !== undefined) dbUpdates.motorista_onibus = updates.motoristaOnibus
    if (updates.returnScheduledAt !== undefined)
      dbUpdates.return_scheduled_at = updates.returnScheduledAt
    if (updates.returnSubject !== undefined) dbUpdates.return_subject = updates.returnSubject
    if (updates.hasPositiveInteraction !== undefined)
      dbUpdates.has_positive_interaction = updates.hasPositiveInteraction
    if (updates.vistoriaDate !== undefined) dbUpdates.vistoria_date = updates.vistoriaDate
    if (updates.vistoriaLink !== undefined) dbUpdates.vistoria_link = updates.vistoriaLink
    if (updates.judicialProcessNumber !== undefined)
      dbUpdates.judicial_process_number = updates.judicialProcessNumber
    if (updates.placaCausador !== undefined) dbUpdates.placa_causador = updates.placaCausador
    if (updates.dinamicaAcidente !== undefined) dbUpdates.relato_acidente = updates.dinamicaAcidente
    if (updates.agreementNotes !== undefined) dbUpdates.agreement_notes = updates.agreementNotes
    if (updates.agreementSigned !== undefined) dbUpdates.agreement_signed = updates.agreementSigned
    if (updates.agreementGenerated !== undefined)
      dbUpdates.agreement_generated = updates.agreementGenerated
    if (updates.insuranceCompany !== undefined) dbUpdates.insurance_id = updates.insuranceCompany
    if (updates.causerClaimNumber !== undefined)
      dbUpdates.causer_claim_number = updates.causerClaimNumber
    if (updates.clientClaimNumber !== undefined)
      dbUpdates.client_claim_number = updates.clientClaimNumber
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags
    if (updates.financialTotalValue !== undefined)
      dbUpdates.financial_total_value = updates.financialTotalValue
    if (updates.financialFixedValue !== undefined)
      dbUpdates.financial_fixed_value = updates.financialFixedValue
    if (updates.financialCommissionValue !== undefined)
      dbUpdates.financial_commission_value = updates.financialCommissionValue
    if (updates.installments !== undefined) dbUpdates.installments = updates.installments
    if (updates.probability !== undefined) dbUpdates.probability = updates.probability
    if (updates.companyId !== undefined) dbUpdates.client_id = updates.companyId
    if (updates.raNumber !== undefined) dbUpdates.ra = updates.raNumber
    if (updates.causerName !== undefined) dbUpdates.causer_name = updates.causerName
    if (updates.causerPhone !== undefined) dbUpdates.phone = updates.causerPhone
    if (updates.causerDocument !== undefined) dbUpdates.causer_document = updates.causerDocument
    if (updates.tipoVeiculoCausador !== undefined)
      dbUpdates.tipo_veiculo_causador = updates.tipoVeiculoCausador
    if (updates.rawDate !== undefined) dbUpdates.date = updates.rawDate
    if (updates.analystId !== undefined) dbUpdates.analyst_id = updates.analystId
    if (updates.causerModelo !== undefined) dbUpdates.causer_modelo = updates.causerModelo
    if (updates.causerAno !== undefined) dbUpdates.causer_ano = updates.causerAno
    if (updates.causerWhatsapp !== undefined) dbUpdates.causer_whatsapp = updates.causerWhatsapp
    if (updates.causerEndereco !== undefined) dbUpdates.causer_endereco = updates.causerEndereco
    if (updates.proprietarioVeiculoCausador !== undefined)
      dbUpdates.proprietario_veiculo_causador = updates.proprietarioVeiculoCausador
    if (updates.dataPrescricao !== undefined) dbUpdates.data_prescricao = updates.dataPrescricao
    if (updates.formaPagamento !== undefined) dbUpdates.forma_pagamento = updates.formaPagamento
    if (updates.dataUltimaTentativa !== undefined)
      dbUpdates.data_ultima_tentativa = updates.dataUltimaTentativa
    if (updates.proximaTentativaRepescagem !== undefined)
      dbUpdates.proxima_tentativa_repescagem = updates.proximaTentativaRepescagem
    if (updates.motivoFinalizacao !== undefined)
      dbUpdates.motivo_finalizacao = updates.motivoFinalizacao
    if (updates.dataFinalizacao !== undefined) dbUpdates.data_finalizacao = updates.dataFinalizacao

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('claims').update(dbUpdates).eq('id', claimId)
    }
  }, [])

  return React.createElement(
    KanbanContext.Provider,
    {
      value: {
        claims,
        selectedClaim,
        setSelectedClaim,
        isSyncing,
        syncFromOdoo,
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
        moveClaim,
        updateClaim,
        refreshClaims,
      },
    },
    children,
  )
}

export default function useKanbanStore() {
  const ctx = useContext(KanbanContext)
  if (!ctx) throw new Error('useKanbanStore must be used within KanbanProvider')
  return ctx
}
