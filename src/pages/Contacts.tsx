import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Users,
  Download,
  Upload,
  Loader2,
  RefreshCw,
  Database,
  ArrowRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ContactColumn } from '@/components/contacts/ContactColumn'
import { ImportExportModal } from '@/components/contacts/ImportExportModal'
import useContactStore from '@/stores/useContactStore'

export default function Contacts() {
  const { clients, analysts, insurers, internalTeam, isLoading, loadData } = useContactStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filterData = (data: any[]) => {
    let filtered = data || []
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((i) => {
        const name = (i.name || i['RAZÃO SOCIAL'] || i.NOME || '').toLowerCase()
        const phone = i.phone || i.TELEFONE || ''
        const cnpj = i.cnpj || i.CNPJ || ''
        const email = (i.email || '').toLowerCase()
        return name.includes(q) || phone.includes(q) || cnpj.includes(q) || email.includes(q)
      })
    }
    return [...filtered].sort((a, b) => {
      const nameA = a.name || a['RAZÃO SOCIAL'] || a.NOME || ''
      const nameB = b.name || b['RAZÃO SOCIAL'] || b.NOME || ''
      return nameA.localeCompare(nameB)
    })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sticky top-0 z-20 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-solved" /> Diretório de Contatos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Organização em 4 segmentos com edição rápida e importação inteligente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contatos..."
              className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-solved/50 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="h-9 w-9 bg-white shadow-sm hover:bg-gray-50"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="gap-2 shadow-sm whitespace-nowrap bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-gray-300 h-9"
          >
            <Upload className="w-4 h-4 text-solved" />
            <Download className="w-4 h-4 text-solved -ml-1" />
            Importar / Exportar
          </Button>
        </div>
      </div>

      <div className="bg-blue-50/80 border-b border-blue-100 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm animate-in fade-in slide-in-from-top-2 gap-3 shadow-inner">
        <div className="flex items-center text-blue-800 gap-2 font-medium">
          <Database className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Pronto para iniciar a carga dos leads? O sistema agora possui contagem automática e
            trava de duplicidade por RA.
          </span>
        </div>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-1.5 h-8 shrink-0"
          asChild
        >
          <Link to="/import">
            Ir para Sincronização <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-solved" />
            <span className="text-sm font-medium">Carregando estrutura de contatos...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full animate-in fade-in zoom-in-95 duration-500 min-w-max lg:min-w-0">
            <ContactColumn title="Clientes" data={filterData(clients)} type="clients" />
            <ContactColumn title="Analistas" data={filterData(analysts)} type="analysts" />
            <ContactColumn title="Seguradoras" data={filterData(insurers)} type="insurers" />
            <ContactColumn
              title="Equipe Interna"
              data={filterData(internalTeam)}
              type="internal_team"
            />
          </div>
        )}
      </div>

      <ImportExportModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
