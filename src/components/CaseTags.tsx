import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Plus, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import useKanbanStore from '@/stores/useKanbanStore'

export const AVAILABLE_TAGS = [
  {
    label: 'Mandar Orçamento',
    category: 'Operacional',
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  },
  {
    label: 'Orçamento Enviado',
    category: 'Operacional',
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  },
  {
    label: 'Docs Empresa',
    category: 'Operacional',
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  },
  {
    label: 'Agendar Vistoria',
    category: 'Operacional',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
  },
  {
    label: 'Vistoria Realizada',
    category: 'Operacional',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
  },
  {
    label: 'Não Assume Resp.',
    category: 'Negociação',
    color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  },
  {
    label: 'Sem Danos',
    category: 'Negociação',
    color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
  },
  {
    label: 'Sem Dados',
    category: 'Negociação',
    color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
  },
  {
    label: 'Não Teve Acordo',
    category: 'Negociação',
    color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  },
  {
    label: 'Ressarcido',
    category: 'Financeiro',
    color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  },
  {
    label: 'Cobrança Cliente',
    category: 'Financeiro',
    color: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
  },
  {
    label: 'Cobrança Judicial',
    category: 'Financeiro',
    color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
  },
  {
    label: 'Negado Seguradora',
    category: 'Financeiro',
    color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  },
  {
    label: 'Outros',
    category: 'Financeiro',
    color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
  },
  {
    label: 'Repescagem',
    category: 'Financeiro',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
  },
]

export const getTagStyle = (label: string) => {
  const t = AVAILABLE_TAGS.find((x) => x.label === label)
  return t ? t.color : 'bg-gray-100 text-gray-800 border-gray-200'
}

export function CaseTags() {
  const { selectedClaim, updateClaim } = useKanbanStore()
  const [open, setOpen] = useState(false)

  const selectedTags = selectedClaim?.tags || []

  const toggleTag = (tagLabel: string) => {
    let newTags = []
    if (selectedTags.includes(tagLabel)) {
      newTags = selectedTags.filter((t) => t !== tagLabel)
    } else {
      newTags = [...selectedTags, tagLabel]
    }
    if (selectedClaim?.id) {
      updateClaim(selectedClaim.id.toString(), { tags: newTags })
    }
  }

  const groupedTags = AVAILABLE_TAGS.reduce(
    (acc, tag) => {
      if (!acc[tag.category]) acc[tag.category] = []
      acc[tag.category].push(tag)
      return acc
    },
    {} as Record<string, typeof AVAILABLE_TAGS>,
  )

  return (
    <div className="flex flex-col gap-2 mb-6 p-4 bg-gray-50/50 rounded-md border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <Tag className="w-4 h-4 text-gray-500" />
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Marcadores / Status Adicionais
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={cn(
              'px-2 py-0.5 text-[10px] font-semibold cursor-pointer shadow-sm transition-colors',
              getTagStyle(tag),
            )}
            onClick={() => toggleTag(tag)}
            title="Clique para remover"
          >
            {tag} <span className="ml-1 opacity-50 hover:opacity-100">×</span>
          </Badge>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] border-dashed border-gray-300 text-gray-500 hover:text-gray-800 bg-white"
            >
              <Plus className="w-3 h-3 mr-1" /> Adicionar Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar tag..." className="h-9 text-xs" />
              <CommandList>
                <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                {Object.entries(groupedTags).map(([category, tags]) => (
                  <CommandGroup key={category} heading={category}>
                    {tags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.label)
                      return (
                        <CommandItem
                          key={tag.label}
                          value={tag.label}
                          onSelect={() => toggleTag(tag.label)}
                          className="text-xs cursor-pointer"
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                              isSelected
                                ? 'bg-solved border-solved text-white'
                                : 'border-gray-300 opacity-50',
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          {tag.label}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
