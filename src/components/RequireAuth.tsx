import { useAuth } from '@/hooks/use-auth'
import Login from '@/pages/Login'
import { Loader2 } from 'lucide-react'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 animate-in fade-in duration-500">
        <Loader2 className="w-10 h-10 animate-spin text-solved" />
        <p className="text-gray-500 font-medium">Verificando credenciais...</p>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return <>{children}</>
}
