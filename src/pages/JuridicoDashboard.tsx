import { LayoutDashboard, Scale, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function JuridicoDashboard() {
  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Scale className="w-5 h-5 text-solved" /> Ações Judiciais
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhamento de processos judiciais originados de recusas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar Processo ou RA..."
              className="h-9 w-64 bg-white border-gray-300 pl-9 shadow-sm"
            />
          </div>
        </div>
      </div>
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center max-w-md bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <Scale className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Painel Jurídico em Desenvolvimento
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Este ambiente concentrará todos os sinistros marcados como "Não Assume" que evoluíram
            para litígio. Os números de processos já podem ser preenchidos no Kanban.
          </p>
          <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 text-xs py-1 px-3">
            Integração Processual Em Breve
          </Badge>
        </div>
      </div>
    </div>
  )
}
