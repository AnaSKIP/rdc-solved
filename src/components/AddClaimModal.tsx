import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import useKanbanStore from '@/stores/useKanbanStore'
import useContactStore from '@/stores/useContactStore'
import { Loader2 } from 'lucide-react'

export function AddClaimModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const { refreshClaims } = useKanbanStore()
  const { contacts, internalTeam } = useContactStore()
  const [loading, setLoading] = useState(false)

  const [ra, setRa] = useState('')
  const [clientId, setClientId] = useState('')
  const [baseRa, setBaseRa] = useState('')
  const [causerName, setCauserName] = useState('')
  const [placaCausador, setPlacaCausador] = useState('')
  const [analystId, setAnalystId] = useState('')
  const [valor, setValor] = useState('')
  const [relato, setRelato] = useState('')

  const handleSave = async () => {
    if (!ra.trim()) {
      toast({ title: 'RA é obrigatório', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('claims').insert({
        ra: ra.trim(),
        client_id: clientId && clientId !== 'none' ? clientId : null,
        causer_name: causerName.trim() || null,
        placa_causador: placaCausador.trim() || null,
        analyst_id: analystId && analystId !== 'none' ? analystId : null,
        financial_total_value: valor ? parseFloat(valor.replace(',', '.')) : 0,
        relato_acidente: relato.trim() || null,
        stage: 'Atribuir',
        status: 'pending',
        date: new Date().toISOString(),
      })

      if (error) throw error

      toast({ title: 'Sinistro criado com sucesso!', className: 'bg-green-50 text-green-900' })
      refreshClaims()
      onClose()

      setRa('')
      setClientId('')
      setCauserName('')
      setPlacaCausador('')
      setAnalystId('')
      setValor('')
      setRelato('')
    } catch (err: any) {
      toast({ title: 'Erro ao criar sinistro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Sinistro Manual</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ra">Número do RA *</Label>
              <input
                id="ra"
                value={baseRa}
                onChange={(e) => {
                  setBaseRa(e.target.value)
                  const client = contacts?.find((c: any) => c.id.toString() === clientId)
                  const cnpj = client?.cnpj || client?.CNPJ
                  if (cnpj) {
                    setRa(`${e.target.value}-${cnpj}`)
                  } else {
                    setRa(e.target.value)
                  }
                }}
                placeholder="Ex: 1234/2024"
                className={inputClass}
              />
              {ra !== baseRa && (
                <p className="text-xs text-gray-500 mt-1">
                  Pré-visualização: <span className="font-semibold">{ra}</span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor Estimado (R$)</Label>
              <input
                id="valor"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                type="number"
                step="0.01"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={clientId}
              onValueChange={(val) => {
                setClientId(val)
                const client = contacts?.find((c: any) => c.id.toString() === val)
                const cnpj = client?.cnpj || client?.CNPJ
                if (cnpj) {
                  setRa(`${baseRa}-${cnpj}`)
                } else {
                  setRa(baseRa)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(contacts || []).map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name || 'Sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="causer">Nome do Causador</Label>
              <input
                id="causer"
                value={causerName}
                onChange={(e) => setCauserName(e.target.value)}
                placeholder="Nome do terceiro"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placa">Placa do Causador</Label>
              <input
                id="placa"
                value={placaCausador}
                onChange={(e) => setPlacaCausador(e.target.value)}
                placeholder="ABC-1234"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Analista Responsável</Label>
            <Select value={analystId} onValueChange={setAnalystId}>
              <SelectTrigger>
                <SelectValue placeholder="Atribuir a um analista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não Atribuído</SelectItem>
                {(internalTeam || []).map((t: any) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relato">Relato do Acidente</Label>
            <textarea
              id="relato"
              value={relato}
              onChange={(e) => setRelato(e.target.value)}
              placeholder="Descreva a dinâmica do acidente..."
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-solved hover:bg-solved-dark text-white"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Sinistro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
