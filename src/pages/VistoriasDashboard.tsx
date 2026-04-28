import { LayoutDashboard, CheckCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function VistoriasDashboard() {
  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-solved" /> Controle de Vistorias
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestão de agendamentos e laudos de constatação.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar RA ou Placa..."
              className="h-9 w-64 bg-white border-gray-300 pl-9 shadow-sm"
            />
          </div>
        </div>
      </div>
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center max-w-md bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <LayoutDashboard className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Módulo em Estruturação</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            O fluxo dedicado para Vistorias está sendo montado pela equipe técnica, aproveitando os
            novos dados registrados no Kanban.
          </p>
          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs py-1 px-3">
            Liberação Prevista para a Próxima Sprint
          </Badge>
        </div>
      </div>
    </div>
  )
}
