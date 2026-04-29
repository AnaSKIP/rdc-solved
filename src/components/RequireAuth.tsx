import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import Login from '@/pages/Login'
import { Loader2, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  const { toast } = useToast()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

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

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }

    setIsUpdating(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      setIsUpdating(false)
      return
    }

    if (profile?.id) {
      await supabase.from('profiles').update({ force_password_change: false }).eq('id', profile.id)
      window.location.reload()
    }
  }

  if (profile?.force_password_change) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Dialog open={true}>
          <DialogContent
            className="sm:max-w-[400px] [&>button]:hidden"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-solved" />
                Atualização de Segurança
              </DialogTitle>
              <DialogDescription>
                Este é o seu primeiro acesso ou sua senha foi redefinida. Por favor, defina uma nova
                senha para continuar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                className="w-full bg-solved hover:bg-solved-dark text-white"
                onClick={handlePasswordUpdate}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Atualizar Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return <>{children}</>
}
