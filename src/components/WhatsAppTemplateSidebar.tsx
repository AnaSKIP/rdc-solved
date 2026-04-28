import { useState, useEffect } from 'react'
import { MessageCircle, Send, FileText, Smartphone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { sendWhatsAppMessage } from '@/services/whatsapp'

const MOCK_CASE_DATA = {
  causer: {
    name: 'Ricardo Santos',
    phone: '+55 27 99999-8888',
    source: 'SCI API',
  },
  owner: {
    name: 'MAURO DE JESUS SILVESTRE',
    phone: '+55 27 99883-1951',
    source: 'INFOCAR API',
  },
  userName: 'DOUGLAS',
  companyName: 'UNIMAR TRANSPORTES LTDA',
  date: '09/10/2023',
  time: '14:30',
  address: 'Av. Vitória, Vila Velha - ES',
  busPlate: 'RBG7D97',
  causerPlate: 'PZK0H01',
}

export function WhatsAppTemplateSidebar() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState({ causer: true, owner: false })
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (open) {
      setMessage(
        `Olá, tudo bem?\nMeu nome é *${MOCK_CASE_DATA.userName}*, trabalho no departamento de sinistros da *${MOCK_CASE_DATA.companyName}*.\n\nEscrevo referente ao acidente de trânsito ocorrido no dia *${MOCK_CASE_DATA.date} ${MOCK_CASE_DATA.time} ${MOCK_CASE_DATA.address}*, que envolveu o veículo PLACAS *${MOCK_CASE_DATA.causerPlate}* e o nosso Veiculo PLACAS *${MOCK_CASE_DATA.busPlate}*\n\nNosso principal objetivo é resolver essa situação da forma mais simples e rápida para você.\nA maneira mais fácil é através do seu seguro para terceiros. Se optar por acioná-lo, nossa equipe cuida de *100% do processo* diretamente com a sua seguradora. Você *não terá custos* nem precisará se envolver com a burocracia.\nPara isso, gostaria de saber se você irá acionar sua apólice. Se sim, por favor, me informe qual é a seguradora ou o número do sinistro para que possamos conduzir tudo por aqui.\n\nCaso prefira seguir de outra forma, basta me avisar para darmos o próximo passo.\nAgradeço a atenção e aguardo seu retorno.`,
      )
    }
  }, [open])

  const handleSend = async () => {
    const selectedList = []
    if (recipients.causer)
      selectedList.push({ type: 'Causador', phone: MOCK_CASE_DATA.causer.phone })
    if (recipients.owner)
      selectedList.push({ type: 'Proprietário', phone: MOCK_CASE_DATA.owner.phone })

    if (selectedList.length === 0) {
      toast({
        title: 'Nenhum destinatário',
        description: 'Selecione pelo menos um destinatário para enviar a mensagem.',
        variant: 'destructive',
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: 'Mensagem Vazia',
        description: 'A mensagem não pode estar vazia.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)

    try {
      await Promise.all(selectedList.map((contact) => sendWhatsAppMessage(contact.phone, message)))

      toast({
        title: 'Mensagens Enviadas',
        description: `Mensagem enviada com sucesso para: ${selectedList.map((s) => s.type).join(' e ')}.`,
        className: 'bg-green-50 border-green-200 text-green-900',
      })

      setMessage('')
      setOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erro no envio',
        description: error.message || 'Falha ao enviar mensagem através da integração Z-API.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 h-8 border-none shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          Acionar Envolvidos
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md border-l shadow-2xl flex flex-col h-full bg-slate-50 p-0">
        <div className="bg-[#075e54] text-white p-6 pb-4">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Abordagem Inicial - WhatsApp
            </SheetTitle>
            <SheetDescription className="text-emerald-100/80 text-sm mt-1">
              Selecione os destinatários e envie a mensagem a partir do número oficial da RDC.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
            <div className="text-sm font-medium text-gray-700 border-b pb-2">
              Destinatários Encontrados (APIs)
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <Checkbox
                  id="causer"
                  checked={recipients.causer}
                  onCheckedChange={(c) => setRecipients((prev) => ({ ...prev, causer: !!c }))}
                  className="mt-1"
                  disabled={isSending}
                />
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="causer"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px]"
                    >
                      Causador
                    </Badge>
                    {MOCK_CASE_DATA.causer.name}
                  </label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Smartphone className="w-3 h-3" /> {MOCK_CASE_DATA.causer.phone}
                    <Badge variant="secondary" className="text-[9px] h-4 px-1">
                      {MOCK_CASE_DATA.causer.source}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <Checkbox
                  id="owner"
                  checked={recipients.owner}
                  onCheckedChange={(c) => setRecipients((prev) => ({ ...prev, owner: !!c }))}
                  className="mt-1"
                  disabled={isSending}
                />
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="owner"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px]"
                    >
                      Proprietário
                    </Badge>
                    {MOCK_CASE_DATA.owner.name}
                  </label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Smartphone className="w-3 h-3" /> {MOCK_CASE_DATA.owner.phone}
                    <Badge variant="secondary" className="text-[9px] h-4 px-1">
                      {MOCK_CASE_DATA.owner.source}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Mensagem
              </label>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Editável</span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              className="flex-1 min-h-[250px] text-sm resize-none focus-visible:ring-[#25D366] leading-relaxed p-4 bg-white"
            />
          </div>
        </div>

        <div className="p-6 bg-white border-t mt-auto">
          <SheetFooter className="flex-col sm:flex-col gap-3 w-full">
            <Button
              onClick={handleSend}
              disabled={isSending || Object.values(recipients).filter(Boolean).length === 0}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 h-11 text-base shadow-md"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSending
                ? 'Enviando...'
                : `Enviar WhatsApp (${Object.values(recipients).filter(Boolean).length})`}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isSending}
              className="w-full text-gray-500 hover:bg-gray-100"
            >
              Cancelar
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
