import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, UserPlus } from 'lucide-react'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (email: string, name: string) => void
  loading: boolean
}

export function CreateUserModal({ isOpen, onClose, onCreate, loading }: CreateUserModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const handleCreate = () => {
    if (!email) return
    onCreate(email, name)
    setEmail('')
    setName('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-solved" />
            Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Crie uma nova conta de usuário. A senha inicial será &quot;1234&quot; e o usuário será
            obrigado a trocá-la no primeiro acesso.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-user-name">Nome (opcional)</Label>
            <Input
              id="new-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do colaborador"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-email">E-mail *</Label>
            <Input
              id="new-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@rdccobrancas.com.br"
              required
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-800 border border-blue-100">
            <p>
              <strong>Senha inicial:</strong> 1234
            </p>
            <p>O usuário será forçado a alterar a senha no primeiro login.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !email}
            className="bg-solved hover:bg-solved-dark text-white"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
