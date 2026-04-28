import React, { createContext, useContext, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

export type ProcessStatus =
  | 'pending'
  | 'extracting'
  | 'validating'
  | 'enriching_sci'
  | 'enriching_infocar'
  | 'completed'

export const ANALYSTS = ['Douglas Martins', 'Ana Oliveira', 'Roberto Almeida', 'Maria Souza']

export interface ConsistencyCheck {
  id: string
  field: string
  values: string[]
  sources: string[]
  status: 'CONSISTENTE' | 'INCONSISTENTE' | 'CONFLITO' | 'CONFIRMADO' | 'DIFERENTE' | 'NOVO'
  resolvedValue?: string
}

export interface IntakeDocument {
  id: string
  fileName: string
  fileType: 'pdf' | 'image'
  url: string
  thumbnailUrl: string
  uploadDate: string
}

export interface IntakeRA {
  id: string
  raNumber: string
  clientName: string
  cnpj: string
  date: string
  status: ProcessStatus
  validationStatus:
    | 'AGUARDANDO PROCESSAMENTO'
    | 'COMPLETO'
    | 'INCOMPLETO'
    | 'AGUARDANDO REVISÃO'
    | 'PRONTO PARA DISTRIBUIÇÃO'
  source: 'odoo' | 'email' | 'drive'
  documents: IntakeDocument[]

  causerName?: string
  causerCPF?: string
  plate?: string
  marcaModelo?: string
  dinamica?: string
  causerAddress?: string
  causerPhone?: string
  sciData?: string
  infocarData?: string
  assignedAnalyst?: string

  consistencyChecks: ConsistencyCheck[]
  cleanedMockData: string[]
}

interface IntakeStoreState {
  ras: IntakeRA[]
  isSyncing: boolean
  syncSources: () => void
  processRA: (raId: string) => void
  resolveConsistency: (raId: string, checkId: string, selectedValue: string) => void
  distributeRA: (raId: string) => void
}

const INITIAL_RAS: IntakeRA[] = []

const IntakeContext = createContext<IntakeStoreState | null>(null)

export const IntakeProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast()
  const [ras, setRas] = useState<IntakeRA[]>(INITIAL_RAS)
  const [isSyncing, setIsSyncing] = useState(false)

  const processRA = useCallback(
    (raId: string) => {
      const updateStatus = (
        status: ProcessStatus,
        delay: number,
        finalData?: Partial<IntakeRA>,
      ) => {
        setTimeout(() => {
          setRas((prev) =>
            prev.map((ra) => {
              if (ra.id !== raId) return ra
              return {
                ...ra,
                status,
                ...finalData,
              }
            }),
          )

          if (status === 'extracting') {
            toast({ title: 'OCR Iniciado', description: `Lendo documentos do RA...` })
          } else if (status === 'validating') {
            toast({ title: 'Validação de IA', description: `Comparando dados entre documentos...` })
          } else if (status === 'enriching_sci') {
            toast({ title: 'Integração SCI', description: `Consultando dados na base SCI...` })
          } else if (status === 'enriching_infocar') {
            toast({ title: 'Integração Infocar', description: `Buscando dados de veículos...` })
          } else if (
            status === 'completed' &&
            finalData?.validationStatus === 'AGUARDANDO REVISÃO'
          ) {
            toast({
              title: 'Processamento Concluído',
              description: `RA processado. Inconsistências encontradas que precisam de revisão manual.`,
              variant: 'destructive',
            })
          } else if (
            status === 'completed' &&
            finalData?.validationStatus === 'PRONTO PARA DISTRIBUIÇÃO'
          ) {
            toast({
              title: 'Processamento Concluído',
              description: `RA processado e validado com sucesso. Pronto para distribuição.`,
              className: 'bg-green-50 border-green-200 text-green-900',
            })
          }
        }, delay)
      }

      updateStatus('extracting', 1000)
      updateStatus('validating', 3500)
      updateStatus('enriching_sci', 6000)
      updateStatus('enriching_infocar', 8000)
      updateStatus('completed', 10000, {
        validationStatus: 'AGUARDANDO REVISÃO',
        causerName: 'Roberto Carlos Silva',
        plate: 'XYZ-9876',
        marcaModelo: 'Volkswagen Nivus 2022',
        dinamica: 'Veículo cruzou a preferencial e colidiu na lateral direita do ônibus da viação.',
        causerAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP',
        causerPhone: '11912345678',
        sciData: 'Score de Crédito: 850 (Alto). Endereço e vínculos confirmados.',
        infocarData: 'Apólice Ativa na Azul Seguros. Veículo sem restrições. Chassi: 9BWZZZ...',
        consistencyChecks: [
          {
            id: 'chk-1',
            field: 'Placa Causador',
            values: ['XYZ-9876', 'XYZ-9876'],
            sources: ['BO_Policial', 'Odoo'],
            status: 'CONFIRMADO',
          },
          {
            id: 'chk-2',
            field: 'Nome Causador',
            values: ['Roberto C. Silva', 'Roberto Carlos Silva'],
            sources: ['BO_Policial', 'Aviso_Sinistro'],
            status: 'INCONSISTENTE',
          },
          {
            id: 'chk-3',
            field: 'Telefone Causador',
            values: ['(11) 91234-5678', '[Vazio]'],
            sources: ['Aviso_Sinistro', 'Odoo'],
            status: 'NOVO',
          },
        ],
      })
    },
    [toast],
  )

  const resolveConsistency = useCallback(
    (raId: string, checkId: string, selectedValue: string) => {
      setRas((prev) =>
        prev.map((ra) => {
          if (ra.id !== raId) return ra
          const newChecks = ra.consistencyChecks.map((chk) => {
            if (chk.id !== checkId) return chk
            return { ...chk, status: 'CONSISTENTE' as const, resolvedValue: selectedValue }
          })

          const allResolved = newChecks.every(
            (chk) =>
              chk.status === 'CONSISTENTE' || chk.status === 'CONFIRMADO' || chk.status === 'NOVO',
          )

          return {
            ...ra,
            consistencyChecks: newChecks,
            validationStatus: allResolved ? 'PRONTO PARA DISTRIBUIÇÃO' : ra.validationStatus,
          }
        }),
      )
      toast({
        title: 'Inconsistência Resolvida',
        description: 'O valor correto foi salvo e a IA aprenderá para as próximas extrações.',
      })
    },
    [toast],
  )

  const distributeRA = useCallback(
    async (raId: string) => {
      const ra = ras.find((r) => r.id === raId)
      if (!ra) return

      const randomAnalyst = ANALYSTS[Math.floor(Math.random() * ANALYSTS.length)]

      try {
        await supabase.from('claims').insert({
          ra: ra.raNumber,
          stage: 'Atribuir',
          status: 'pending',
          placa_causador: ra.plate,
          causer_name: ra.causerName,
          phone: ra.causerPhone,
          is_validated: true,
          relato_acidente: ra.dinamica || 'Extraído e validado via OCR/IA na Caixa de Entrada.',
          analyst_id: randomAnalyst,
          is_enriched: true,
        })

        setRas((prev) => prev.filter((r) => r.id !== raId))

        toast({
          title: 'RA Distribuído com Sucesso',
          description: `O RA ${ra.raNumber} foi distribuído para ${randomAnalyst} no Kanban.`,
          className: 'bg-green-50 border-green-200 text-green-900',
        })
      } catch (e: any) {
        toast({
          title: 'Erro na distribuição',
          description: e.message,
          variant: 'destructive',
        })
      }
    },
    [ras, toast],
  )

  const syncSources = useCallback(() => {
    setIsSyncing(true)
    setTimeout(() => {
      const newRA: IntakeRA = {
        id: `ra-${Math.floor(Math.random() * 1000)}`,
        raNumber: `RA-2025-${Math.floor(Math.random() * 9000) + 1000}`,
        clientName: 'Expresso Sul Transportes',
        cnpj: '99.888.777/0001-22',
        date: new Date().toLocaleDateString(),
        status: 'pending',
        validationStatus: 'AGUARDANDO PROCESSAMENTO',
        source: 'odoo',
        cleanedMockData: ['Removidos placeholders padrão de testes'],
        documents: [
          {
            id: `doc-${Date.now()}-1`,
            fileName: 'Aviso_Sinistro_Assinado.pdf',
            fileType: 'pdf',
            url: 'https://img.usecurling.com/p/600/800?q=contract&color=gray',
            thumbnailUrl: 'https://img.usecurling.com/p/150/200?q=contract&color=gray',
            uploadDate: new Date().toISOString(),
          },
        ],
        consistencyChecks: [],
      }
      setRas((prev) => [newRA, ...prev])
      setIsSyncing(false)
      toast({
        title: 'Novos Documentos Encontrados (Odoo)',
        description:
          'Um novo RA foi sincronizado com anexos. A limpeza de dados mockados foi executada.',
      })
      processRA(newRA.id)
    }, 1500)
  }, [processRA, toast])

  return React.createElement(
    IntakeContext.Provider,
    { value: { ras, isSyncing, syncSources, processRA, resolveConsistency, distributeRA } },
    children,
  )
}

export default function useIntakeStore() {
  const ctx = useContext(IntakeContext)
  if (!ctx) throw new Error('useIntakeStore must be used within IntakeProvider')
  return ctx
}
