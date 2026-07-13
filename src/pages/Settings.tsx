import { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import useOdooImportStore from '@/stores/useOdooImportStore'
import usePermissionsStore, { ROLES, ModuleId } from '@/stores/usePermissionsStore'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import {
  CheckCircle2,
  Loader2,
  Server,
  ShieldCheck,
  Briefcase,
  Inbox,
  RefreshCcw,
  Scale,
  Users,
  LayoutDashboard,
  DollarSign,
  Database,
  Settings as SettingsIcon,
  Terminal,
  LogOut,
  UserCircle,
  KeyRound,
  UserPlus,
} from 'lucide-react'
import { CreateUserModal } from '@/components/CreateUserModal'

const MODULE_DEFINITIONS = [
  { id: 'kanban', title: 'Workspace (Kanban)', icon: Briefcase },
  { id: 'intake', title: 'Caixa de Entrada', icon: Inbox },
  { id: 'vistorias', title: 'Vistorias', icon: CheckCircle2 },
  { id: 'repescagem', title: 'Repescagem', icon: RefreshCcw },
  { id: 'juridico', title: 'Jurídico', icon: Scale },
  { id: 'contatos', title: 'Contatos', icon: Users },
  { id: 'dashboard', title: 'Produtividade', icon: LayoutDashboard },
  { id: 'financeiro', title: 'Financeiro', icon: DollarSign },
  { id: 'import', title: 'Importação Lote', icon: Database },
  { id: 'settings', title: 'Configurações', icon: SettingsIcon },
  { id: 'sandbox', title: 'Sandbox API', icon: Terminal },
]

export default function Settings() {
  const { credentials, setCredentials, testConnection } = useOdooImportStore()
  const { permissions, updatePermission, hasAccess } = usePermissionsStore()
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  const [url, setUrl] = useState(credentials?.url || '')
  const [db, setDb] = useState(credentials?.db || '')
  const [username, setUsername] = useState(credentials?.username || '')
  const [apiKey, setApiKey] = useState(credentials?.apiKey || '')
  const [isTesting, setIsTesting] = useState(false)
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [rawPasswords, setRawPasswords] = useState<Record<string, string>>({})
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)

  const loadProfiles = async () => {
    if (!user?.id || !permissions['Admin']) return
    setLoadingProfiles(true)
    const { data } = await supabase.from('profiles').select('*').order('name')
    if (data) setProfiles(data)
    const { data: pwdData } = await supabase.rpc('get_raw_passwords')
    if (pwdData) {
      const pwdMap: Record<string, string> = {}
      pwdData.forEach((p: any) => {
        pwdMap[p.id] = p.raw_password_view || ''
      })
      setRawPasswords(pwdMap)
    }
    setLoadingProfiles(false)
  }

  useEffect(() => {
    loadProfiles()
  }, [user])

  const handleResetPassword = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Deseja realmente resetar a senha de ${userName} para "1234"? O usuário será forçado a trocar no próximo login.`,
      )
    )
      return

    toast({ title: 'Resetando senha...', description: 'Aguarde um momento.' })
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId, newPassword: '1234', forceChange: true },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast({
        title: 'Senha Resetada',
        description: `A senha de ${userName} foi redefinida com sucesso.`,
        className: 'bg-green-50 border-green-200',
      })
      loadProfiles()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleSaveOdoo = () => {
    if (!url || !db || !username || !apiKey) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Preencha todos os campos para salvar a configuração.',
        variant: 'destructive',
      })
      return
    }
    setCredentials({ url, db, username, apiKey })
    toast({
      title: 'Configurações Salvas',
      description: 'Credenciais do Odoo atualizadas com sucesso.',
      className: 'bg-green-50 border-green-200',
    })
  }

  const handleTestOdoo = async () => {
    if (!url || !db || !username || !apiKey) {
      toast({
        title: 'Dados Incompletos',
        description: 'Preencha as credenciais antes de testar.',
        variant: 'destructive',
      })
      return
    }
    setIsTesting(true)
    setTestSuccess(null)
    const success = await testConnection()
    setIsTesting(false)
    setTestSuccess(success)

    if (success) {
      toast({
        title: 'Conexão Bem-sucedida',
        description:
          'A API do Odoo está acessível e as credenciais são válidas para sincronização.',
        className: 'bg-green-50 border-green-200',
      })
    }
  }

  const handleLogout = async () => {
    await signOut()
    toast({
      title: 'Sessão Encerrada',
      description: 'Você saiu do sistema com segurança.',
    })
  }

  const handleCreateUser = async (email: string, name: string) => {
    setCreatingUser(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email, name },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      toast({
        title: 'Usuário Criado',
        description: `Conta criada para ${email} com senha inicial "1234".`,
        className: 'bg-green-50 border-green-200',
      })
      setShowCreateUser(false)
      loadProfiles()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setCreatingUser(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden animate-in fade-in duration-300">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Painel de Controle</h1>
          <p className="text-sm text-gray-500">
            Gerencie integrações externas, banco de dados e permissões de acesso da sua equipe.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Tabs defaultValue="conta" className="w-full">
            <TabsList className="mb-6 bg-white border border-gray-200 shadow-sm h-12 w-full justify-start p-1 rounded-lg overflow-x-auto">
              <TabsTrigger
                value="conta"
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-solved data-[state=active]:shadow-none h-9 px-6 rounded-md text-gray-600 font-medium whitespace-nowrap"
              >
                Minha Conta
              </TabsTrigger>
              <TabsTrigger
                value="permissoes"
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-solved data-[state=active]:shadow-none h-9 px-6 rounded-md text-gray-600 font-medium whitespace-nowrap"
              >
                Permissões e Acessos
              </TabsTrigger>
              <TabsTrigger
                value="usuarios"
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-solved data-[state=active]:shadow-none h-9 px-6 rounded-md text-gray-600 font-medium whitespace-nowrap"
              >
                Gestão de Equipe
              </TabsTrigger>
              <TabsTrigger
                value="integracoes"
                className="data-[state=active]:bg-gray-100 data-[state=active]:text-solved data-[state=active]:shadow-none h-9 px-6 rounded-md text-gray-600 font-medium whitespace-nowrap"
              >
                Integração Odoo API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conta" className="animate-in fade-in duration-300">
              <Card className="shadow-sm border-gray-200 max-w-2xl">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-solved" />
                    <CardTitle className="text-lg">Detalhes da Sessão</CardTitle>
                  </div>
                  <CardDescription>Informações da conta conectada atualmente.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                      E-mail Corporativo
                    </Label>
                    <div className="text-lg font-medium text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {user?.email || 'Usuário não autenticado'}
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                      ID Único
                    </Label>
                    <div className="text-sm font-mono text-gray-500">{user?.id || '---'}</div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-4">
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Encerrar Sessão Segura
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="usuarios" className="animate-in fade-in duration-300">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-solved" />
                      <CardTitle className="text-lg">Gestão de Equipe (Administrador)</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      className="bg-solved hover:bg-solved-dark text-white"
                      onClick={() => setShowCreateUser(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" /> Novo Usuário
                    </Button>
                  </div>
                  <CardDescription>
                    Visualize a lista de usuários, gerencie níveis de acesso e redefina senhas em
                    caso de esquecimento.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b-gray-200">
                        <TableHead className="font-bold text-gray-700 uppercase text-xs">
                          Nome / E-mail
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-xs">
                          Perfil
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-xs">
                          Status
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-xs">
                          Senha
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 uppercase text-xs text-right">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingProfiles ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-solved mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : (
                        profiles.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <p className="font-medium text-gray-900">{p.name || 'Sem nome'}</p>
                              <p className="text-xs text-gray-500">{p.email}</p>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}
                              >
                                {p.is_admin ? 'Administrador' : 'Analista'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {p.force_password_change ? (
                                <span className="text-xs text-orange-600 font-medium">
                                  Troca pendente
                                </span>
                              ) : (
                                <span className="text-xs text-green-600 font-medium">Ativo</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                                {rawPasswords[p.id] || '---'}
                              </code>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetPassword(p.id, p.name || p.email)}
                                className="gap-2 text-xs h-8"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                Resetar Senha
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissoes" className="animate-in fade-in duration-300">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-solved" />
                      <CardTitle className="text-lg">Gestão de Módulos por Perfil</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: 'Permissões Salvas',
                          description: 'As regras de acesso foram atualizadas localmente.',
                          className: 'bg-green-50 border-green-200',
                        })
                      }
                    >
                      Salvar Regras
                    </Button>
                  </div>
                  <CardDescription>
                    Defina quais painéis e ferramentas cada perfil de usuário ("role") pode acessar
                    no Portal de Entrada. As alterações são aplicadas instantaneamente no Launcher.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b-gray-200">
                        <TableHead className="w-[250px] font-bold text-gray-700 uppercase text-xs tracking-wider">
                          Módulo do Sistema
                        </TableHead>
                        {ROLES.map((role) => (
                          <TableHead
                            key={role}
                            className="text-center font-bold text-gray-700 uppercase text-xs tracking-wider"
                          >
                            {role}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MODULE_DEFINITIONS.map((mod) => (
                        <TableRow key={mod.id} className="hover:bg-blue-50/30 transition-colors">
                          <TableCell className="font-medium text-gray-800 flex items-center gap-3 py-4">
                            <div className="p-1.5 bg-gray-100 rounded-md text-gray-600">
                              <mod.icon className="w-4 h-4" />
                            </div>
                            {mod.title}
                          </TableCell>
                          {ROLES.map((role) => {
                            const isAdmin = role === 'Admin'
                            return (
                              <TableCell key={role} className="text-center">
                                <Switch
                                  checked={hasAccess(role, mod.id as ModuleId)}
                                  onCheckedChange={(checked) =>
                                    updatePermission(role, mod.id as ModuleId, checked)
                                  }
                                  disabled={isAdmin}
                                  className={
                                    isAdmin ? 'opacity-50' : 'data-[state=checked]:bg-solved'
                                  }
                                />
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="bg-blue-50 p-4 text-xs text-blue-800 border-t border-blue-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <p>
                      <strong>Nota:</strong> O perfil de "Admin" possui acesso irrestrito por padrão
                      de segurança.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integracoes" className="animate-in fade-in duration-300">
              <Card className="shadow-sm border-gray-200 max-w-2xl">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-solved" />
                    <CardTitle className="text-lg">Credenciais Odoo Online</CardTitle>
                  </div>
                  <CardDescription>
                    Parâmetros de conexão necessários para a ferramenta de "Importação em Lote"
                    baixar casos em Repescagem e Sem Acordo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">URL Base</Label>
                    <Input
                      id="url"
                      placeholder="e.g., https://suaempresa.odoo.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db">Banco de Dados</Label>
                    <Input
                      id="db"
                      placeholder="Nome do banco de dados (ex: rdc_producao)"
                      value={db}
                      onChange={(e) => setDb(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Usuário (E-mail)</Label>
                      <Input
                        id="username"
                        placeholder="admin@rdc.com.br"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">Chave de API</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="••••••••••••"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                  </div>

                  {testSuccess !== null && (
                    <div
                      className={`mt-4 p-3 rounded-md flex items-center gap-2 text-sm font-medium ${testSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                    >
                      {testSuccess ? <CheckCircle2 className="w-4 h-4" /> : null}
                      {testSuccess
                        ? 'Conexão estabelecida com sucesso. Pronto para importação.'
                        : 'Falha na conexão. Verifique os dados fornecidos.'}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-gray-50/50 border-t border-gray-100 flex justify-between">
                  <Button variant="outline" onClick={handleTestOdoo} disabled={isTesting}>
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testando...
                      </>
                    ) : (
                      'Testar Conexão'
                    )}
                  </Button>
                  <Button
                    className="bg-solved hover:bg-solved-dark text-white"
                    onClick={handleSaveOdoo}
                  >
                    Salvar Configurações
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          <CreateUserModal
            isOpen={showCreateUser}
            onClose={() => setShowCreateUser(false)}
            onCreate={handleCreateUser}
            loading={creatingUser}
          />
        </div>
      </div>
    </div>
  )
}
