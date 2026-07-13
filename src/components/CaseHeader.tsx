import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Pipeline } from './Pipeline'
import { WhatsAppTemplateSidebar } from './WhatsAppTemplateSidebar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useCaseStore, { PIPELINE_STAGES, PipelineStage } from '@/stores/useCaseStore'
import useKanbanStore, { KanbanClaim } from '@/stores/useKanbanStore'
import { useToast } from '@/hooks/use-toast'
import { PasswordConfirmModal } from '@/components/PasswordConfirmModal'
import { supabase } from '@/lib/supabase/client'

export function CaseHeader() {
  const { toast } = useToast()

  const {
    isQualified,
    raNumber,
    analystName,
    pipelineStage,
    setPipelineStage,
    setRaNumber,
    setAnalystName,
    setInsuranceCompany,
    setCauserClaimNumber,
    setClientClaimNumber,
  } = useCaseStore()

  const { claims, selectedClaim, setSelectedClaim, moveClaim, analystFilter } = useKanbanStore()

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const currentIndexStage = PIPELINE_STAGES.indexOf(pipelineStage)
  const isFirstStage = currentIndexStage <= 0
  const isLastStage = currentIndexStage >= PIPELINE_STAGES.length - 1

  const handleStageChange = (newStage: PipelineStage) => {
    setPipelineStage(newStage)
    if (selectedClaim) {
      moveClaim(selectedClaim.id, newStage)
      setSelectedClaim({ ...selectedClaim, stage: newStage })
    }
  }

  const handlePrevStage = () => {
    if (!isFirstStage) {
      handleStageChange(PIPELINE_STAGES[currentIndexStage - 1])
    }
  }

  const handleNextStage = () => {
    if (!isLastStage) {
      handleStageChange(PIPELINE_STAGES[currentIndexStage + 1])
    }
  }

  const filteredClaims = useMemo(() => {
    return (claims || []).filter((c) => analystFilter === 'all' || c?.analyst === analystFilter)
  }, [claims, analystFilter])

  const currentClaimIndex = filteredClaims.findIndex((c) => c.id === selectedClaim?.id)
  const totalClaims = filteredClaims.length

  const handlePopulateClaim = (claim: KanbanClaim) => {
    if (!claim) return
    setRaNumber(claim.raNumber?.toString() || '')
    setAnalystName(claim.analyst?.toString() || '')
    setPipelineStage(claim.stage)
    setInsuranceCompany(claim.insuranceCompany?.toString() || '')
    setCauserClaimNumber(claim.causerClaimNumber?.toString() || '')
    setClientClaimNumber(claim.clientClaimNumber?.toString() || '')
    setSelectedClaim(claim)
  }

  const handlePrevClaim = () => {
    if (currentClaimIndex > 0) {
      handlePopulateClaim(filteredClaims[currentClaimIndex - 1])
    }
  }

  const handleNextClaim = () => {
    if (currentClaimIndex >= 0 && currentClaimIndex < totalClaims - 1) {
      handlePopulateClaim(filteredClaims[currentClaimIndex + 1])
    }
  }

  const handleDiscard = async () => {
    if (!selectedClaim) return
    const { error } = await supabase.from('claims').delete().eq('id', selectedClaim.id)
    if (error) {
      toast({ title: 'Erro ao descartar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Sinistro descartado com sucesso.' })
      setSelectedClaim(null)
      useKanbanStore.getState().refreshClaims()
    }
    setIsDeleteModalOpen(false)
  }

  return (
    <div className="bg-white border-b px-4 py-3 space-y-3 sticky top-0 z-40 shadow-sm flex-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-gray-700 hover:text-gray-900 border-gray-300 font-semibold shadow-sm hover:bg-gray-50"
            onClick={() => setSelectedClaim(null)}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Kanban
          </Button>

          <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>

          <div className="font-bold flex items-center gap-2 text-gray-900 text-lg">
            {raNumber}
            {isQualified && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white border-none shadow-sm gap-1 pl-1 pr-2 uppercase font-bold text-[10px] animate-in slide-in-from-left-2 fade-in duration-300">
                <CheckCircle2 className="w-3 h-3" />
                Qualificado
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
          <span>
            {currentClaimIndex >= 0 ? currentClaimIndex + 1 : 0} / {totalClaims}
          </span>
          <div className="flex border border-gray-300 rounded overflow-hidden bg-white shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-8 rounded-none border-r border-gray-300 hover:bg-gray-100 disabled:opacity-30"
              onClick={handlePrevClaim}
              disabled={currentClaimIndex <= 0}
              title="Sinistro Anterior"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-8 rounded-none hover:bg-gray-100 disabled:opacity-30"
              onClick={handleNextClaim}
              disabled={currentClaimIndex < 0 || currentClaimIndex >= totalClaims - 1}
              title="Próximo Sinistro"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="bg-solved hover:bg-solved-dark h-8 text-white shadow-sm">
            SALVAR
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 shadow-sm border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Descartar
          </Button>

          <div className="border-l pl-2 ml-1 flex items-center gap-2">
            <Select defaultValue="douglas">
              <SelectTrigger className="h-8 text-xs border-gray-200 bg-white shadow-sm w-[130px]">
                <SelectValue placeholder="Atribuído a" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="douglas" className="uppercase">
                  {analystName}
                </SelectItem>
                <SelectItem value="maria">MARIA SOUZA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full lg:w-[65%] flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs shadow-sm border-gray-300 text-gray-700 font-semibold shrink-0"
            onClick={handlePrevStage}
            disabled={isFirstStage}
          >
            Retornar
          </Button>
          <div className="flex-1 min-w-0">
            <Pipeline
              stages={PIPELINE_STAGES}
              currentStage={pipelineStage}
              onStageClick={(stage) => handleStageChange(stage as PipelineStage)}
            />
          </div>
          <Button
            size="sm"
            className="h-8 px-3 text-xs bg-solved hover:bg-solved-dark text-white shadow-sm font-semibold shrink-0"
            onClick={handleNextStage}
            disabled={isLastStage}
          >
            Adiantar
          </Button>
        </div>
      </div>

      <PasswordConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDiscard}
        title="Descartar Sinistro"
        description="Esta ação é irreversível. O sinistro e todos os seus anexos serão excluídos. Por favor, confirme sua senha para autorizar."
      />
    </div>
  )
}
