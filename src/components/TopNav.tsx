import { Bell, Clock, Search, MessageSquare, Home, LayoutGrid, LogOut, Scale } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useKanbanStore from '@/stores/useKanbanStore'
import useCaseStore from '@/stores/useCaseStore'
import { ROLES } from '@/stores/usePermissionsStore'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import useContactStore from '@/stores/useContactStore'

export function TopNav() {
  const { claims, setSelectedClaim, searchQuery, setSearchQuery } = useKanbanStore()
  const { userRole, setUserRole, analystName } = useCaseStore()
  const { user, profile, isAdmin: isDbAdmin, signOut } = useAuth()
  const { contacts } = useContactStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (isDbAdmin && userRole !== 'Admin') {
      setUserRole('Admin')
    }
  }, [isDbAdmin, userRole, setUserRole])

  const isAdmin = userRole === 'Admin' || isDbAdmin
  const currentUserContact = contacts.find(
    (c) => c.email?.toLowerCase() === user?.email?.toLowerCase(),
  )
  const currentUserName =
    profile?.name || currentUserContact?.name || user?.email?.split('@')[0] || analystName || ''

  const myClaims = claims.filter(
    (c) =>
      isAdmin ||
      c.analyst?.toLowerCase() === currentUserName.toLowerCase() ||
      c.analyst === currentUserName,
  )

  const positiveClaims = myClaims.filter((c) => c?.hasPositiveInteraction)
  const positiveCount = positiveClaims.length

  const handleClaimClick = (claim: any) => {
    setSelectedClaim(claim)
    navigate('/kanban')
  }

  const handleLogout = async () => {
    await signOut()
    toast({ title: 'Sessão Encerrada', description: 'Você saiu do sistema.' })
  }

  return (
    <header className="bg-solved text-white sticky top-0 z-50 h-16 shadow-md shrink-0 flex items-center px-6 justify-between border-b border-solved-dark/50">
      <div className="flex items-center gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity tracking-wider"
        >
          <div className="bg-white/10 p-1.5 rounded-md">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <span className="opacity-90">RDC</span>
          <span className="opacity-40 font-light">|</span>
          <span className="opacity-80">SOLVED</span>
        </Link>

        <div className="h-6 w-px bg-white/20 hidden sm:block mx-2"></div>

        <Link
          to="/"
          className="hidden sm:flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors border border-white/10 font-medium shadow-sm"
        >
          <Home className="w-4 h-4" /> Portal de Apps
        </Link>

        <Link
          to="/juridico"
          className="hidden sm:flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors border border-white/10 font-medium shadow-sm"
        >
          <Scale className="w-4 h-4" /> Jurídico
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 mr-2">
          <span className="text-[10px] text-white/60 uppercase font-bold tracking-widest">
            Perfil Atual:
          </span>
          <Select value={userRole} onValueChange={setUserRole}>
            <SelectTrigger className="h-9 text-xs bg-black/20 border-white/20 text-white w-[130px] focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative hidden lg:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-solved-light" />
          <Input
            type="search"
            placeholder="Buscar RA, Cliente ou Placa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-72 bg-solved-dark border-none text-white placeholder:text-solved-light pl-10 focus-visible:ring-1 focus-visible:ring-white/50 rounded-full transition-all"
          />
        </div>

        <div className="flex items-center gap-1 text-solved-light border-x border-white/10 px-3 mx-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors relative outline-none"
                title="Mensagens Positivas do Z-API"
              >
                <MessageSquare className="w-5 h-5" />
                {positiveCount > 0 && (
                  <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center bg-green-500 text-white text-[10px] border-none animate-bounce shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                    {positiveCount}
                  </Badge>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Mensagens Positivas Pendentes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {positiveCount === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  Nenhuma interação pendente.
                </div>
              ) : (
                positiveClaims.map((claim) => (
                  <DropdownMenuItem
                    key={claim.id}
                    onClick={() => handleClaimClick(claim)}
                    className="cursor-pointer flex flex-col items-start gap-1 py-2"
                  >
                    <span className="font-bold text-solved text-xs">{claim.raNumber}</span>
                    <span
                      className="text-xs text-gray-600 truncate w-full"
                      title={claim.companyName}
                    >
                      {claim.companyName}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
            <Clock className="w-5 h-5" />
          </button>
          <button className="p-2 hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm bg-red-500/20 hover:bg-red-500/40 text-white px-3 py-2 rounded-lg transition-colors border border-red-400/20 font-medium"
          title="Sair do sistema"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>

        <div className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-white leading-none">{currentUserName}</span>
            <span className="text-[10px] text-solved-light font-medium">{userRole}</span>
          </div>
          <Avatar className="h-10 w-10 bg-purple-600 border-2 border-white/20 shadow-sm">
            <AvatarFallback className="bg-purple-600 text-white text-sm font-bold uppercase">
              {currentUserName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
