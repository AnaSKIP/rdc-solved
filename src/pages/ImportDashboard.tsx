import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import useOdooImportStore from '@/stores/useOdooImportStore'
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Database,
  AlertCircle,
  FileImage,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ImportDashboard() {
  const {
    credentials,
    status,
    total,
    target,
    processed,
    successful,
    failed,
    duplicatesAvoided,
    attachedFilesCount,
    logs,
    isChecking,
    isClearing,
    eta,
    checkTotalFromOdoo,
    clearBase,
    startImport,
    pauseImport,
    resumeImport,
    retryBatch,
    resetImport,
  } = useOdooImportStore()

  const logsEndRef = useRef<HTMLDivElement>(null)

  // Progress is based on the current target limit (100 or total)
  const currentGoal = target > 0 ? target : total
  const progressPercentage = currentGoal > 0 ? Math.round((processed / currentGoal) * 100) : 0

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return <Badge variant="secondary">Pronto para Iniciar</Badge>
      case 'running':
        return <Badge className="bg-blue-500 animate-pulse">Sincronizando</Badge>
      case 'paused':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
            Pausado
          </Badge>
        )
      case 'error':
        return <Badge variant="destructive">Erro no Lote</Badge>
      case 'complete':
        return <Badge className="bg-green-500">Concluído</Badge>
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-solved" /> Dashboard de Sincronização
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Importação massiva com controle inteligente de duplicidades por RA, Data do Acidente e
            Placa do Veículo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearBase}
            disabled={isClearing || status === 'running'}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shadow-sm"
          >
            {isClearing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">Limpar Base Local</span>
          </Button>
          {getStatusBadge()}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {!credentials && (
            <Alert className="border-orange-200 bg-orange-50 shadow-sm animate-in fade-in slide-in-from-top-4">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <AlertTitle className="text-orange-800 font-bold">Atenção</AlertTitle>
              <AlertDescription className="text-orange-700 flex flex-col sm:flex-row sm:items-center justify-between mt-1 gap-3">
                <span>
                  As credenciais da API do Odoo não estão configuradas. Para testes locais, defina
                  credenciais fictícias em Configurações.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-300 hover:bg-orange-100 whitespace-nowrap"
                  asChild
                >
                  <Link to="/settings">Ir para Configurações</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="border-b bg-white pb-4">
                <CardTitle className="text-lg">Progresso da Migração</CardTitle>
                <CardDescription>
                  Processamento distribuído em lotes para validação e descarte inteligente de
                  registros já existentes na base.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end text-sm font-medium">
                    <div className="flex flex-col">
                      <span className="text-gray-600">
                        {processed} / {currentGoal} registros analisados
                      </span>
                      {status === 'running' && eta !== null && (
                        <span className="text-xs text-gray-400 mt-1">
                          Tempo restante estimado:{' '}
                          {eta > 60000
                            ? `${Math.floor(eta / 60000)}m ${Math.floor((eta % 60000) / 1000)}s`
                            : `${Math.floor(eta / 1000)}s`}
                        </span>
                      )}
                    </div>
                    <span className="text-solved text-xl font-bold">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {status === 'idle' && (
                    <Button
                      onClick={() => startImport()}
                      disabled={!credentials || isChecking}
                      className="bg-solved hover:bg-solved-dark text-white gap-2 min-w-[150px] shadow-sm"
                    >
                      {isChecking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {isChecking ? 'Consultando Odoo...' : 'Iniciar Extração Completa'}
                    </Button>
                  )}

                  {status === 'running' && (
                    <Button
                      onClick={pauseImport}
                      variant="outline"
                      className="gap-2 border-gray-300 min-w-[140px]"
                    >
                      <Pause className="w-4 h-4" /> Interromper
                    </Button>
                  )}

                  {status === 'paused' && (
                    <Button
                      onClick={resumeImport}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[140px]"
                    >
                      <Play className="w-4 h-4" /> Continuar
                    </Button>
                  )}

                  {status === 'error' && (
                    <Button
                      onClick={retryBatch}
                      className="bg-orange-500 hover:bg-orange-600 text-white gap-2 min-w-[140px]"
                    >
                      <RotateCcw className="w-4 h-4" /> Tentar Novamente
                    </Button>
                  )}

                  {(status === 'complete' || status === 'paused' || status === 'error') && (
                    <Button
                      onClick={resetImport}
                      variant="ghost"
                      className="text-gray-500 hover:text-gray-800"
                    >
                      Limpar Logs
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-white">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Auto Count Widget */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Leads no Odoo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{total > 0 ? total : '--'}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={checkTotalFromOdoo}
                      disabled={isChecking || !credentials || status === 'running'}
                      className="h-7 w-7 bg-white text-solved border-gray-200"
                      title="Contar Automaticamente no Odoo"
                    >
                      {isChecking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Novos Leads Importados
                    </span>
                  </div>
                  <span className="font-bold text-green-700">{successful}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-md border border-yellow-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Duplicatas Evitadas</span>
                  </div>
                  <span className="font-bold text-yellow-700">{duplicatesAvoided}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-md border border-red-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-800">Falhas de Leitura</span>
                  </div>
                  <span className="font-bold text-red-600">{failed}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-100">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-800">Mídias Vinculadas</span>
                  </div>
                  <span className="font-bold text-blue-600">{attachedFilesCount}</span>
                </div>

                {status === 'complete' && (
                  <Alert className="mt-4 bg-green-600 text-white border-none py-3 animate-in fade-in zoom-in-95 shadow-md">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                    <AlertTitle className="text-white font-bold ml-2">Sucesso</AlertTitle>
                    <AlertDescription className="text-green-50 ml-2 mt-1 text-xs">
                      Os dados da carga atual estão prontos para distribuição no Kanban.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 shadow-sm bg-[#1e1e2e] border-gray-800 text-gray-300 font-mono">
              <CardHeader className="border-b border-gray-800 pb-3 py-3 bg-[#181825] rounded-t-lg">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span className="ml-2 text-xs opacity-80">
                    terminal.sh - Processo de Mapeamento Odoo - PostgreSQL
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[320px] w-full p-4">
                  {logs.length === 0 ? (
                    <div className="text-gray-600 text-sm flex items-center h-full justify-center opacity-50">
                      Aguardando inicialização do processo...
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs sm:text-sm tracking-wide">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 animate-in fade-in">
                          <span className="text-gray-500 shrink-0">[{log.time}]</span>
                          <span
                            className={cn(
                              'break-words leading-relaxed',
                              log.type === 'error' && 'text-red-400 font-bold',
                              log.type === 'success' && 'text-green-400',
                              log.type === 'info' && 'text-blue-300',
                              log.type === 'warning' && 'text-yellow-400',
                            )}
                          >
                            {log.message}
                          </span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
