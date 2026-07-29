import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchOdooStages, type OdooStage } from '@/services/odoo-stages'
import type { OdooCredentials } from '@/stores/useOdooImportStore'

interface StageSelectorProps {
  credentials: OdooCredentials | null
  selectedStageIds: number[]
  onChange: (ids: number[]) => void
}

export function StageSelector({ credentials, selectedStageIds, onChange }: StageSelectorProps) {
  const [stages, setStages] = useState<OdooStage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!credentials || hasLoaded) return
    setIsLoading(true)
    fetchOdooStages(credentials).then(({ data, error }) => {
      setIsLoading(false)
      setHasLoaded(true)
      if (data) {
        setStages(data)
      }
    })
  }, [credentials, hasLoaded])

  const toggleStage = (id: number) => {
    if (selectedStageIds.includes(id)) {
      onChange(selectedStageIds.filter((s) => s !== id))
    } else {
      onChange([...selectedStageIds, id])
    }
  }

  const selectAll = () => {
    onChange(stages.map((s) => s.id))
  }

  const clearSelection = () => {
    onChange([])
  }

  const selectedNames = stages.filter((s) => selectedStageIds.includes(s.id)).map((s) => s.name)

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
      <div className="flex-1 space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          Selecione os estágios para importar
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              {selectedNames.length > 0 ? (
                <span className="truncate">
                  {selectedNames.length <= 2
                    ? selectedNames.join(', ')
                    : `${selectedNames.length} estágios selecionados`}
                </span>
              ) : (
                <span className="text-gray-400">Escolha estágios...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                disabled={stages.length === 0}
                className="text-xs"
              >
                Selecionar Todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={selectedStageIds.length === 0}
                className="text-xs"
              >
                Limpar Seleção
              </Button>
            </div>
            <ScrollArea className="h-[260px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Carregando estágios...</span>
                </div>
              ) : stages.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Nenhum estágio encontrado.
                </div>
              ) : (
                <div className="p-1">
                  {stages.map((stage) => {
                    const isSelected = selectedStageIds.includes(stage.id)
                    return (
                      <div
                        key={stage.id}
                        className={cn(
                          'flex items-center gap-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-gray-100',
                          isSelected && 'bg-blue-50',
                        )}
                        onClick={() => toggleStage(stage.id)}
                      >
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                        <span className="text-sm flex-1">{stage.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1 pb-1">
          {selectedNames.slice(0, 4).map((name) => (
            <Badge key={name} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))}
          {selectedNames.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{selectedNames.length - 4}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
