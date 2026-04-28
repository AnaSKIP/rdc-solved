import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Loader2, Bot } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { runAutomationTest } from '@/services/automation'
import { supabase } from '@/lib/supabase/client'

export default function AutomationFAB() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSimulateReply = async () => {
    setLoading(true)
    try {
      // Find the most recently enriched claim in Atribuído
      const { data: claims } = await supabase
        .from('claims')
        .select('id, phone')
        .eq('stage', 'Atribuído')
        .order('created_at', { ascending: false })
        .limit(1)

      const claim = claims?.[0]
      if (!claim) throw new Error('Nenhum lead recente em "Atribuído" para simular resposta.')

      // Insert message
      await supabase.from('claim_messages').insert({
        claim_id: claim.id,
        content: 'Olá, sim podemos conversar. O que precisam?',
        is_from_client: true,
        sender_phone: claim.phone || '+5511999999999',
      })

      // Move to 'Em análise' and flag positive
      await supabase
        .from('claims')
        .update({
          stage: 'Em análise',
          has_positive_interaction: true,
        })
        .eq('id', claim.id)

      toast({
        title: 'Resposta Simulada',
        description: 'Cliente respondeu. O lead foi movido para "Em análise"!',
        className: 'bg-blue-50 border-blue-200 text-blue-900',
        duration: 5000,
      })
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setLoading(true)
    try {
      await runAutomationTest((message) => {
        toast({
          title: 'Executando Automação',
          description: message,
          duration: 2000,
        })
      })
      toast({
        title: 'Sucesso',
        description:
          'Teste de automação concluído! O lead foi enriquecido e o primeiro contato enviado.',
        className: 'bg-green-50 border-green-200 text-green-900',
        duration: 5000,
      })
    } catch (error: any) {
      toast({ title: 'Erro na Automação', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <div className="bg-white/90 backdrop-blur-sm text-xs font-medium px-3 py-1.5 rounded-full shadow-sm border text-muted-foreground flex items-center gap-1.5 animate-fade-in-up">
        <Bot className="w-3.5 h-3.5 text-primary" />
        Testar fluxo de Enriquecimento
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full shadow-lg bg-white/80 backdrop-blur-sm"
          onClick={handleSimulateReply}
          disabled={loading}
        >
          Simular Resposta
        </Button>
        <Button
          size="lg"
          className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 gap-2 pr-6"
          onClick={handleTest}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5 fill-current" />
          )}
          <span className="font-semibold">Simular Automação</span>
        </Button>
      </div>
    </div>
  )
}
