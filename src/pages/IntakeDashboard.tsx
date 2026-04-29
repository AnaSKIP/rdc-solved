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
import { Inbox, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function IntakeDashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = async () => {
    setLoading(true)
    // AÇÃO 3: Buscar todos os leads da caixa_entrada
    const { data, error } = await supabase
      .from('caixa_entrada')
      .select('*')
      .order('data_criacao', { ascending: false })
      .limit(3000) // Suporte a um grande volume como os 2.381 solicitados

    if (!error && data) {
      setLeads(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLeads()

    // Realtime subscription para atualizar em tempo real a transferência
    const subscription = supabase
      .channel('caixa_entrada_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caixa_entrada' }, fetchLeads)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLeads}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Tabela
        </Button>
      </div>

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
              {/* AÇÃO 4: Campos Visíveis na Tabela -> id_na, cliente_nome, placa_onibus, causador_nome, causador_cpf, data_acidente, status */}
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
                            variant={lead.status_processamento === 'NOVO' ? 'default' : 'secondary'}
                            className={
                              lead.status_processamento === 'NOVO'
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
    </div>
  )
}
