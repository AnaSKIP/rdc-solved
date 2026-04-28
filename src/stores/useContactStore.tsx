import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/services/contacts'

export interface ClaimDetails {
  placaCausador: string | null
  dinamicaAcidente: string | null
  confidencePlaca: number
  confidenceDinamica: number
  assignedAnalyst: string
}

export interface Client {
  id: string
  'RAZÃO SOCIAL'?: string
  name?: string
  CNPJ?: string | null
  cnpj?: string | null
  ENDEREÇO?: string | null
  address?: string | null
  TELEFONE?: string | null
  phone?: string | null
  COMISSÃO?: number | null
  company_commission_rate?: number | null
  [key: string]: any
}

export interface Analyst {
  id: string
  NOME?: string
  name?: string
  CNPJ?: string
  cnpj?: string
  TELEFONE?: string
  phone?: string
  ENDERECO?: string
  address?: string
  MENSALIDADE?: number
  monthly_fee?: number
  'COMISSAO - 0 A 9.999,99'?: number
  commission_rate?: number
  [key: string]: any
}

export interface Insurer {
  id: string
  NOME?: string
  name?: string
  TELEFONE?: string
  phone?: string
  [key: string]: any
}

export interface InternalTeam {
  id: string
  name?: string
  phone?: string
  address?: string
  email?: string
  role?: string
  [key: string]: any
}

export interface Contact {
  id: string
  name: string
  category: string
  email?: string
  phone?: string
  cnpj?: string
  address?: string
  role?: string
  monthlyFee?: number
  commissionRate?: number
  odooRef?: string
  driveLink?: string
  originalData?: any
}

interface ContactStoreState {
  clients: Client[]
  analysts: Analyst[]
  insurers: Insurer[]
  internalTeam: InternalTeam[]
  contacts: Contact[]
  contactClaims: Record<string, ClaimDetails>
  isLoading: boolean
  loadData: () => Promise<void>
  createRecord: (
    type: 'clients' | 'analysts' | 'insurers' | 'internal_team',
    data: any,
  ) => Promise<boolean>
  updateRecord: (
    type: 'clients' | 'analysts' | 'insurers' | 'internal_team',
    id: string,
    data: any,
  ) => Promise<boolean>
  replaceData: (
    type: 'clients' | 'analysts' | 'insurers' | 'internal_team',
    data: any[],
  ) => Promise<void>
  appendData: (
    type: 'clients' | 'analysts' | 'insurers' | 'internal_team',
    data: any[],
  ) => Promise<void>
  updateContactClaim: (contactId: string, updates: Partial<ClaimDetails>) => void
}

const ContactContext = createContext<ContactStoreState | null>(null)

export const ContactProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [analysts, setAnalysts] = useState<Analyst[]>([])
  const [insurers, setInsurers] = useState<Insurer[]>([])
  const [internalTeam, setInternalTeam] = useState<InternalTeam[]>([])
  const [contactClaims, setContactClaims] = useState<Record<string, ClaimDetails>>({})
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [cRes, aRes, iRes, tRes] = await Promise.all([
        api.clients.fetch(),
        api.analysts.fetch(),
        api.insurers.fetch(),
        api.internal_team.fetch(),
      ])

      if (cRes.error) console.error('Error fetching clients:', cRes.error)
      if (aRes.error) console.error('Error fetching analysts:', aRes.error)
      if (iRes.error) console.error('Error fetching insurers:', iRes.error)
      if (tRes.error) console.error('Error fetching internal team:', tRes.error)

      setClients(cRes.data || [])
      setAnalysts(aRes.data || [])
      setInsurers(iRes.data || [])
      setInternalTeam(tRes.data || [])
    } catch (err) {
      console.error('Unexpected error loading contacts data:', err)
      toast({
        title: 'Erro de Conexão',
        description: 'Falha ao carregar a lista de contatos. Tente recarregar a página.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const createRecord = async (
    type: 'clients' | 'analysts' | 'insurers' | 'internal_team',
    data: any,
  ) => {
    setIsLoading(true)
    const { error } = await api[type].insert([data])
    if (error) {
      toast({
        title: 'Erro ao criar',
        description: error.message || 'Erro de permissão.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return false
    } else {
      toast({
        title: 'Sucesso',
        description: 'Registro criado com sucesso.',
        className: 'bg-green-50 text-green-900 border-green-200',
      })
      await loadData()
      return true
    }
  }

  const updateRecord = async (
    type: 'clients' | 'analysts' | 'insurers' | 'internal_team',
    id: string,
    data: any,
  ) => {
    const { error } = await api[type].update(id, data)
    if (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Erro de permissão.',
        variant: 'destructive',
      })
      return false
    } else {
      toast({
        title: 'Atualizado',
        description: 'Registro atualizado com sucesso.',
        className: 'bg-green-50 border-green-200',
      })
      await loadData()
      return true
    }
  }

  const replaceData = async (
    type: 'clients' | 'analysts' | 'insurers' | 'internal_team',
    data: any[],
  ) => {
    setIsLoading(true)
    await api[type].deleteAll()
    const { error } = await api[type].insert(data)
    if (error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro de permissão.',
        variant: 'destructive',
      })
    else
      toast({
        title: 'Dados substituídos',
        description: `${data.length} registros importados.`,
        className: 'bg-green-50 text-green-900 border-green-200',
      })
    await loadData()
  }

  const appendData = async (
    type: 'clients' | 'analysts' | 'insurers' | 'internal_team',
    data: any[],
  ) => {
    setIsLoading(true)
    const { error } = await api[type].insert(data)
    if (error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro de permissão.',
        variant: 'destructive',
      })
    else
      toast({
        title: 'Dados importados',
        description: `${data.length} registros adicionados.`,
        className: 'bg-green-50 text-green-900 border-green-200',
      })
    await loadData()
  }

  const updateContactClaim = (contactId: string, updates: Partial<ClaimDetails>) => {
    setContactClaims((prev) => ({
      ...prev,
      [contactId]: {
        ...(prev[contactId] || {
          placaCausador: null,
          dinamicaAcidente: null,
          confidencePlaca: 0,
          confidenceDinamica: 0,
          assignedAnalyst: 'Distribuição Automática',
        }),
        ...updates,
      },
    }))
  }

  const contacts = useMemo(() => {
    return [
      ...(clients || []).map((c) => ({
        id: c?.id?.toString() || '',
        name: c?.['RAZÃO SOCIAL']?.toString() || c?.name?.toString() || 'Cliente Desconhecido',
        category: 'Cliente',
        phone: c?.TELEFONE?.toString() || c?.phone?.toString() || undefined,
        cnpj: c?.CNPJ?.toString() || c?.cnpj?.toString() || undefined,
        address: c?.ENDEREÇO?.toString() || c?.address?.toString() || undefined,
        commissionRate: c?.COMISSÃO ?? c?.company_commission_rate ?? undefined,
        monthlyFee: c?.monthly_fee ?? undefined,
        odooRef: `CLI-${c?.id?.toString()?.substring(0, 6) || ''}`,
        originalData: c,
      })),
      ...(analysts || []).map((c) => ({
        id: c?.id?.toString() || '',
        name: c?.NOME?.toString() || c?.name?.toString() || 'Analista Desconhecido',
        category: 'Colaborador Analista',
        phone: c?.TELEFONE?.toString() || c?.phone?.toString() || undefined,
        cnpj: c?.CNPJ?.toString() || c?.cnpj?.toString() || undefined,
        address: c?.ENDERECO?.toString() || c?.address?.toString() || undefined,
        monthlyFee: c?.MENSALIDADE ?? c?.monthly_fee ?? undefined,
        commissionRate: c?.['COMISSAO - 0 A 9.999,99'] ?? c?.commission_rate ?? undefined,
        odooRef: `ANA-${c?.id?.toString()?.substring(0, 6) || ''}`,
        originalData: c,
      })),
      ...(insurers || []).map((c) => ({
        id: c?.id?.toString() || '',
        name: c?.NOME?.toString() || c?.name?.toString() || 'Seguradora Desconhecida',
        category: 'Seguradora',
        phone: c?.TELEFONE?.toString() || c?.phone?.toString() || undefined,
        cnpj: c?.CNPJ?.toString() || c?.cnpj?.toString() || undefined,
        address: c?.ENDERECO?.toString() || c?.address?.toString() || undefined,
        odooRef: `SEG-${c?.id?.toString()?.substring(0, 6) || ''}`,
        originalData: c,
      })),
      ...(internalTeam || []).map((c) => ({
        id: c?.id?.toString() || '',
        name: c?.name?.toString() || 'Membro Desconhecido',
        category: 'Equipe Interna',
        phone: c?.phone?.toString() || undefined,
        email: c?.email?.toString() || undefined,
        address: c?.address?.toString() || undefined,
        role: c?.role?.toString() || undefined,
        odooRef: `INT-${c?.id?.toString()?.substring(0, 6) || ''}`,
        originalData: c,
      })),
    ].filter((c) => c.id)
  }, [clients, analysts, insurers, internalTeam])

  return (
    <ContactContext.Provider
      value={{
        clients,
        analysts,
        insurers,
        internalTeam,
        contacts,
        contactClaims,
        isLoading,
        loadData,
        createRecord,
        updateRecord,
        replaceData,
        appendData,
        updateContactClaim,
      }}
    >
      {children}
    </ContactContext.Provider>
  )
}

export default function useContactStore() {
  const ctx = useContext(ContactContext)
  if (!ctx) throw new Error('useContactStore must be used within ContactProvider')
  return ctx
}
