import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export type AgreementType = 'none' | 'insurance' | 'full' | 'installments'
export type AIPhase = 'contact' | 'awareness' | 'negotiation' | 'closing'
export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'replied' | 'positive'

export type PipelineStage =
  | 'Atribuir'
  | 'Atribuído'
  | 'Em análise'
  | 'Qualificado'
  | 'Liberado'
  | 'Termo enviado para assinar'
  | 'Aguardando data de pagamento'
  | 'Aguardando ressarcimento do cliente'
  | 'Aguardando o cliente efetuar o pagamento'
  | 'Concluído'
  | 'Sem acordo'
  | 'Judicial'
  | 'Repescagem'

export const PIPELINE_STAGES: PipelineStage[] = [
  'Atribuir',
  'Atribuído',
  'Em análise',
  'Qualificado',
  'Liberado',
  'Termo enviado para assinar',
  'Aguardando data de pagamento',
  'Aguardando ressarcimento do cliente',
  'Aguardando o cliente efetuar o pagamento',
  'Concluído',
  'Sem acordo',
  'Judicial',
  'Repescagem',
]

export type ClaimCategory =
  | 'Postes (EDP, Cemig, Light, Enel)'
  | 'Ônibus'
  | 'Via Aérea'
  | 'Internet'
  | 'Estrutura dos Terminais'
  | 'Locadora e Veículos'
  | 'Não Classificado'

export type CauserIntention = 'assume' | 'nao_assume' | null
export type ParecerType = 'pendente' | 'positivo' | 'negativo'
export type VistoriaStatus = 'pendente' | 'marcada' | 'realizada' | 'dispensada'

export interface EmailContact {
  email: string
  status: EmailStatus
}

export type ActivityType = 'whatsapp' | 'email' | 'vistoria' | 'financial' | 'manual' | 'system'

export interface ActivityLog {
  id: string
  claimId: string
  text: string
  date: string
  type: ActivityType
}

interface CaseState {
  agreement: AgreementType
  setAgreement: (val: AgreementType) => void
  isQualified: boolean
  hasInsurance: boolean | null
  setHasInsurance: (val: boolean | null) => void
  wantsToNegotiate: boolean
  setWantsToNegotiate: (val: boolean) => void

  claimCategory: ClaimCategory
  setClaimCategory: (val: ClaimCategory) => void
  causerIntention: CauserIntention
  setCauserIntention: (val: CauserIntention) => void
  vistoriaStatus: VistoriaStatus
  setVistoriaStatus: (val: VistoriaStatus) => void
  docsComplete: boolean
  setDocsComplete: (val: boolean) => void
  parecer: ParecerType
  setParecer: (val: ParecerType) => void

  insuranceCompany: string
  setInsuranceCompany: (val: string) => void
  causerClaimNumber: string
  setCauserClaimNumber: (val: string) => void
  clientClaimNumber: string
  setClientClaimNumber: (val: string) => void

  pipelineStage: PipelineStage
  setPipelineStage: (stage: PipelineStage) => void
  analystName: string
  setAnalystName: (val: string) => void
  clientName: string
  setClientName: (val: string) => void
  userRole: string
  setUserRole: (val: string) => void
  raNumber: string
  setRaNumber: (val: string) => void
  emails: EmailContact[]
  sendMassEmail: () => void
  simulateEmailReply: (email: string, positive: boolean) => void
  aiPhase: AIPhase
  setAiPhase: (phase: AIPhase) => void
  pendingResult: boolean
  resolveResult: () => void
  markPositiveInteraction: () => void

  activities: ActivityLog[]
  addActivity: (activity: Omit<ActivityLog, 'id' | 'date'>) => void
}

const CaseContext = createContext<CaseState | null>(null)

export const CaseProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast()
  const { user } = useAuth()
  const [agreement, setAgreement] = useState<AgreementType>('none')
  const [hasInsurance, setHasInsurance] = useState<boolean | null>(null)
  const [wantsToNegotiate, setWantsToNegotiate] = useState(false)
  const [aiPhase, setAiPhase] = useState<AIPhase>('contact')
  const [pendingResult, setPendingResult] = useState(false)
  const [pipelineStage, setPipelineStageState] = useState<PipelineStage>('Atribuído')

  const [claimCategory, setClaimCategory] = useState<ClaimCategory>('Ônibus')
  const [causerIntention, setCauserIntention] = useState<CauserIntention>(null)
  const [vistoriaStatus, setVistoriaStatus] = useState<VistoriaStatus>('pendente')
  const [docsComplete, setDocsComplete] = useState(false)
  const [parecer, setParecer] = useState<ParecerType>('pendente')

  const [insuranceCompany, setInsuranceCompany] = useState('')
  const [causerClaimNumber, setCauserClaimNumber] = useState('')
  const [clientClaimNumber, setClientClaimNumber] = useState('')

  const [analystName, setAnalystName] = useState('Analista')
  const [clientName, setClientName] = useState('Cliente')
  const [userRole, setUserRole] = useState('Admin')
  const [raNumber, setRaNumber] = useState('RA-00000')

  useEffect(() => {
    if (user?.user_metadata?.name) {
      setAnalystName(user.user_metadata.name)
    } else if (user?.email) {
      setAnalystName(user.email.split('@')[0])
    }
  }, [user])

  const [emails, setEmails] = useState<EmailContact[]>([
    { email: 'lenon_pereira@yahoo.com.br', status: 'pending' },
    { email: 'alemao@originet.com.br', status: 'pending' },
    { email: 'maurosilvestre@oi.com.br', status: 'pending' },
  ])

  const [activities, setActivities] = useState<ActivityLog[]>([])

  const addActivity = (activity: Omit<ActivityLog, 'id' | 'date'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
    }
    setActivities((prev) => [newActivity, ...prev])
  }

  const isQualified =
    (causerIntention === 'assume' && hasInsurance === true) ||
    (causerIntention === 'assume' && hasInsurance === false && wantsToNegotiate)

  const setPipelineStage = (stage: PipelineStage) => {
    setPipelineStageState(stage)

    if (
      stage === 'Aguardando data de pagamento' ||
      stage === 'Aguardando o cliente efetuar o pagamento'
    ) {
      toast({
        title: 'Atenção Analista: Ação Requerida',
        description: `${analystName}, o caso do RA ${raNumber} avançou para: ${stage}.`,
        className: 'bg-blue-50 border-blue-200 text-blue-900',
        duration: 8000,
      })
    }
  }

  const prevQualNotified = useRef(false)

  useEffect(() => {
    if (isQualified && !prevQualNotified.current) {
      const currentIndex = PIPELINE_STAGES.indexOf(pipelineStage)
      const qualIndex = PIPELINE_STAGES.indexOf('Qualificado')

      if (currentIndex < qualIndex) {
        setPipelineStage('Qualificado')
      }

      if (hasInsurance === true) {
        toast({
          title: 'Fluxo Automático: Seguradora',
          description: `O caso foi qualificado. Inicie o processo de Vistoria de Constatação e obtenção de Documentação Completa.`,
          className: 'bg-green-50 border-green-200 text-green-900',
          duration: 6000,
        })
      } else if (hasInsurance === false) {
        toast({
          title: 'Fluxo Automático: Acordo Financeiro',
          description: `O caso foi qualificado sem seguro. Acordo de valores sem vistoria ativado. Realize a Programação de Pagamento.`,
          className: 'bg-purple-50 border-purple-200 text-purple-900',
          duration: 6000,
        })
      }
      prevQualNotified.current = true
    } else if (!isQualified) {
      prevQualNotified.current = false
    }

    if (causerIntention === 'nao_assume' && pipelineStage !== 'Repescagem') {
      setPipelineStage('Repescagem')
      toast({
        title: 'Causador Não Assume',
        description: `O caso foi movido para Repescagem para tentativa de confirmação.`,
        variant: 'destructive',
      })
    }
  }, [isQualified, hasInsurance, causerIntention, pipelineStage, toast])

  const markPositiveInteraction = () => {
    setPendingResult(true)
    toast({
      title: 'Interação Positiva Registrada',
      description: `${analystName}, houve interação positiva referente ao RA ${raNumber}`,
      className: 'bg-green-50 border-green-200 text-green-900',
      duration: 5000,
    })
  }

  const sendMassEmail = () => {
    setEmails((curr) => curr.map((e) => ({ ...e, status: 'sent' })))
    toast({
      title: 'Emails Enviados',
      description: 'Template de contato inicial enviado para todos os endereços identificados.',
    })

    setTimeout(() => {
      setEmails((curr) =>
        curr.map((e) => (e.status === 'sent' ? { ...e, status: 'delivered' } : e)),
      )
    }, 2500)
  }

  const simulateEmailReply = (emailToReply: string, positive: boolean) => {
    setEmails((curr) =>
      curr.map((e) => {
        if (e.email === emailToReply) {
          return { ...e, status: positive ? 'positive' : 'replied' }
        }
        return e
      }),
    )

    if (positive) {
      setAiPhase('awareness')
      markPositiveInteraction()
    } else {
      toast({
        title: 'Nova Resposta',
        description: `Resposta recebida de ${emailToReply}. A IA irá analisar a intenção.`,
      })
    }
  }

  const resolveResult = () => {
    setPendingResult(false)
    toast({
      title: 'Resultado Informado',
      description: 'O resultado final da negociação foi registrado com sucesso.',
    })
  }

  return React.createElement(
    CaseContext.Provider,
    {
      value: {
        agreement,
        setAgreement,
        isQualified,
        hasInsurance,
        setHasInsurance,
        wantsToNegotiate,
        setWantsToNegotiate,
        claimCategory,
        setClaimCategory,
        causerIntention,
        setCauserIntention,
        vistoriaStatus,
        setVistoriaStatus,
        docsComplete,
        setDocsComplete,
        parecer,
        setParecer,
        insuranceCompany,
        setInsuranceCompany,
        causerClaimNumber,
        setCauserClaimNumber,
        clientClaimNumber,
        setClientClaimNumber,
        pipelineStage,
        setPipelineStage,
        analystName,
        setAnalystName,
        clientName,
        setClientName,
        userRole,
        setUserRole,
        raNumber,
        setRaNumber,
        emails,
        sendMassEmail,
        simulateEmailReply,
        aiPhase,
        setAiPhase,
        pendingResult,
        resolveResult,
        markPositiveInteraction,
        activities,
        addActivity,
      },
    },
    children,
  )
}

export default function useCaseStore() {
  const ctx = useContext(CaseContext)
  if (!ctx) throw new Error('useCaseStore must be used within CaseProvider')
  return ctx
}
