import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase/client'
import { Inbox, Loader2, RefreshCw, FileText, ScanText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PasswordConfirmModal } from '@/components/PasswordConfirmModal'
import { LeadDocumentsDialog } from '@/components/LeadDocumentsDialog'
import { parseDocumentosAnexados } from '@/lib/document-utils'
import {
  extractOcrForLead,
  processBatchWithOcr,
  BatchProgress,
  PROCESSING_STEPS,
} from '@/services/intake'

export const PIPELINE_STAGES = ['Caixa de Entrada', 'Enriquecimento', 'Análise', 'Concluído']

export default function IntakeDashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null)
  const [ocrProcessingId, setOcrProcessingId] = useState<string | null>(null)
  const [docsDialogLead, setDocsDialogLead] = useState<any | null>(null)

  const pendingLeads = leads.filter((l) => l.status_processamento === 'AGUARDANDO PROCESSAMENTO')
  const pendingCount = pendingLeads.length

  const fetchLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('caixa_entrada')
      .select('*')
      .order('data_criacao', { ascending: false })
      .limit(3000)
    if (!error && data) setLeads(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchLeads()
    const subscription = supabase
      .channel('caixa_entrada_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caixa_entrada' }, fetchLeads)
      .subscribe()
    return () => subscription.unsubscribe()
  }, [])

  const handleSingleOcr = async (lead: any) => {
    const docs = parseDocumentosAnexados(lead.documentos_anexados)
    if (docs.length === 0) {
      toast({
        title: 'Sem documentos',
        description: 'Este lead não possui documentos anexados para OCR.',
        variant: 'destructive',
      })
      return
    }
    setOcrProcessingId(lead.id_ra)
    try {
      await extractOcrForLead(lead)
      toast({
        title: 'OCR Concluído',
        description: `Dados extraídos do documento e salvos para ${lead.id_ra}.`,
        className: 'bg-green-50 border-green-200 text-green-900',
      })
      fetchLeads()
    } catch (e: any) {
      toast({ title: 'Erro no OCR', description: e.message, variant: 'destructive' })
    } finally {
      setOcrProcessingId(null)
    }
  }

  const handleBatchProcess = async () => {
    setIsProcessingBatch(true)
    setBatchProgress({ processed: 0, total: pendingCount, currentRa: '', phase: 'Iniciando' })
    const { data: clientsDb } = await supabase.from('clients').select('id, "RAZÃO SOCIAL"')
    try {
      await processBatchWithOcr(pendingLeads, clientsDb, (p) => setBatchProgress(p))
      toast({
        title: 'Processamento Concluído',
        description: `${pendingCount} leads processados via OCR, enriquecidos e transferidos.`,
        className: 'bg-green-50 border-green-200 text-green-900',
      })
    } catch (e: any) {
      toast({ title: 'Erro no processamento', description: e.message, variant: 'destructive' })
    } finally {
      setIsProcessingBatch(false)
      setBatchProgress(null)
      fetchLeads()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-solved" /> RAs Recebidos (Caixa de Entrada)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Extração OCR de documentos, enriquecimento e transferência para o Kanban.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Button
              onClick={() => setIsPasswordModalOpen(true)}
              disabled={isProcessingBatch}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              {isProcessingBatch ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ScanText className="w-4 h-4" />
              )}
              Processar {pendingCount} Leads (OCR + IA)
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeads}
            disabled={loading || isProcessingBatch}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {isProcessingBatch && batchProgress && (
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-medium text-indigo-900">
            <span>
              {batchProgress.phase}
              {batchProgress.currentRa ? `: ${batchProgress.currentRa}` : ''}
            </span>
            <span>
              {batchProgress.processed} de {batchProgress.total}
            </span>
          </div>
          <Progress value={(batchProgress.processed / batchProgress.total) * 100} className="h-2" />
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {PROCESSING_STEPS.map((step) => {
              const isCurrent = batchProgress.step === step.id
              const isDone = batchProgress.step !== undefined && batchProgress.step > step.id
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-1 text-[10px] font-medium ${isCurrent ? 'text-indigo-900' : isDone ? 'text-green-600' : 'text-indigo-300'}`}
                  title={step.description}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${isCurrent ? 'bg-indigo-600 text-white' : isDone ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-400'}`}
                  >
                    {isDone ? '✓' : step.id}
                  </span>
                  {step.name}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-white border-b pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              Lista de Leads Transferidos
              <Badge variant="secondary" className="ml-2 font-normal">
                Total: {leads.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Visualização unificada com documentos anexados e extração OCR.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="whitespace-nowrap font-semibold">ID / RA</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Cliente</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Placa Ônibus</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Nome Causador</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Data Acidente</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-center">
                      Docs
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-center">
                      Status
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-center">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">Buscando leads...</p>
                      </TableCell>
                    </TableRow>
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <Inbox className="w-10 h-10 text-gray-300 mb-2" />
                          <p>Nenhum lead encontrado. Inicie uma transferência em Integrações.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => {
                      const docs = parseDocumentosAnexados(lead.documentos_anexados)
                      return (
                        <TableRow key={lead.id_ra} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">{lead.id_ra}</TableCell>
                          <TableCell
                            className="text-gray-600 max-w-[200px] truncate"
                            title={lead.cliente_nome}
                          >
                            {lead.cliente_nome || '-'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {lead.placa_onibus || '-'}
                          </TableCell>
                          <TableCell
                            className="text-gray-600 max-w-[200px] truncate"
                            title={lead.causador_nome}
                          >
                            {lead.causador_nome || '-'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {lead.data_acidente
                              ? new Date(lead.data_acidente).toLocaleDateString('pt-BR', {
                                  timeZone: 'UTC',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 px-2"
                              disabled={docs.length === 0}
                              onClick={() => setDocsDialogLead(lead)}
                            >
                              <FileText className="w-4 h-4 text-gray-500" />
                              <Badge variant="secondary" className="text-xs">
                                {docs.length}
                              </Badge>
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                lead.status_processamento === 'AGUARDANDO PROCESSAMENTO'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className={
                                lead.status_processamento === 'AGUARDANDO PROCESSAMENTO'
                                  ? 'bg-amber-500 hover:bg-amber-600 shadow-sm border-transparent text-white'
                                  : lead.status_processamento === 'ENRIQUECIDO'
                                    ? 'bg-green-500 hover:bg-green-600 shadow-sm border-transparent text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                              }
                            >
                              {lead.status_processamento || 'PENDENTE'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              disabled={ocrProcessingId === lead.id_ra || docs.length === 0}
                              onClick={() => handleSingleOcr(lead)}
                            >
                              {ocrProcessingId === lead.id_ra ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ScanText className="w-3.5 h-3.5" />
                              )}
                              OCR
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <PasswordConfirmModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handleBatchProcess}
        title="Autorizar Processamento (OCR + IA)"
        description={`Você está prestes a processar ${pendingCount} leads via OCR e enriquecimento. Confirme sua senha para iniciar.`}
      />

      <LeadDocumentsDialog
        isOpen={!!docsDialogLead}
        onClose={() => setDocsDialogLead(null)}
        documentosAnexados={docsDialogLead?.documentos_anexados}
        leadId={docsDialogLead?.id_ra || ''}
      />
    </div>
  )
}
