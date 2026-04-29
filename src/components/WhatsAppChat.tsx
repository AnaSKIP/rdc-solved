import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { sendWhatsAppMessage } from '@/services/whatsapp'
import {
  Send,
  Loader2,
  MessageSquare,
  Phone,
  Sparkles,
  BrainCircuit,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import useKanbanStore from '@/stores/useKanbanStore'
import useCaseStore from '@/stores/useCaseStore'
import { cn } from '@/lib/utils'

export function WhatsAppChat() {
  const { selectedClaim } = useKanbanStore()
  const { addActivity } = useCaseStore()
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('chat')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [iaResult, setIaResult] = useState<any>(null)

  const [kbObjection, setKbObjection] = useState('')
  const [kbDifficulty, setKbDifficulty] = useState('Média')
  const [kbResponse, setKbResponse] = useState('')
  const [kbEvidence, setKbEvidence] = useState('')

  useEffect(() => {
    if (selectedClaim) {
      const fetchPhone = async () => {
        const { data } = await supabase
          .from('claims')
          .select('phone')
          .eq('id', selectedClaim.id)
          .single()

        if (data && data.phone) {
          setPhone(data.phone)
        } else {
          setPhone('')
        }
      }
      fetchPhone()

      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from('claim_messages')
          .select('*')
          .eq('claim_id', selectedClaim.id)
          .order('created_at', { ascending: true })

        if (data && !error) {
          setMessages(data)
        }
      }
      fetchMessages()

      const channel = supabase
        .channel(`messages_${selectedClaim.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'claim_messages',
            filter: `claim_id=eq.${selectedClaim.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new])
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedClaim])

  const handleSend = async () => {
    if (!message.trim() || !phone.trim()) {
      toast({
        title: 'Atenção',
        description: 'Número e mensagem são obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    setIsLoading(true)
    try {
      await sendWhatsAppMessage(phone, message)
      if (selectedClaim?.id) {
        addActivity({
          claimId: selectedClaim.id,
          type: 'whatsapp',
          text: `Mensagem enviada para ${phone}:\n"${message}"`,
        })

        // Also add the message locally to the chat via claim_messages
        await supabase.from('claim_messages').insert({
          claim_id: selectedClaim.id,
          sender_phone: phone,
          content: message,
          is_from_client: false,
        })
      }
      toast({
        title: 'Sucesso',
        description: 'Mensagem enviada com sucesso via WhatsApp!',
        className: 'bg-green-50 border-green-200 text-green-900',
      })
      setMessage('')
    } catch (error: any) {
      toast({ title: 'Erro de Comunicação', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeAudio = () => {
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A análise real de áudios será ativada na próxima atualização da IA.',
      variant: 'default',
    })
  }

  const handleSaveToKnowledgeBase = async () => {
    if (!kbObjection || !kbResponse) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }
    const { error } = await supabase.from('ai_knowledge_base').insert({
      objection_type: kbObjection,
      difficulty: kbDifficulty,
      suggested_response: kbResponse,
      evidence_text: kbEvidence,
    })

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Base de conhecimento atualizada!',
        description: 'A IA usará este caso como exemplo futuro.',
        className: 'bg-green-50 text-green-900 border-green-200',
      })
      setKbObjection('')
      setKbResponse('')
      setKbEvidence('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-md border border-gray-200 shadow-sm animate-in fade-in">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between rounded-t-md shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#25D366]" />
          <h3 className="font-semibold text-gray-800">Comunicação WhatsApp</h3>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 border-b border-gray-100 bg-white">
          <TabsList className="w-full grid grid-cols-3 h-10 bg-gray-100/80 p-1">
            <TabsTrigger value="chat" className="text-[11px] font-semibold tracking-wide uppercase">
              Conversa
            </TabsTrigger>
            <TabsTrigger
              value="ia"
              className="text-[11px] gap-1.5 font-semibold tracking-wide uppercase"
            >
              <BrainCircuit className="w-3.5 h-3.5" /> IA
            </TabsTrigger>
            <TabsTrigger
              value="kb"
              className="text-[11px] gap-1.5 font-semibold tracking-wide uppercase"
            >
              <BookOpen className="w-3.5 h-3.5" /> Base
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="chat"
          className="flex-1 flex flex-col min-h-0 m-0 p-4 gap-4 outline-none data-[state=active]:flex"
        >
          <div className="space-y-2 shrink-0 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <Label
              htmlFor="phone"
              className="text-xs text-blue-800 font-bold uppercase flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" /> Número de Destino
            </Label>
            <Input
              id="phone"
              placeholder="Ex: 5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-sm bg-white h-10 border-blue-200 focus-visible:ring-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50/80 p-3 rounded-md border border-gray-200 flex flex-col gap-2 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[85%] p-2.5 rounded-lg text-sm shadow-sm flex flex-col',
                  msg.is_from_client
                    ? 'bg-white border border-gray-200 self-start rounded-tl-sm'
                    : 'bg-[#E7FFDB] border border-[#D3F5C0] self-end rounded-tr-sm',
                )}
              >
                <span className="text-gray-800 whitespace-pre-wrap">{msg.content}</span>
                <span className="text-[9px] text-gray-500 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-medium">Nenhuma mensagem encontrada.</p>
                <p className="text-[10px]">O histórico aparecerá aqui.</p>
              </div>
            )}
          </div>

          <div className="space-y-2 shrink-0 flex flex-col">
            <Label htmlFor="message" className="text-xs text-gray-600 font-bold uppercase">
              Mensagem
            </Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem aqui..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-sm bg-white resize-none min-h-[80px] focus-visible:ring-green-500"
            />
          </div>
          <div className="flex justify-end pt-1 shrink-0">
            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 shadow-sm min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}{' '}
              Enviar Agora
            </Button>
          </div>
        </TabsContent>

        <TabsContent
          value="ia"
          className="flex-1 overflow-y-auto m-0 p-4 outline-none data-[state=active]:flex flex-col gap-4"
        >
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-4 rounded-lg flex flex-col items-center text-center gap-3">
            <BrainCircuit className="w-8 h-8 text-purple-600" />
            <div>
              <h4 className="text-sm font-bold text-purple-900">
                Transcrição de Áudio Inteligente
              </h4>
              <p className="text-xs text-purple-700 mt-1">
                Extraia o texto de messages de voz e identifique o tom e objeções do causador.
              </p>
            </div>
            <Button
              onClick={handleAnalyzeAudio}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full mt-2 gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}{' '}
              Analisar Último Áudio
            </Button>
          </div>
        </TabsContent>

        <TabsContent
          value="kb"
          className="flex-1 overflow-y-auto m-0 p-4 outline-none data-[state=active]:flex flex-col gap-4"
        >
          <div className="mb-2">
            <h4 className="text-sm font-bold text-gray-800">Treinamento da IA</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Insira exemplos de tratativas bem-sucedidas para alimentar a base de conhecimento e
              melhorar as sugestões futuras.
            </p>
          </div>
          <div className="space-y-4 bg-gray-50/80 p-4 rounded-lg border border-gray-200">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Objeção do Causador</Label>
              <Input
                value={kbObjection}
                onChange={(e) => setKbObjection(e.target.value)}
                placeholder="Ex: Não concordo com os honorários"
                className="h-9 text-sm bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Nível de Dificuldade</Label>
              <Select value={kbDifficulty} onValueChange={setKbDifficulty}>
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Resposta Ideal (Gabarito)
              </Label>
              <Textarea
                value={kbResponse}
                onChange={(e) => setKbResponse(e.target.value)}
                placeholder="Digite o argumento que resolveu o caso..."
                className="min-h-[80px] text-sm bg-white resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex justify-between">
                Evidência Opcional{' '}
                <span className="text-[10px] text-gray-400 font-normal">(Print da conversa)</span>
              </Label>
              <Textarea
                value={kbEvidence}
                onChange={(e) => setKbEvidence(e.target.value)}
                placeholder="Cole o texto da conversa como evidência..."
                className="min-h-[60px] text-sm bg-white resize-none"
              />
            </div>
            <Button
              onClick={handleSaveToKnowledgeBase}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm mt-2"
            >
              Salvar na Base de Conhecimento
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
