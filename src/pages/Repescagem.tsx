import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useToast } from '@/hooks/use-toast'
import { Search, MessageCircle, Loader2, Filter, AlertCircle, Paperclip } from 'lucide-react'
import { ContactPreviewPopover } from '@/components/ContactPreviewPopover'
import { FilePreviewModal } from '@/components/FilePreviewModal'
import useContactStore from '@/stores/useContactStore'
import { fetchClaimsPaginated, enrichClaims, Claim } from '@/services/claims'

export default function Repescagem() {
  const { toast } = useToast()
  const { contacts } = useContactStore()
  const [claims, setClaims] = useState<Claim[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)

  const pageSize = 15
  const totalPages = Math.ceil(totalCount / pageSize)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data, count, error } = await fetchClaimsPaginated(filter, page, pageSize)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      setClaims((data as Claim[]) || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [filter, page, pageSize, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [filter])

  const handleEnrich = async (ids: string[]) => {
    if (!ids.length) return
    setClaims((c) => c.map((x) => (ids.includes(x.id) ? { ...x, status: 'loading' } : x)))
    await enrichClaims(ids)
    toast({
      title: 'Concluído',
      description: `Pesquisa finalizada para ${ids.length} registro(s).`,
    })
    setSelectedIds([])
    loadData()
  }

  const allSelected = claims.length > 0 && selectedIds.length === claims.length

  const getContactName = (id: string | null) => {
    if (!id) return '-'
    const contact = contacts.find((c) => c.id === id)
    return contact ? contact.name : id
  }

  const getAnalystName = (id: string | null) => {
    if (!id) return '-'
    const contact = contacts.find((c) => c.id === id && c.category === 'Colaborador Analista')
    return contact ? contact.name : '-'
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-3">
            Importação e Repescagem
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {totalCount} Processos
            </Badge>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Fases</SelectItem>
                <SelectItem value="Sem acordo">Sem Acordo</SelectItem>
                <SelectItem value="Repescagem">Repescagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => handleEnrich(selectedIds)}
            disabled={selectedIds.length === 0}
            className="h-9 gap-2"
          >
            <Search className="w-4 h-4" /> Pesquisa em Massa ({selectedIds.length})
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 relative">
        {loading && !claims.length ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <AlertCircle className="w-10 h-10" />
          </div>
        ) : (
          <div className="bg-white rounded-md border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 uppercase text-[11px] font-semibold text-gray-500">
                  <TableHead className="w-[40px] pl-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(c) => setSelectedIds(c ? claims.map((x) => x.id) : [])}
                    />
                  </TableHead>
                  <TableHead>RA / ID</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Cliente / Causador</TableHead>
                  <TableHead>Analista</TableHead>
                  <TableHead>Seguradora</TableHead>
                  <TableHead>Status & Mídia</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right pr-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedIds.includes(claim.id)}
                        onCheckedChange={(c) =>
                          setSelectedIds((p) =>
                            c ? [...p, claim.id] : p.filter((id) => id !== claim.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{claim.ra}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{claim.stage}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold">
                        <ContactPreviewPopover
                          contactId={claim.client_id || ''}
                          name={getContactName(claim.client_id)}
                          category="Cliente"
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        <ContactPreviewPopover
                          contactId={`causer-${claim.id}`}
                          name={claim.causer_name || '-'}
                          category="Causador"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getAnalystName(claim.analyst_id)}</TableCell>
                    <TableCell className="text-sm">{getContactName(claim.insurance_id)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 items-start">
                        {claim.status === 'pending' && <Badge variant="secondary">Pendente</Badge>}
                        {claim.status === 'loading' && (
                          <Badge variant="secondary">
                            <Loader2 className="w-3 h-3 animate-spin mr-1" /> Processando
                          </Badge>
                        )}
                        {claim.status === 'enriched' && (
                          <Badge className="bg-green-100 text-green-800 border-none">
                            ATUALIZADO
                          </Badge>
                        )}
                        {claim.attachments && claim.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {claim.attachments.map((att) => (
                              <Button
                                key={att.id}
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2 py-0 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                                onClick={() =>
                                  setPreviewFile({
                                    url: att.url || '',
                                    name: att.file_name,
                                    type: att.file_type,
                                  })
                                }
                              >
                                <Paperclip className="w-3 h-3 mr-1" />
                                {att.file_name}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(claim.date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEnrich([claim.id])}
                          disabled={claim.status !== 'pending'}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0 bg-[#25D366] text-white"
                          disabled={claim.status !== 'enriched'}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="py-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm px-4">
                        Página {page} de {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={
                          page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || null}
        fileName={previewFile?.name || ''}
        fileType={previewFile?.type || ''}
      />
    </div>
  )
}
