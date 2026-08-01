import { CaseHeader } from '@/components/CaseHeader'
import { CaseForm } from '@/components/CaseForm'
import { CaseLog } from '@/components/CaseLog'
import { KanbanBoard } from '@/components/KanbanBoard'
import { useKanbanStore } from '@/stores/useKanbanStore'
import { useAuth } from '@/hooks/use-auth'
import useContactStore from '@/stores/useContactStore'
import { ShieldAlert, ArrowLeft, MessageSquareWarning, Scale, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const CaseLogWrapper = () => {
  return (
    <Tabs defaultValue="log" className="flex-1 flex flex-col h-full overflow-hidden w-full">
      <div className="px-4 py-2 border-b border-gray-100 shrink-0">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="log" className="text-xs font-semibold">
            Histórico
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="log"
        className="flex-1 overflow-hidden m-0 p-0 outline-none data-[state=active]:flex flex-col"
      >
        <CaseLog />
      </TabsContent>
    </Tabs>
  )
}

const CaseDetail = () => {
  const { selectedClaim, setSelectedClaim } = useKanbanStore()
  const { user } = useAuth()
  const { internalTeam } = useContactStore()

  const isInternal =
    (internalTeam || []).some(
      (t) => t?.email && user?.email && t.email.toLowerCase() === user.email.toLowerCase(),
    ) ||
    (user?.email && user.email.toLowerCase().includes('admin'))

  if (selectedClaim?.stage === 'Termo enviado para assinar' && !isInternal) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-48px)] w-full bg-gray-50 animate-in zoom-in-95 duration-300">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6 drop-shadow-sm" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Acesso Restrito</h2>
        <p className="text-gray-600 mb-8 max-w-md text-center leading-relaxed">
          Este processo está na fase{' '}
          <strong className="text-gray-800">Termo enviado para assinar</strong>. Por políticas de
          privacidade, apenas membros da equipe interna podem visualizar e editar os dados nesta
          etapa.
        </p>
        <Button
          onClick={() => setSelectedClaim(null)}
          className="gap-2 bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Retornar ao Kanban
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] w-full overflow-hidden relative bg-gray-100 animate-in slide-in-from-right-4 fade-in duration-300">
      <CaseHeader />

      <div className="flex flex-col xl:flex-row flex-1 overflow-hidden">
        <div className="flex-[2] overflow-y-auto scrollbar-thin pb-20 md:pb-0 relative z-10 px-0 sm:px-4 lg:px-6 py-6">
          <CaseForm />
        </div>

        <div className="w-full xl:w-[450px] shrink-0 border-t xl:border-t-0 xl:border-l border-gray-200 z-20 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] bg-white h-[50vh] xl:h-auto flex flex-col">
          <CaseLogWrapper />
        </div>
      </div>
    </div>
  )
}

const KanbanPage = () => {
  const { selectedClaim, refreshClaims } = useKanbanStore()

  useEffect(() => {
    const processPdfs = async () => {
      console.log('Extração iniciada')
      try {
        const { data, error } = await supabase.functions.invoke('processar-pdf-leads')

        if (error) {
          throw error
        }

        const count = data?.count ?? data?.leads?.length ?? data?.extractedCount ?? 0
        console.log(`${count} leads extraídos com sucesso`)

        refreshClaims()
      } catch (error: any) {
        console.error(error.message || 'Erro ao processar leads')
      }
    }

    processPdfs()
  }, [refreshClaims])

  if (selectedClaim) {
    return <CaseDetail />
  }

  return <KanbanBoard />
}

export default KanbanPage
