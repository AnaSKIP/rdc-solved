import { useState } from 'react'
import {
  Inbox,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Building2,
  Database,
  Sparkles,
  Phone,
  ArrowRight,
  AlertTriangle,
  Eraser,
  CheckSquare,
  Eye,
  FileSearch,
  ShieldCheck,
  Zap,
  MapPin,
  DatabaseZap,
  Play,
  FileCheck,
  AlertCircle,
} from 'lucide-react'
import { runETL, type ETLReport } from '@/services/etl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import useIntakeStore, { IntakeRA, ProcessStatus } from '@/stores/useIntakeStore'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const StatusBadge = ({
  status,
  validationStatus,
}: {
  status: ProcessStatus
  validationStatus: string
}) => {
  if (status === 'pending') {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        Aguardando OCR
      </Badge>
    )
  }
  if (status === 'extracting') {
    return (
      <Badge variant="secondary" className="bg-blue-50 text-blue-700 animate-pulse">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Lendo Documentos
      </Badge>
    )
  }
  if (status === 'validating') {
    return (
      <Badge variant="secondary" className="bg-amber-50 text-amber-700 animate-pulse">
        <FileSearch className="w-3 h-3 mr-1 animate-spin" /> IA Validando
      </Badge>
    )
  }
  if (status === 'enriching_sci' || status === 'enriching_infocar') {
    return (
      <Badge variant="secondary" className="bg-purple-50 text-purple-700 animate-pulse">
        <Database className="w-3 h-3 mr-1" /> API Enriquecendo
      </Badge>
    )
  }
  if (validationStatus === 'AGUARDANDO REVISÃO') {
    return (
      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200 shadow-none">
        <AlertTriangle className="w-3 h-3 mr-1" /> Revisão Manual
      </Badge>
    )
  }
  if (validationStatus === 'PRONTO PARA DISTRIBUIÇÃO') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 shadow-none">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Pronto p/ Kanban
      </Badge>
    )
  }
  return <Badge variant="outline">{validationStatus}</Badge>
}

const getProgressForStatus = (status: ProcessStatus) => {
  switch (status) {
    case 'pending':
      return 0
    case 'extracting':
      return 20
    case 'validating':
      return 40
    case 'enriching_sci':
      return 60
    case 'enriching_infocar':
      return 80
    case 'completed':
      return 100
  }
}

export default function IntakeDashboard() {
  const { ras, isSyncing, syncSources, processRA, resolveConsistency, distributeRA } =
    useIntakeStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('lotes')
  const [selectedRA, setSelectedRA] = useState<IntakeRA | null>(null)

  const [isETLRunning, setIsETLRunning] = useState(false)
  const [etlProgress, setEtlProgress] = useState('')
  const [etlReport, setEtlReport] = useState<ETLReport | null>(null)

  const handleRunETL = async () => {
    setIsETLRunning(true)
    setEtlReport(null)
    try {
      const report = await runETL(setEtlProgress)
      setEtlReport(report)
      toast({
        title: 'ETL Concluído',
        description: `Foram processados ${report.totalProcessed} registros.`,
      })
    } catch (e: any) {
      toast({ title: 'Erro no ETL', description: e.message, variant: 'destructive' })
    } finally {
      setIsETLRunning(false)
      setEtlProgress('')
    }
  }

  const processAllPending = () => {
    ras.filter((r) => r.status === 'pending').forEach((r) => processRA(r.id))
    toast({
      title: 'Processamento em Lote',
      description:
        'Iniciando leitura OCR, extração de IA e validação de conformidade para todos os RAs pendentes.',
      className: 'bg-blue-50 text-blue-900 border-blue-200',
    })
  }

  const handleDistributeAll = () => {
    const readyRAs = ras.filter((r) => r.validationStatus === 'PRONTO PARA DISTRIBUIÇÃO')
    if (readyRAs.length === 0) {
      toast({
        title: 'Nenhum RA pronto',
        description: 'Resolva as inconsistências primeiro.',
        variant: 'destructive',
      })
      return
    }
    readyRAs.forEach((ra) => distributeRA(ra.id))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sticky top-0 z-20 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-solved" /> Caixa de Entrada & Conformidade (IA)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Recepção do Odoo, limpeza de dados mockados, validação e distribuição inteligente.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={syncSources}
            disabled={isSyncing}
            variant="outline"
            className="bg-white hover:bg-gray-50 text-gray-700 gap-2 shadow-sm border-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar Odoo
          </Button>
          <Button
            onClick={processAllPending}
            variant="secondary"
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 shadow-sm gap-2"
          >
            <Zap className="w-4 h-4" /> Processar IA
          </Button>
          <Button
            onClick={handleDistributeAll}
            className="bg-solved hover:bg-solved-dark text-white gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Distribuir Prontos
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="lotes">RAs Recebidos</TabsTrigger>
              <TabsTrigger value="fontes">Integrações</TabsTrigger>
            </TabsList>

            <TabsContent value="lotes" className="space-y-4 outline-none">
              {ras.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white border border-dashed rounded-lg">
                  <Inbox className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p>Nenhum RA pendente de processamento.</p>
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  className="space-y-4"
                  defaultValue={ras.map((r) => r.id)}
                >
                  {ras.map((ra) => (
                    <AccordionItem
                      key={ra.id}
                      value={ra.id}
                      className="bg-white border rounded-lg shadow-sm px-2 overflow-hidden"
                    >
                      <AccordionTrigger className="hover:no-underline px-4 py-4">
                        <div className="flex flex-1 items-center justify-between pr-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-100 rounded-md text-slate-700 border border-slate-200">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left flex flex-col">
                              <span className="font-semibold text-gray-900 flex items-center gap-2">
                                {ra.raNumber}
                                {ra.cleanedMockData.length > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200"
                                  >
                                    <Eraser className="w-3 h-3 mr-1" /> Dados Limpos
                                  </Badge>
                                )}
                              </span>
                              <span className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                <Building2 className="w-3 h-3" /> {ra.clientName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <ImageIcon className="w-4 h-4" />
                              <span>{ra.documents.length} Anexos</span>
                            </div>
                            <StatusBadge
                              status={ra.status}
                              validationStatus={ra.validationStatus}
                            />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
                        <div className="mb-6 mt-2 px-2">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-2 px-1">
                            <span>Ingestão</span>
                            <span>OCR (IA)</span>
                            <span>Conformidade (IA)</span>
                            <span>APIs</span>
                            <span className="text-green-600">Pronto</span>
                          </div>
                          <Progress
                            value={getProgressForStatus(ra.status)}
                            className="h-2 bg-gray-200"
                          />
                        </div>

                        <div className="space-y-4">
                          {ra.cleanedMockData.length > 0 && (
                            <div className="bg-green-50/50 border border-green-100 rounded-md p-3">
                              <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4" /> Higienização do Odoo
                                (Automática)
                              </h4>
                              <ul className="text-xs text-green-700 space-y-1 list-disc pl-4">
                                {ra.cleanedMockData.map((msg, i) => (
                                  <li key={i}>{msg}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {ra.status === 'completed' && ra.consistencyChecks.length > 0 && (
                            <div className="bg-white border rounded-md p-4 shadow-sm">
                              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-indigo-600" /> Relatório de
                                Conformidade (IA)
                              </h4>
                              <div className="space-y-3">
                                {ra.consistencyChecks.map((chk) => (
                                  <div
                                    key={chk.id}
                                    className={cn(
                                      'p-3 rounded border text-sm flex flex-col md:flex-row md:items-center justify-between gap-3',
                                      {
                                        'bg-orange-50 border-orange-200':
                                          chk.status === 'INCONSISTENTE' ||
                                          chk.status === 'CONFLITO',
                                        'bg-green-50 border-green-200':
                                          chk.status === 'CONSISTENTE' ||
                                          chk.status === 'CONFIRMADO',
                                        'bg-blue-50 border-blue-200': chk.status === 'NOVO',
                                      },
                                    )}
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900">{chk.field}</p>
                                      <div className="flex gap-4 mt-1 text-xs text-gray-600">
                                        {chk.values.map((v, i) => (
                                          <span key={i}>
                                            <strong className="text-gray-500">
                                              {chk.sources[i]}:
                                            </strong>{' '}
                                            {v || '[Vazio]'}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <Badge
                                        variant="outline"
                                        className={cn('bg-white', {
                                          'text-orange-700 border-orange-300':
                                            chk.status === 'INCONSISTENTE',
                                          'text-green-700 border-green-300':
                                            chk.status === 'CONSISTENTE' ||
                                            chk.status === 'CONFIRMADO',
                                          'text-blue-700 border-blue-300': chk.status === 'NOVO',
                                        })}
                                      >
                                        {chk.status}
                                      </Badge>

                                      {chk.status === 'INCONSISTENTE' && (
                                        <div className="flex gap-2">
                                          {chk.values.map((v, i) =>
                                            v ? (
                                              <Button
                                                key={i}
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs bg-white hover:bg-orange-100 border-orange-300"
                                                onClick={() => resolveConsistency(ra.id, chk.id, v)}
                                              >
                                                Usar "{v}"
                                              </Button>
                                            ) : null,
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white border-gray-300 text-solved hover:bg-blue-50 hover:text-solved-dark hover:border-blue-200 transition-colors gap-2 shadow-sm"
                              disabled={ra.status !== 'completed'}
                              onClick={() => setSelectedRA(ra)}
                            >
                              Ver Documentos & Dados <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                            {ra.validationStatus === 'PRONTO PARA DISTRIBUIÇÃO' && (
                              <Button
                                size="sm"
                                className="bg-solved text-white hover:bg-solved-dark"
                                onClick={() => distributeRA(ra.id)}
                              >
                                Distribuir
                              </Button>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="fontes" className="outline-none space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-indigo-500" /> Odoo (API Sync)
                    </CardTitle>
                    <CardDescription>Busca automática de RAs e anexos a cada 15min</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md border border-green-200 flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Conectado via RPC
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-blue-200">
                  <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                      <DatabaseZap className="w-5 h-5 text-blue-600" /> Motor ETL (Importação)
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Transferência de RAs "REPESCAGEM" e "SEM ACORDO" da origem para a Caixa de
                      Entrada.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {!isETLRunning && !etlReport && (
                      <>
                        <p className="text-sm text-gray-600">
                          Limpa e normaliza CPF, CNPJ, telefones, placas e datas automaticamente
                          antes de carregar no Intake.
                        </p>
                        <Button
                          onClick={handleRunETL}
                          className="w-full bg-blue-600 hover:bg-blue-700 gap-2 shadow-sm"
                        >
                          <Play className="w-4 h-4 fill-current" /> Iniciar Processamento ETL
                        </Button>
                      </>
                    )}

                    {isETLRunning && (
                      <div className="space-y-3 bg-blue-50 p-4 rounded-md border border-blue-100">
                        <div className="flex items-center gap-3 text-blue-800">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="font-medium text-sm">ETL em execução...</span>
                        </div>
                        <p className="text-xs text-blue-600 font-mono bg-white p-2 rounded border border-blue-100">
                          {etlProgress}
                        </p>
                      </div>
                    )}

                    {etlReport && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2 text-green-800 font-medium">
                            <FileCheck className="w-5 h-5 text-green-600" />
                            Relatório ETL
                          </div>
                          <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">
                            {etlReport.successRate.toFixed(1)}% Sucesso
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 bg-gray-50 rounded border text-gray-600 text-center">
                            <p className="text-xs uppercase font-semibold">Processados</p>
                            <p className="text-lg font-bold text-gray-900">
                              {etlReport.totalProcessed}
                            </p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded border text-gray-600 text-center">
                            <p className="text-xs uppercase font-semibold">Sucesso</p>
                            <p className="text-lg font-bold text-green-600">
                              {etlReport.totalSuccess}
                            </p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded border text-gray-600 text-center">
                            <p className="text-xs uppercase font-semibold">Erros</p>
                            <p className="text-lg font-bold text-red-600">
                              {etlReport.totalErrors}
                            </p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded border text-gray-600 text-center">
                            <p className="text-xs uppercase font-semibold">Tempo</p>
                            <p className="text-lg font-bold text-gray-900">
                              {etlReport.executionTime}
                            </p>
                          </div>
                        </div>

                        {etlReport.totalErrors > 0 && (
                          <div className="mt-4 border border-red-200 rounded-md overflow-hidden">
                            <div className="bg-red-50 p-2 text-xs font-semibold text-red-800 border-b border-red-100 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" /> Erros Encontrados
                            </div>
                            <div className="max-h-32 overflow-auto bg-white p-2 space-y-2">
                              {etlReport.errorsList.map((err, i) => (
                                <div key={i} className="text-xs">
                                  <span className="font-semibold text-gray-700">{err.ra}</span>:
                                  <span className="text-red-600 ml-1">[{err.type}]</span>{' '}
                                  {err.details}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => setEtlReport(null)}
                          className="w-full mt-2"
                        >
                          Limpar Relatório
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Sheet open={!!selectedRA} onOpenChange={(open) => !open && setSelectedRA(null)}>
        <SheetContent
          className="w-full sm:max-w-2xl overflow-y-auto bg-gray-50 p-0 border-l-0"
          side="right"
        >
          {selectedRA && (
            <>
              <div className="p-6 bg-white border-b sticky top-0 z-10 shadow-sm">
                <SheetHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      className={cn('px-2 py-0.5 shadow-sm', {
                        'bg-green-600 hover:bg-green-700':
                          selectedRA.validationStatus === 'PRONTO PARA DISTRIBUIÇÃO',
                        'bg-orange-500 hover:bg-orange-600':
                          selectedRA.validationStatus === 'AGUARDANDO REVISÃO',
                      })}
                    >
                      {selectedRA.validationStatus}
                    </Badge>
                  </div>
                  <SheetTitle className="text-xl text-gray-900 leading-tight">
                    {selectedRA.raNumber}
                  </SheetTitle>
                  <SheetDescription className="flex flex-col gap-1 mt-2">
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <Building2 className="w-4 h-4" /> <strong>{selectedRA.clientName}</strong>{' '}
                      (CNPJ: {selectedRA.cnpj})
                    </span>
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-slate-600" />
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                      Galeria de Documentos Anexados
                    </h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedRA.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-md overflow-hidden group hover:border-blue-300 transition-colors cursor-pointer bg-gray-50"
                      >
                        <div className="h-32 bg-gray-100 relative">
                          <img
                            src={doc.thumbnailUrl}
                            alt={doc.fileName}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                        <div className="p-2 text-xs border-t border-gray-200 bg-white">
                          <p className="font-medium text-gray-800 truncate" title={doc.fileName}>
                            {doc.fileName}
                          </p>
                          <p className="text-gray-500 mt-1 uppercase">{doc.fileType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-indigo-50/80 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wider">
                        Dados Extraídos (IA + APIs)
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                          Causador Identificado
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedRA.causerName || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                          Veículo Envolvido
                        </p>
                        <div className="flex items-center gap-2">
                          {selectedRA.plate && (
                            <Badge variant="outline" className="bg-gray-50">
                              {selectedRA.plate}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-600 font-medium">
                            {selectedRA.marcaModelo || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedRA.dinamica && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Dinâmica Extraída
                        </p>
                        <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded border border-gray-100">
                          "{selectedRA.dinamica}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                          Endereço (Enriquecido SCI)
                        </p>
                        <p className="text-sm text-gray-800">{selectedRA.causerAddress || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                      <Database className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div className="space-y-3 w-full">
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                            Retorno Infocar{' '}
                            <Badge className="h-3 px-1 text-[8px] bg-indigo-100 text-indigo-700">
                              API
                            </Badge>
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                            {selectedRA.infocarData || 'Aguardando processamento...'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-[#f0fdf4] p-3 rounded-lg border border-[#bbf7d0] mt-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#25D366]/20 p-2 rounded-full">
                          <Phone className="w-4 h-4 text-[#128C7E]" />
                        </div>
                        <div>
                          <p className="text-[11px] text-[#166534] font-bold uppercase tracking-wider">
                            Contato Rápido
                          </p>
                          <p className="text-sm font-semibold text-[#14532d]">
                            {selectedRA.causerPhone || 'Não extraído/inconsistente'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-solved"></div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-solved" /> Distribuição Automática
                  </h3>
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                    Assim que as inconsistências forem resolvidas, você poderá enviar este caso
                    direto para o Kanban. O analista será atribuído aleatoriamente.
                  </p>
                  <Button
                    className="w-full bg-solved hover:bg-solved-dark text-white font-medium h-10 shadow-sm"
                    disabled={selectedRA.validationStatus !== 'PRONTO PARA DISTRIBUIÇÃO'}
                    onClick={() => {
                      distributeRA(selectedRA.id)
                      setSelectedRA(null)
                    }}
                  >
                    Distribuir para Kanban
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
