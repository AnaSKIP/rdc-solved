import { Link } from 'react-router-dom'
import usePermissionsStore from '@/stores/usePermissionsStore'
import useCaseStore from '@/stores/useCaseStore'
import {
  Briefcase,
  Inbox,
  CheckCircle,
  RefreshCcw,
  Scale,
  Users,
  LayoutDashboard,
  DollarSign,
  Database,
  Settings,
  Terminal,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const MODULES = [
  {
    id: 'kanban',
    title: 'Workspace (Kanban)',
    description: 'Gestão visual da esteira de sinistros',
    icon: Briefcase,
    url: '/kanban',
    color: 'bg-blue-600',
  },
  {
    id: 'intake',
    title: 'Caixa de Entrada',
    description: 'Ingestão e OCR de documentos novos',
    icon: Inbox,
    url: '/intake',
    color: 'bg-indigo-500',
  },
  {
    id: 'vistorias',
    title: 'Vistorias',
    description: 'Agendamentos e laudos de constatação',
    icon: CheckCircle,
    url: '/vistorias',
    color: 'bg-emerald-500',
  },
  {
    id: 'repescagem',
    title: 'FINALIZADOS SEM ACORDO',
    description: 'Tratativa e pesquisa de casos sem acordo',
    icon: RefreshCcw,
    url: '/repescagem',
    color: 'bg-orange-500',
  },
  {
    id: 'juridico',
    title: 'Ações Judiciais',
    description: 'Gestão de processos em litígio',
    icon: Scale,
    url: '/juridico',
    color: 'bg-red-500',
  },
  {
    id: 'contatos',
    title: 'Contatos',
    description: 'Diretório de clientes, analistas e equipe',
    icon: Users,
    url: '/contatos',
    color: 'bg-cyan-600',
  },
  {
    id: 'dashboard',
    title: 'Produtividade',
    description: 'Métricas e performance operacional',
    icon: LayoutDashboard,
    url: '/dashboard',
    color: 'bg-violet-500',
  },
  {
    id: 'financeiro',
    title: 'DRE & Fluxo',
    description: 'Gestão de caixa, provisões e impostos',
    icon: DollarSign,
    url: '/financeiro',
    color: 'bg-green-600',
  },
  {
    id: 'import',
    title: 'Importação Lote',
    description: 'Sincronização maciça via API do Odoo',
    icon: Database,
    url: '/import',
    color: 'bg-slate-600',
  },
  {
    id: 'settings',
    title: 'Configurações',
    description: 'Controle de acessos e chaves de integração',
    icon: Settings,
    url: '/settings',
    color: 'bg-gray-800',
  },
  {
    id: 'sandbox',
    title: 'Sandbox API',
    description: 'Ambiente de testes para IA e disparos',
    icon: Terminal,
    url: '/sandbox',
    color: 'bg-pink-600',
  },
]

export default function Index() {
  const { userRole, analystName } = useCaseStore()
  const { hasAccess } = usePermissionsStore()

  const allowedModules = MODULES.filter((m) => hasAccess(userRole, m.id as any))

  return (
    <div className="flex-1 h-[calc(100vh-48px)] bg-gray-50 overflow-auto p-6 lg:p-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-solved/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Portal de Aplicativos
            </h1>
            <p className="text-gray-500 text-lg mt-1">
              Olá, <span className="font-semibold text-gray-700">{analystName}</span>. O que você
              deseja acessar hoje?
            </p>
          </div>
          <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg border border-blue-100 text-sm font-medium flex items-center gap-2">
            Perfil Atual: <span className="font-bold uppercase tracking-wide">{userRole}</span>
          </div>
        </div>

        {allowedModules.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800">Sem Acesso</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Seu perfil não possui permissão para acessar os módulos do sistema. Entre em contato
              com o administrador para solicitar liberação.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allowedModules.map((mod) => (
              <Link key={mod.id} to={mod.url} className="block group h-full">
                <Card className="h-full bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 border-gray-200 hover:border-blue-300 group-hover:-translate-y-1 overflow-hidden relative">
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${mod.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                  ></div>
                  <CardContent className="p-6 flex flex-col h-full z-10 relative">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-5 shadow-sm transition-transform group-hover:scale-110 ${mod.color}`}
                    >
                      <mod.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed flex-1">
                      {mod.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
