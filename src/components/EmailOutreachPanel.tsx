import { Button } from '@/components/ui/button'
import { Mail, Send, CheckCircle2, Clock, Bot, ThumbsUp, MessageSquare } from 'lucide-react'
import useCaseStore from '@/stores/useCaseStore'
import { cn } from '@/lib/utils'

export function EmailOutreachPanel() {
  const { emails, sendMassEmail, aiPhase, setAiPhase, simulateEmailReply } = useCaseStore()

  const phases = [
    { id: 'contact', label: 'Contato' },
    { id: 'awareness', label: 'Conscientização' },
    { id: 'negotiation', label: 'Negociação' },
    { id: 'closing', label: 'Fechamento' },
  ] as const

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-gray-400" />
      case 'sent':
        return <Send className="w-3 h-3 text-blue-500" />
      case 'delivered':
        return <CheckCircle2 className="w-3 h-3 text-blue-500" />
      case 'replied':
        return <MessageSquare className="w-3 h-3 text-orange-500" />
      case 'positive':
        return <ThumbsUp className="w-3 h-3 text-green-500" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'sent':
        return 'Enviado'
      case 'delivered':
        return 'Entregue'
      case 'replied':
        return 'Respondido'
      case 'positive':
        return 'Positivo'
      default:
        return status
    }
  }

  const canSend = emails.some((e) => e.status === 'pending')

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-md overflow-hidden h-[500px] xl:h-[calc(100vh-220px)]">
      <div className="bg-indigo-700 text-white p-4 flex flex-col gap-3 z-10 relative shadow-sm shrink-0">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-sm flex items-center gap-2 uppercase tracking-wider">
            <Bot className="w-5 h-5 text-indigo-200" />
            IA de Negociação
          </div>
          {canSend && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-3 text-xs bg-white text-indigo-700 hover:bg-indigo-50 border-none shadow-sm uppercase font-bold"
              onClick={sendMassEmail}
            >
              <Mail className="w-3 h-3 mr-1.5" />
              Disparar ({emails.length})
            </Button>
          )}
        </div>

        {/* Phases Pipeline */}
        <div className="flex w-full bg-indigo-800 rounded-sm overflow-hidden text-[10px] font-bold uppercase tracking-wider mt-1 border border-indigo-600">
          {phases.map((phase, idx) => {
            const currentIndex = phases.findIndex((p) => p.id === aiPhase)
            const isPast = idx < currentIndex
            const isCurrent = idx === currentIndex
            const isFuture = idx > currentIndex

            return (
              <div
                key={phase.id}
                onClick={() => setAiPhase(phase.id)}
                className={cn(
                  'relative flex-1 flex items-center justify-center py-2 px-1 cursor-pointer transition-colors border-r border-indigo-600 last:border-r-0',
                  isCurrent ? 'bg-indigo-500 text-white' : '',
                  isPast ? 'text-indigo-200 hover:bg-indigo-600' : '',
                  isFuture ? 'text-indigo-400/50 hover:bg-indigo-600' : '',
                )}
              >
                <span className="truncate z-10">{phase.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-4 space-y-4 bg-gray-50 flex-1 overflow-y-auto scrollbar-thin">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-2">
          Contatos Encontrados (Infocar/SCI)
        </div>

        <div className="space-y-2">
          {emails.map((contact, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-md bg-white hover:border-indigo-300 transition-colors gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded shadow-sm border border-indigo-100 shrink-0">
                  <Mail className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 break-all">
                    {contact.email}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5 font-medium uppercase tracking-wide">
                    {getStatusIcon(contact.status)}
                    <span>{getStatusLabel(contact.status)}</span>
                  </div>
                </div>
              </div>

              {contact.status === 'delivered' && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-gray-300 text-gray-600"
                    onClick={() => simulateEmailReply(contact.email, false)}
                  >
                    Simular
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 uppercase font-bold tracking-wider"
                    onClick={() => simulateEmailReply(contact.email, true)}
                  >
                    Interação +
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Current Phase Context */}
        <div className="mt-6 bg-white p-4 rounded-md border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            Contexto: {phases.find((p) => p.id === aiPhase)?.label}
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {aiPhase === 'contact' &&
              'A IA elabora uma apresentação profissional mencionando o acidente e dados básicos. Busca identificar a responsabilidade e convida amigavelmente o proprietário para um primeiro contato.'}
            {aiPhase === 'awareness' &&
              'Explicação detalhada sobre a resolução via seguro para terceiros do causador. A IA enfatiza a ausência de custos extras ou burocracia se acionado rapidamente.'}
            {aiPhase === 'negotiation' &&
              'Causador sem seguro identificado. A IA faz a transição para negociação de acordo financeiro direto, buscando valores factíveis para atingir o status Qualificado.'}
            {aiPhase === 'closing' &&
              'Fechamento do método de pagamento (integral ou parcelado). A IA prepara o envio de boletos ou o termo de acordo formal para assinatura das partes.'}
          </p>
        </div>
      </div>
    </div>
  )
}
