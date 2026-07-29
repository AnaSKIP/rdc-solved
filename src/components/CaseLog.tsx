import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { WhatsAppChat } from './WhatsAppChat'
import { EmailOutreachPanel } from './EmailOutreachPanel'
import { DirectEmailPanel } from './DirectEmailPanel'
import {
  Clock,
  MessageSquare,
  PenTool,
  CheckSquare,
  Mail,
  Bot,
  Camera,
  DollarSign,
} from 'lucide-react'
import useCaseStore, { ActivityType } from '@/stores/useCaseStore'
import useKanbanStore from '@/stores/useKanbanStore'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function CaseLog() {
  const [activeTab, setActiveTab] = useState('notas')
  const { analystName, activities, addActivity } = useCaseStore()
  const { selectedClaim } = useKanbanStore()
  const { toast } = useToast()

  const [activityNote, setActivityNote] = useState('')

  const safeAnalystName = analystName?.toString() || 'U'
  const fallbackInitial = safeAnalystName.length > 0 ? safeAnalystName.charAt(0).toUpperCase() : 'U'

  const claimActivities = activities
    .filter((a) => a.claimId === selectedClaim?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleAddActivity = (text: string, type: ActivityType = 'manual') => {
    if (!text.trim() || !selectedClaim?.id) return
    addActivity({ claimId: selectedClaim.id, text, type })
    setActivityNote('')
    toast({
      title: 'Atividade registrada',
      className: 'bg-green-50 border-green-200 text-green-900',
    })
  }

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-600" />
      case 'email':
        return <Mail className="w-4 h-4 text-indigo-600" />
      case 'vistoria':
        return <Camera className="w-4 h-4 text-purple-600" />
      case 'financial':
        return <DollarSign className="w-4 h-4 text-emerald-600" />
      case 'manual':
        return <CheckSquare className="w-4 h-4 text-blue-600" />
      case 'system':
        return <Clock className="w-4 h-4 text-gray-600" />
      default:
        return <CheckSquare className="w-4 h-4 text-blue-600" />
    }
  }

  const getActivityAvatarClass = (type: ActivityType) => {
    switch (type) {
      case 'whatsapp':
        return 'bg-green-100 border border-green-200'
      case 'email':
        return 'bg-indigo-100 border border-indigo-200'
      case 'vistoria':
        return 'bg-purple-100 border border-purple-200'
      case 'financial':
        return 'bg-emerald-100 border border-emerald-200'
      case 'manual':
        return 'bg-blue-100 border border-blue-200'
      case 'system':
        return 'bg-gray-100 border border-gray-200'
      default:
        return 'bg-blue-100 border border-blue-200'
    }
  }

  return (
    <div className="flex flex-col h-full bg-white shadow-sm w-full">
      <Tabs
        defaultValue="notas"
        className="flex flex-col h-full w-full"
        onValueChange={setActiveTab}
      >
        <div className="px-4 pt-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-solved" /> Chatter
            </h3>
          </div>
          <TabsList className="bg-transparent h-auto p-0 flex gap-4 w-full justify-start border-b-0 overflow-x-auto scrollbar-none">
            <TabsTrigger
              value="notas"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-solved rounded-none px-1 pb-2 pt-1 text-[11px] sm:text-xs text-gray-500 data-[state=active]:text-solved font-semibold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Clock className="w-3.5 h-3.5" />
              Notas
            </TabsTrigger>
            <TabsTrigger
              value="email"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-1 pb-2 pt-1 text-[11px] sm:text-xs text-gray-500 data-[state=active]:text-indigo-600 font-semibold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              E-mail
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-1 pb-2 pt-1 text-[11px] sm:text-xs text-gray-500 data-[state=active]:text-green-600 font-semibold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger
              value="atividades"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-solved rounded-none px-1 pb-2 pt-1 text-[11px] sm:text-xs text-gray-500 data-[state=active]:text-solved font-semibold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Atividades
            </TabsTrigger>
            <TabsTrigger
              value="campanha"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-1 pb-2 pt-1 text-[11px] sm:text-xs text-gray-500 data-[state=active]:text-purple-600 font-semibold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Bot className="w-3.5 h-3.5" />
              Campanha IA
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/30 scrollbar-thin">
          <TabsContent value="notas" className="m-0 space-y-6 animate-fade-in p-4">
            {claimActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-400 border border-dashed border-gray-200 rounded-md bg-white">
                <Clock className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">Nenhum registro no histórico.</p>
                <p className="text-xs text-center mt-1">
                  As atividades reais deste processo aparecerão aqui.
                </p>
              </div>
            ) : (
              claimActivities.map((act) => (
                <div key={act.id} className="flex gap-3">
                  <Avatar
                    className={`h-8 w-8 shrink-0 mt-1 shadow-sm flex items-center justify-center ${getActivityAvatarClass(
                      act.type,
                    )}`}
                  >
                    {getActivityIcon(act.type)}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900 uppercase">
                        {act.type === 'system' ? 'Sistema' : safeAnalystName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(act.date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200 shadow-sm whitespace-pre-wrap">
                      {act.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="email" className="m-0 h-full animate-fade-in">
            <DirectEmailPanel
              onEmailSent={(msg, type) => {
                handleAddActivity(msg, type || 'email')
                setActiveTab('notas')
              }}
            />
          </TabsContent>

          <TabsContent value="whatsapp" className="m-0 h-full animate-fade-in p-4">
            <WhatsAppChat />
          </TabsContent>

          <TabsContent value="campanha" className="m-0 animate-fade-in pb-4 p-4">
            <EmailOutreachPanel />
          </TabsContent>

          <TabsContent
            value="atividades"
            className="m-0 h-full flex flex-col gap-4 animate-fade-in outline-none p-4"
          >
            <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm shrink-0">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5" /> Registrar Atividade Rápida
              </h4>
              <Textarea
                placeholder="Descreva a tratativa com a seguradora ou anote o que foi falado..."
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                className="min-h-[80px] text-sm resize-none mb-2 border-gray-300 focus-visible:ring-solved shadow-inner"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleAddActivity(activityNote, 'manual')}
                  className="bg-solved hover:bg-solved-dark text-white shadow-sm h-8 px-4 text-xs font-bold"
                >
                  Salvar Registro
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {claimActivities.map((act) => (
                <div
                  key={act.id}
                  className="bg-gray-50 border border-gray-100 p-3 rounded-md shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1">
                    <span className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                      {getActivityIcon(act.type)}
                      {act.type === 'manual' ? 'Registro Manual' : 'Registro Automático'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {new Date(act.date).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {act.text}
                  </p>
                </div>
              ))}
              {claimActivities.length === 0 && (
                <div className="text-center p-8 bg-white border border-dashed border-gray-300 rounded-md">
                  <p className="text-sm text-gray-500 font-medium">
                    Nenhum registro de atividade recente.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Utilize o formulário acima para registrar tratativas ativas, as anotações não
                    serão perdidas ao trocar de aba.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
