import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Download,
  LayoutDashboard,
  List,
  User,
  AlertTriangle,
  Sparkles,
  Paperclip,
  CalendarDays,
  Filter,
  X,
  Check,
  Plus,
  Trash2,
} from 'lucide-react'
import { FilePreviewModal } from '@/components/FilePreviewModal'
import { AddClaimModal } from '@/components/AddClaimModal'
import { PasswordConfirmModal } from '@/components/PasswordConfirmModal'
import { getTagStyle, AVAILABLE_TAGS } from '@/components/CaseTags'
import useKanbanStore, { KanbanClaim } from '@/stores/useKanbanStore'
import useCaseStore from '@/stores/useCaseStore'
import { useToast } from '@/hooks/use-toast'

export const PIPELINE_STAGES = [
  'Caixa de Entrada',
  'Enriquecimento',
  'Atribuir',
  'Em análise',
  'Negociação',
  'Concluído',
  'Sem acordo',
  'Repescagem',
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]
import { useAuth } from '@/hooks/use-auth'
import useContactStore from '@/stores/useContactStore'
import { cn, formatRaDisplay } from '@/lib/utils'
import { KanbanList } from './KanbanList'

export function KanbanBoard() {
  const {
    claims,
    isSyncing,
    syncFromOdoo,
    analystFilter,
    setAnalystFilter,
    setSelectedClaim,
    moveClaim,
    searchQuery,
    setSearchQuery,
    tagFilters,
    setTagFilters,
    dateFilter,
    setDateFilter,
    viewMode,
    setViewMode,
  } = useKanbanStore()

  const {
    setRaNumber,
    setAnalystName,
    setPipelineStage,
    setInsuranceCompany,
    setCauserClaimNumber,
    setClientClaimNumber,
    userRole,
  } = useCaseStore()

  const { user } = useAuth()
  const { contacts } = useContactStore()
  const { toast } = useToast()

  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [claimToDelete, setClaimToDelete] = useState<string | null>(null)

  const topScrollRef = useRef<HTMLDivElement>(null)
  const boardScrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = useState(0)

  const isAdmin = userRole === 'Admin' || user?.email?.toLowerCase().includes('admin')

  const analysts = useMemo(() => {
    const list = new Set((claims || []).map((c) => c?.analyst?.toString() || 'Não Atribuído'))
    return Array.from(list).sort()
  }, [claims])

  useEffect(() => {
    if (!isAdmin && user) {
      const matchingContact = contacts.find(
        (c) => c.email?.toLowerCase() === user.email?.toLowerCase(),
      )
      const userName = matchingContact?.name || user.email?.split('@')[0] || ''
      const matchedAnalyst =
        analysts.find((a) => a.toLowerCase() === userName.toLowerCase()) || userName

      if (analystFilter !== matchedAnalyst) {
        setAnalystFilter(matchedAnalyst)
      }
    }
  }, [isAdmin, user, contacts, analysts, analystFilter, setAnalystFilter])

  const toggleTagFilter = (tag: string) => {
    if (tagFilters.includes(tag)) {
      setTagFilters(tagFilters.filter((t) => t !== tag))
    } else {
      setTagFilters([...tagFilters, tag])
    }
  }

  const groupedTags = useMemo(() => {
    return AVAILABLE_TAGS.reduce(
      (acc, tag) => {
        if (!acc[tag.category]) acc[tag.category] = []
        acc[tag.category].push(tag)
        return acc
      },
      {} as Record<string, typeof AVAILABLE_TAGS>,
    )
  }, [])

  const filteredClaims = useMemo(() => {
    return (claims || []).filter((c) => {
      if (analystFilter !== 'all' && c?.analyst !== analystFilter) return false

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchRA = c.raNumber?.toLowerCase().includes(q)
        const matchClient = c.companyName?.toLowerCase().includes(q)
        const matchPlaca =
          c.placaCausador?.toLowerCase().includes(q) || c.placaOnibus?.toLowerCase().includes(q)
        if (!matchRA && !matchClient && !matchPlaca) return false
      }

      if (tagFilters.length > 0) {
        if (!c.tags) return false
        const hasAllTags = tagFilters.every((t) => c.tags?.includes(t))
        if (!hasAllTags) return false
      }

      if (dateFilter !== 'all') {
        const created = new Date(c.createdAt || c.date)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 3600 * 24))

        if (dateFilter === '7days' && diffDays > 7) return false
        if (dateFilter === '15days' && diffDays > 15) return false
        if (dateFilter === '30days' && diffDays > 30) return false
        if (dateFilter === 'this_month') {
          if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear())
            return false
        }
      }

      return true
    })
  }, [claims, analystFilter, searchQuery, tagFilters, dateFilter])

  useEffect(() => {
    const measureWidth = () => {
      if (contentRef.current && viewMode === 'board') {
        setContentWidth(contentRef.current.scrollWidth)
      }
    }

    measureWidth()
    const timer = setTimeout(measureWidth, 100)

    window.addEventListener('resize', measureWidth)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', measureWidth)
    }
  }, [filteredClaims, viewMode])

  const handleTopScroll = () => {
    if (boardScrollRef.current && topScrollRef.current) {
      boardScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
  }

  const handleBoardScroll = () => {
    if (boardScrollRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = boardScrollRef.current.scrollLeft
    }
  }

  const handleCardClick = (claim: KanbanClaim) => {
    if (!claim) return
    setRaNumber(claim.raNumber?.toString() || '')
    setAnalystName(claim.analyst?.toString() || '')
    setPipelineStage(claim.stage)
    setInsuranceCompany(claim.insuranceCompany?.toString() || '')
    setCauserClaimNumber(claim.causerClaimNumber?.toString() || '')
    setClientClaimNumber(claim.clientClaimNumber?.toString() || '')
    setSelectedClaim(claim)
  }

  const handleDragStart = (e: React.DragEvent, claimId: string) => {
    if (claimId) {
      e.dataTransfer.setData('claimId', claimId.toString())
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault()
    const claimId = e.dataTransfer.getData('claimId')
    if (claimId) {
      if (stage === 'Concluído') {
        toast({
          title: 'Sinistro Concluído! ✅',
          description: 'Gerando Descrição de Serviços (DS) automaticamente e finalizando o caso.',
          className: 'bg-green-50 border-green-200 text-green-900',
          duration: 5000,
        })
      } else if (stage === 'Sem acordo') {
        toast({
          title: 'Sem Acordo ❌',
          description: 'Caso encerrado como Perdido. Relatório gerado e enviado ao cliente.',
          variant: 'destructive',
          duration: 5000,
        })
      }
      moveClaim(claimId, stage)
    }
  }

  const handleDeleteClaimConfirm = async () => {
    if (!claimToDelete) return
    const { error } = await supabase.from('claims').delete().eq('id', claimToDelete)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Lead excluído com sucesso.' })
      useKanbanStore.getState().refreshClaims()
    }
    setClaimToDelete(null)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden animate-in fade-in duration-300">
      <div className="bg-white border-b px-4 lg:px-6 py-4 flex flex-col xl:flex-row justify-between xl:items-center gap-4 shrink-0 shadow-sm z-10">
        <div className="flex-shrink-0 flex items-center justify-between xl:justify-start gap-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              {viewMode === 'board' ? (
                <LayoutDashboard className="w-5 h-5 text-solved" />
              ) : (
                <List className="w-5 h-5 text-solved" />
              )}
              {viewMode === 'board' ? 'Kanban de Sinistros' : 'Lista de Sinistros'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestão visual de cobranças importadas do Odoo.
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                'px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-all',
                viewMode === 'board'
                  ? 'bg-white shadow-sm text-solved border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50',
              )}
              title="Visualização em Quadro (Kanban)"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Quadro</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-all',
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-solved border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50',
              )}
              title="Visualização em Lista (Tabela)"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 hidden sm:block" />
            <Select value={analystFilter} onValueChange={setAnalystFilter} disabled={!isAdmin}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-white shadow-sm border-gray-300">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && <SelectItem value="all">Todos os Analistas</SelectItem>}
                {analysts.map((a) => (
                  <SelectItem key={a?.toString()} value={a?.toString()}>
                    {a?.toString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs bg-white shadow-sm gap-1.5 border-gray-300"
              >
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span className="hidden sm:inline">Tags</span>
                {tagFilters.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1 h-4 text-[10px] bg-solved/10 text-solved border-none"
                  >
                    {tagFilters.length}
                  </Badge>
                )}
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
                        const isSelected = tagFilters.includes(tag.label)
                        return (
                          <CommandItem
                            key={tag.label}
                            value={tag.label}
                            onSelect={() => toggleTagFilter(tag.label)}
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

          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400 hidden sm:block" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-white shadow-sm border-gray-300">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="15days">Últimos 15 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="this_month">Este Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery ||
            tagFilters.length > 0 ||
            dateFilter !== 'all' ||
            (isAdmin && analystFilter !== 'all')) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setTagFilters([])
                setDateFilter('all')
                if (isAdmin) setAnalystFilter('all')
              }}
              className="h-8 text-xs text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Limpar
            </Button>
          )}

          <div className="flex-1"></div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="h-8 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 gap-1.5 shadow-sm font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </Button>
          <Button
            onClick={syncFromOdoo}
            disabled={isSyncing}
            size="sm"
            className="h-8 bg-solved hover:bg-solved-dark text-white gap-2 shadow-sm font-semibold"
          >
            {isSyncing ? (
              <span className="animate-spin mr-1">⏳</span>
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <>
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto overflow-y-hidden w-full bg-gray-200/60 border-b border-gray-300 shrink-0"
          >
            <div style={{ width: contentWidth, height: '1px' }} />
          </div>

          <div
            ref={boardScrollRef}
            onScroll={handleBoardScroll}
            className="flex-1 overflow-x-auto overflow-y-hidden p-4 lg:p-6 bg-gray-100"
          >
            <div
              ref={contentRef}
              className="flex h-full gap-4 items-start"
              style={{ width: 'max-content' }}
            >
              {PIPELINE_STAGES.map((stage) => {
                const stageClaims = filteredClaims.filter((c) => c?.stage === stage)
                return (
                  <div
                    key={stage}
                    className="w-[300px] flex flex-col h-full bg-gray-200/50 rounded-lg border border-gray-200 shrink-0"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage)}
                  >
                    <div className="px-3 py-3 border-b border-gray-200 bg-gray-100 rounded-t-lg flex items-center justify-between shrink-0">
                      <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
                        {stage}
                      </h3>
                      <Badge variant="secondary" className="bg-white border-gray-300 text-gray-700">
                        {stageClaims.length}
                      </Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                      {stageClaims.map((claim) => {
                        if (!claim?.id) return null

                        const createdDate = claim.createdAt
                          ? new Date(claim.createdAt)
                          : new Date(claim.date || new Date())
                        const daysOpen = Math.floor(
                          (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24),
                        )

                        const accidentDate = new Date(
                          claim.rawDate || claim.date || claim.createdAt || new Date(),
                        )
                        const prescDate = new Date(accidentDate)
                        prescDate.setFullYear(prescDate.getFullYear() + 3)
                        const daysToPresc = Math.floor(
                          (prescDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24),
                        )

                        const { ra, cnpj } = formatRaDisplay(claim.raNumber, claim.companyCnpj)

                        return (
                          <div
                            key={claim.id.toString()}
                            draggable
                            onDragStart={(e) => handleDragStart(e, claim.id.toString())}
                            onClick={() => handleCardClick(claim)}
                            className={`bg-white p-4 rounded-lg border shadow-sm cursor-pointer transition-all active:cursor-grabbing group animate-in slide-in-from-bottom-2 fade-in ${
                              claim.hasPositiveInteraction
                                ? 'border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)] hover:border-green-500 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)]'
                                : 'border-gray-200 hover:border-solved/50 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3 border-b border-gray-100 pb-2">
                              <div className="flex flex-col items-start gap-0.5">
                                <Badge
                                  className={`border-none font-mono text-[10px] px-1.5 h-4 mb-1 ${claim.hasPositiveInteraction ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-700 group-hover:bg-blue-100'}`}
                                >
                                  {ra}
                                </Badge>
                                {cnpj && (
                                  <span className="text-[9px] text-gray-400 font-medium">
                                    CNPJ: {cnpj}
                                  </span>
                                )}
                                <span className="text-[9px] text-gray-500 font-medium flex items-center gap-1 mt-1">
                                  <CalendarDays className="w-2.5 h-2.5 text-gray-400" />
                                  {createdDate.toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex flex-col items-end gap-1 relative">
                                <span
                                  className={cn(
                                    'text-[9px] font-bold px-1.5 py-0.5 rounded-sm border shadow-sm',
                                    daysOpen > 30
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : daysOpen > 15
                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                        : 'bg-green-50 text-green-700 border-green-200',
                                  )}
                                  title={`Processo aberto há ${daysOpen} dias`}
                                >
                                  {daysOpen} {daysOpen === 1 ? 'dia' : 'dias'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-gray-400 hover:text-red-600 hover:bg-red-50 absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setClaimToDelete(claim.id.toString())
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            <h4
                              className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2"
                              title={claim.companyName?.toString() || 'Desconhecido'}
                            >
                              {claim.companyName?.toString() || 'Desconhecido'}
                            </h4>

                            {daysToPresc <= 30 && daysToPresc >= 0 && (
                              <div className="flex items-center gap-1.5 text-[10px] text-red-700 bg-red-50 p-1.5 rounded border border-red-200 mb-2 font-semibold shadow-sm">
                                <AlertTriangle className="w-3 h-3 shrink-0 animate-pulse text-red-600" />
                                ATENÇÃO: Prescreve em {daysToPresc}{' '}
                                {daysToPresc === 1 ? 'dia' : 'dias'}
                              </div>
                            )}

                            {daysToPresc < 0 && (
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-700 bg-gray-200 p-1.5 rounded border border-gray-300 mb-2 font-semibold shadow-sm">
                                <AlertTriangle className="w-3 h-3 shrink-0 text-gray-600" />
                                PRESCRITO HÁ {Math.abs(daysToPresc)} DIAS (Lei SUSEP)
                              </div>
                            )}

                            {claim.tags && claim.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {claim.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className={cn(
                                      'text-[9px] px-1.5 h-4 border-none shadow-sm font-semibold',
                                      getTagStyle(tag),
                                    )}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {claim.tags.length > 3 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 h-4 bg-gray-100 text-gray-500 border-none shadow-sm font-semibold"
                                  >
                                    +{claim.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {claim.hasPositiveInteraction && (
                              <div className="flex items-center gap-1.5 text-[10px] text-green-700 bg-green-50 p-1.5 rounded border border-green-200 mb-2 font-semibold shadow-sm">
                                <Sparkles className="w-3 h-3 shrink-0 animate-pulse text-green-600" />{' '}
                                Resposta Positiva Detectada!
                              </div>
                            )}

                            {claim.attachments && claim.attachments.length > 0 && (
                              <div
                                className="flex items-center gap-1.5 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded border border-blue-200 mb-2 font-semibold shadow-sm transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPreviewFile({
                                    url: claim.attachments![0].url,
                                    name: claim.attachments![0].file_name || 'Documento',
                                    type: claim.attachments![0].file_type || 'file',
                                  })
                                }}
                                title="Visualizar documento"
                              >
                                <Paperclip className="w-3 h-3 shrink-0 text-blue-600" />
                                {claim.attachments.length} Anexo(s) Recebido(s)
                              </div>
                            )}

                            <p className="text-xs text-gray-600 mb-3 flex items-center gap-1.5 bg-gray-50 w-fit px-2 py-0.5 rounded border border-gray-100 font-medium">
                              <User className="w-3 h-3 text-gray-400" />{' '}
                              {claim.analyst?.toString() || 'Não Atribuído'}
                            </p>

                            {(!claim.placaCausador || !claim.dinamicaAcidente) && (
                              <div className="flex items-center gap-1.5 text-[10px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100 mb-2 font-semibold">
                                <AlertTriangle className="w-3 h-3 shrink-0" /> Dados API Pendentes
                              </div>
                            )}

                            <div className="pt-2 border-t border-gray-100 mt-2">
                              <div className="text-[10px] text-gray-500 font-medium flex justify-between items-center">
                                <span>Placa Causador:</span>
                                {claim.placaCausador ? (
                                  <Badge
                                    variant="outline"
                                    className="h-4 px-1.5 text-[9px] bg-white"
                                  >
                                    {claim.placaCausador.toString()}
                                  </Badge>
                                ) : (
                                  <span className="text-red-500 font-bold">N/A</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {stageClaims.length === 0 && (
                        <div className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs font-medium bg-gray-50/50">
                          Mover card para cá
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-hidden p-4 lg:p-6 bg-gray-100 flex flex-col">
          <KanbanList claims={filteredClaims} onCardClick={handleCardClick} />
        </div>
      )}

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || null}
        fileName={previewFile?.name || ''}
        fileType={previewFile?.type || ''}
      />
      <AddClaimModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <PasswordConfirmModal
        isOpen={!!claimToDelete}
        onClose={() => setClaimToDelete(null)}
        onConfirm={handleDeleteClaimConfirm}
        title="Excluir Lead"
        description="Esta ação é irreversível e removerá o lead e todos os seus anexos. Por favor, confirme sua senha para autorizar."
      />
    </div>
  )
}
