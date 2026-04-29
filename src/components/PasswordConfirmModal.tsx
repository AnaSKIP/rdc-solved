import { useState } from 'react'
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
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface PasswordConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
}

export function PasswordConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const handleConfirm = async () => {
    if (!password) {
      setError('A senha é obrigatória.')
      return
    }
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password,
    })

    setLoading(false)

    if (signInError) {
      setError('Senha incorreta. Tente novamente.')
    } else {
      setPassword('')
      onConfirm()
      onClose()
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setPassword('')
          setError('')
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-500" />
            {title || 'Confirmação de Segurança'}
          </DialogTitle>
          <DialogDescription>
            {description ||
              'Esta é uma operação crítica. Por favor, confirme sua senha para continuar.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Sua Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
            {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Autorizar Operação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
