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
import { supabase } from '@/lib/supabase/client'
import { Inbox, Loader2, RefreshCw, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { PasswordConfirmModal } from '@/components/PasswordConfirmModal'
import { Progress } from '@/components/ui/progress'

export const PIPELINE_STAGES = ['Caixa de Entrada', 'Enriquecimento', 'Análise', 'Concluído']

export default function IntakeDashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)

  const pendingLeads = leads.filter((l) => l.status_processamento === 'AGUARDANDO PROCESSAMENTO')
  const pendingCount = pendingLeads.length

  const fetchLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('caixa_entrada')
      .select('*')
      .order('data_criacao', { ascending: false })
      .limit(3000)

    if (!error && data) {
      setLeads(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLeads()

    const subscription = supabase
      .channel('caixa_entrada_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caixa_entrada' }, fetchLeads)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleBatchProcess = async () => {
    setIsProcessingBatch(true)
    setProcessedCount(0)

    const { data: clientsDb } = await supabase.from('clients').select('id, "RAZÃO SOCIAL"')

    const batchSize = 10
    let currentProcessed = 0

    for (let i = 0; i < pendingLeads.length; i += batchSize) {
      const batch = pendingLeads.slice(i, i + batchSize)

      // Enriquecimento real conectando à API Infocar/SCI para não alucinar dados
      const enrichedBatch = await Promise.all(
        batch.map(async (lead) => {
          let enrichedData: any = null
          let actionMsg = 'Processado sem enriquecimento adicional (Sem placa)'

          if (lead.placa_causador) {
            try {
              const { data } = await supabase.functions.invoke('enrich-infocar-sci', {
                body: { placa: lead.placa_causador },
              })
              if (data?.success && data?.data) {
                enrichedData = data.data
                actionMsg =
                  'Enriquecimento via Infocar/SCI concluído com sucesso e transferido para Kanban'
              } else {
                actionMsg =
                  'Nenhum retorno recebido da API de enriquecimento, transferindo dados originais.'
              }
            } catch (err) {
              actionMsg =
                'Falha na comunicação com a API de enriquecimento, transferindo dados originais.'
            }
          }

          return {
            ...lead,
            causador_nome: enrichedData?.causerName || lead.causador_nome,
            causador_cpf: enrichedData?.causerDocument || lead.causador_cpf,
            causador_telefone: enrichedData?.causerPhone || lead.causador_telefone,
            causador_endereco: enrichedData?.causerEndereco || lead.causador_endereco,
            proprietario_veiculo_causador:
              enrichedData?.proprietarioNome || lead.proprietario_veiculo_causador,
            proprietario_telefone:
              enrichedData?.proprietarioTelefone || lead.proprietario_telefone || null,
            status_processamento: 'ENRIQUECIDO',
            historico_processamento: [
              ...(Array.isArray(lead.historico_processamento) ? lead.historico_processamento : []),
              {
                data: new Date().toISOString(),
                acao: actionMsg,
              },
            ],
          }
        }),
      )

      const claimsToInsert = enrichedBatch.map((lead) => {
        const cName = (lead.cliente_nome || '').toLowerCase()
        const matchedClient = clientsDb?.find((c) => {
          const rs = (c['RAZÃO SOCIAL'] || '').toLowerCase()
          return rs && cName && (rs.includes(cName) || cName.includes(rs))
        })

        return {
          ra: lead.id_ra,
          client_id: matchedClient?.id || null,
          stage: 'Atribuir',
          status: 'pending',
          placa_causador: lead.placa_causador || null,
          causer_name: lead.causador_nome || null,
          phone:
            lead.causador_telefone || lead.causador_whatsapp || lead.proprietario_telefone || null,
          relato_acidente: lead.dinamica_acidente || null,
          placa_onibus: lead.placa_onibus || null,
          prefixo_onibus: lead.prefixo_onibus || null,
          financial_total_value: lead.valor_dano_estimado || 0,
          is_validated: true,
          is_enriched: true,
          date: lead.data_acidente
            ? new Date(lead.data_acidente).toISOString()
            : new Date().toISOString(),
          causer_document: lead.causador_cpf || null,
          causer_endereco: lead.causador_endereco || null,
          tipo_veiculo_causador: lead.modelo_causador || null,
          proprietario_veiculo_causador: lead.proprietario_veiculo_causador || null,
          proprietario_telefone: lead.proprietario_telefone || null,
        }
      })

      const { data: insertedClaims, error: insertError } = await supabase
        .from('claims')
        .upsert(claimsToInsert, { onConflict: 'ra,date,placa_causador', ignoreDuplicates: false })
        .select('id, ra')

      if (!insertError && insertedClaims && insertedClaims.length > 0) {
        const attachmentsToInsert: any[] = []

        for (const lead of enrichedBatch) {
          const claim = insertedClaims.find((c) => c.ra === lead.id_ra)
          if (claim && lead.documentos_anexados && Array.isArray(lead.documentos_anexados)) {
            lead.documentos_anexados.forEach((doc: any) => {
              const url = doc.url || doc.url_arquivo || doc.link || doc.fileUrl
              const name = doc.nome || doc.nome_arquivo || doc.file_name || doc.name || 'Documento'
              const type =
                doc.tipo ||
                doc.tipo_arquivo ||
                doc.file_type ||
                doc.type ||
                (name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'file')

              if (url) {
                attachmentsToInsert.push({
                  claim_id: claim.id,
                  url: url,
                  file_name: name,
                  file_type: type,
                })
              }
            })
          }
        }

        if (attachmentsToInsert.length > 0) {
          await supabase
            .from('attachments')
            .upsert(attachmentsToInsert, { onConflict: 'id', ignoreDuplicates: true })
        }

        // Move os leads para o Kanban excluindo fisicamente da Caixa de Entrada
        const idsToDelete = enrichedBatch.map((l) => l.id_ra)
        await supabase.from('caixa_entrada').delete().in('id_ra', idsToDelete)
      }

      currentProcessed += batch.length
      setProcessedCount(currentProcessed)
    }

    setIsProcessingBatch(false)
    toast({
      title: 'Processamento e Transferência Concluídos',
      description: `${pendingLeads.length} leads foram enriquecidos e transferidos para o Kanban com sucesso.`,
      className: 'bg-green-50 border-green-200 text-green-900',
    })
    fetchLeads()
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-solved" /> RAs Recebidos (Caixa de Entrada)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhamento dos leads transferidos, exibindo todos os registros disponíveis para
            processamento de IA.
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
                <span className="text-base">🚀</span>
              )}
              Enriquecer {pendingCount} Leads
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
            Atualizar Tabela
          </Button>
        </div>
      </div>

      {isProcessingBatch && (
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-medium text-indigo-900">
            <span>Processando extração de dados via IA e enriquecimento...</span>
            <span>
              {processedCount} de {pendingCount}
            </span>
          </div>
          <Progress value={(processedCount / pendingCount) * 100} className="h-2" />
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-white border-b pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              Lista de Leads Transferidos
              <Badge variant="secondary" className="ml-2 font-normal">
                Total de Registros: {leads.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Visualização de todos os registros da Caixa de Entrada de forma unificada.
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
                    <TableHead className="whitespace-nowrap font-semibold">CPF Causador</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Data Acidente</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm">
                          Buscando leads e sincronizando com o banco de dados...
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <Inbox className="w-10 h-10 text-gray-300 mb-2" />
                          <p>
                            Nenhum lead encontrado na caixa de entrada. Inicie uma transferência em
                            Integrações.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => (
                      <TableRow key={lead.id_ra} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-gray-900">{lead.id_ra}</TableCell>
                        <TableCell
                          className="text-gray-600 max-w-[200px] truncate"
                          title={lead.cliente_nome}
                        >
                          {lead.cliente_nome || '-'}
                        </TableCell>
                        <TableCell className="text-gray-600">{lead.placa_onibus || '-'}</TableCell>
                        <TableCell
                          className="text-gray-600 max-w-[200px] truncate"
                          title={lead.causador_nome}
                        >
                          {lead.causador_nome || '-'}
                        </TableCell>
                        <TableCell className="text-gray-600">{lead.causador_cpf || '-'}</TableCell>
                        <TableCell className="text-gray-600">
                          {lead.data_acidente
                            ? new Date(lead.data_acidente).toLocaleDateString('pt-BR', {
                                timeZone: 'UTC',
                              })
                            : '-'}
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
                                  : lead.status_processamento === 'NOVO'
                                    ? 'bg-indigo-500 hover:bg-indigo-600 shadow-sm border-transparent text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                            }
                          >
                            {lead.status_processamento || 'PENDENTE'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
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
        title="Autorizar Enriquecimento em Lote"
        description={`Você está prestes a processar ${pendingCount} leads via IA. Confirme sua senha de administrador para iniciar a execução.`}
      />
    </div>
  )
}
