import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, Mail, FileText, Loader2, Sparkles } from 'lucide-react'
import useCaseStore, { ActivityType } from '@/stores/useCaseStore'
import { useToast } from '@/hooks/use-toast'
import { formatRaDisplay } from '@/lib/utils'
import { useKanbanStore } from '@/stores/useKanbanStore'

interface DirectEmailPanelProps {
  onEmailSent: (logText: string, type?: ActivityType) => void
}

export function DirectEmailPanel({ onEmailSent }: DirectEmailPanelProps) {
  const { analystName, raNumber } = useCaseStore()
  const { selectedClaim } = useKanbanStore()
  const { toast } = useToast()

  const [sender, setSender] = useState('analyst')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)

  const { ra } = formatRaDisplay(selectedClaim?.raNumber || raNumber, selectedClaim?.companyCnpj)

  const templates = [
    {
      label: 'Solicitar Docs',
      subject: `Documentos Pendentes - Processo ${ra}`,
      body: `Prezado(a),\n\nPara darmos andamento ao processo de ressarcimento referente ao RA ${ra}, solicitamos a gentileza de nos enviar os seguintes documentos:\n\n- CNH do Condutor\n- CRLV do Veículo\n- Boletim de Ocorrência (se houver)\n\nFicamos no aguardo para rápida resolução.\n\nAtenciosamente,\n${sender === 'analyst' ? analystName : 'Equipe de Operações RDC'}`,
    },
    {
      label: 'Lembrete Pagamento',
      subject: `Lembrete de Vencimento - Processo ${ra}`,
      body: `Olá,\n\nGostaríamos de lembrar que a próxima parcela do acordo referente ao processo ${ra} está próxima do vencimento.\n\nCaso já tenha efetuado o pagamento, por favor, desconsidere este e-mail e nos envie o comprovante.\n\nAtenciosamente,\n${sender === 'analyst' ? analystName : 'Equipe Financeira RDC'}`,
    },
    {
      label: 'Acionamento Seguradora',
      subject: `Aviso de Sinistro Terceiro - Ref: ${ra}`,
      body: `À Seguradora,\n\nInformamos a ocorrência de sinistro envolvendo nosso cliente. Seguem em anexo os documentos iniciais para abertura do processo de terceiro sob a referência ${ra}.\n\nAguardamos retorno com o número do sinistro gerado e próximos passos.\n\nAtenciosamente,\n${sender === 'analyst' ? analystName : 'Equipe de Operações RDC'}`,
    },
  ]

  const applyTemplate = (tpl: (typeof templates)[0]) => {
    setSubject(tpl.subject)
    setBody(tpl.body)
  }

  const handleSend = () => {
    if (!to || !subject || !body) {
      toast({
        title: 'Atenção',
        description: 'Preencha os campos de destinatário, assunto e mensagem.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      toast({
        title: 'E-mail Enviado!',
        description: `Mensagem encaminhada para ${to}`,
        className: 'bg-green-50 border-green-200',
      })
      onEmailSent(
        `E-mail enviado para: ${to}\nAssunto: ${subject}\nRemetente: ${sender === 'analyst' ? analystName : 'Geral RDC'}`,
        'email',
      )
      setTo('')
      setSubject('')
      setBody('')
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-md border border-gray-200 shadow-sm animate-in fade-in p-4 overflow-y-auto scrollbar-thin">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
        <Mail className="w-5 h-5 text-indigo-600" />
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Comunicação por E-mail</h3>
          <p className="text-xs text-gray-500">
            Envie mensagens diretamente e registre no histórico
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">Remetente</Label>
            <Select value={sender} onValueChange={setSender}>
              <SelectTrigger className="h-9 text-sm bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analyst">{analystName} (Meu E-mail)</SelectItem>
                <SelectItem value="team">Equipe RDC (operacoes@rdc.com)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">Destinatário</Label>
            <Input
              placeholder="cliente@email.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 text-sm bg-white"
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs font-bold text-gray-600 uppercase">Assunto</Label>
            <div className="flex gap-2">
              {templates.map((tpl) => (
                <Button
                  key={tpl.label}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  onClick={() => applyTemplate(tpl)}
                >
                  <FileText className="w-3 h-3 mr-1" /> {tpl.label}
                </Button>
              ))}
            </div>
          </div>
          <Input
            placeholder="Assunto da mensagem"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-9 text-sm bg-white font-medium"
          />
        </div>

        <div className="space-y-1.5 flex-1 flex flex-col">
          <Label className="text-xs font-bold text-gray-600 uppercase">Mensagem</Label>
          <Textarea
            placeholder="Escreva sua mensagem aqui..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[200px] text-sm bg-white resize-none"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <p className="text-[10px] text-gray-500 italic">
            O envio será registrado automaticamente na aba de Notas.
          </p>
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px] shadow-sm gap-2"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar E-mail
          </Button>
        </div>
      </div>
    </div>
  )
}
