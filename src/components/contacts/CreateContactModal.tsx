import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Search } from 'lucide-react'
import useContactStore from '@/stores/useContactStore'
import { useToast } from '@/hooks/use-toast'
import { fetchCEP, fetchCNPJ } from '@/services/external'

interface Props {
  isOpen: boolean
  onClose: () => void
  type: 'clients' | 'analysts' | 'insurers' | 'internal_team'
  initialData?: any
}

const FIELDS: Record<string, any[]> = {
  clients: [
    { key: 'RAZÃO SOCIAL', label: 'Razão Social', req: true },
    { key: 'CNPJ', label: 'CNPJ', action: 'cnpj' },
    { key: 'CEP', label: 'CEP', action: 'cep' },
    { key: 'ENDEREÇO', label: 'Endereço' },
    { key: 'CIDADE', label: 'Cidade' },
    { key: 'UF', label: 'UF' },
    { key: 'TELEFONE', label: 'Telefone' },
    { key: 'COMISSÃO', label: 'Comissão (%)', type: 'number' },
  ],
  analysts: [
    { key: 'NOME', label: 'Nome', req: true },
    { key: 'CNPJ', label: 'CNPJ', action: 'cnpj' },
    { key: 'CEP', label: 'CEP', action: 'cep' },
    { key: 'ENDERECO', label: 'Endereço' },
    { key: 'TELEFONE', label: 'Telefone/Celular' },
    { key: 'MENSALIDADE', label: 'Mensalidade (R$)', type: 'number' },
    { key: 'COMISSAO - 0 A 9.999,99', label: 'Comissão (%)', type: 'number' },
  ],
  insurers: [
    { key: 'NOME', label: 'Nome', req: true },
    { key: 'CNPJ', label: 'CNPJ', action: 'cnpj' },
    { key: 'CEP', label: 'CEP', action: 'cep' },
    { key: 'ENDERECO', label: 'Endereço' },
    { key: 'TELEFONE', label: 'Telefone' },
  ],
  internal_team: [
    { key: 'name', label: 'Nome', req: true },
    { key: 'phone', label: 'Telefone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Endereço' },
    { key: 'role', label: 'Função' },
  ],
}

const TITLES: Record<string, string> = {
  clients: 'Cliente',
  analysts: 'Analista',
  insurers: 'Seguradora',
  internal_team: 'Membro da Equipe',
}

export function CreateContactModal({ isOpen, onClose, type, initialData }: Props) {
  const { createRecord, updateRecord } = useContactStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {})
    }
  }, [isOpen, initialData])

  const handleAction = async (actionType: string, val: string) => {
    if (!val) return
    setFetching(true)
    try {
      if (actionType === 'cep') {
        const data = await fetchCEP(val)
        if (!data.erro) {
          setFormData((prev: any) => ({
            ...prev,
            ENDEREÇO: `${data.logradouro || ''}, ${data.bairro || ''}`.trim(),
            ENDERECO: `${data.logradouro || ''}, ${data.bairro || ''}`.trim(),
            address: `${data.logradouro || ''}, ${data.bairro || ''}`.trim(),
            CIDADE: data.localidade || '',
            UF: data.uf || '',
          }))
          toast({ title: 'Endereço encontrado via CEP', className: 'bg-green-50 border-green-200' })
        } else {
          toast({ title: 'CEP não encontrado', variant: 'destructive' })
        }
      } else if (actionType === 'cnpj') {
        const data = await fetchCNPJ(val)
        if (data && data.razao_social) {
          setFormData((prev: any) => ({
            ...prev,
            'RAZÃO SOCIAL': data.razao_social,
            NOME: data.razao_social,
            name: data.razao_social,
            ENDEREÇO:
              `${data.logradouro || ''}, ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}`.trim(),
            ENDERECO:
              `${data.logradouro || ''}, ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}`.trim(),
            TELEFONE: data.ddd_telefone_1 || prev.TELEFONE,
            CEP: data.cep || prev.CEP,
          }))
          toast({
            title: 'Dados da Receita importados com sucesso',
            className: 'bg-green-50 border-green-200',
          })
        } else {
          toast({ title: 'CNPJ não encontrado', variant: 'destructive' })
        }
      }
    } catch (e) {
      toast({ title: 'Erro na consulta externa', variant: 'destructive' })
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    const fields = FIELDS[type]
    const missingReq = fields.find((f) => f.req && !formData[f.key])

    if (missingReq) {
      toast({
        title: 'Atenção',
        description: `O campo ${missingReq.label} é obrigatório.`,
        variant: 'destructive',
      })
      return
    }

    const payload = { ...formData }
    for (const f of fields) {
      if (f.type === 'number') {
        payload[f.key] =
          payload[f.key] !== undefined && payload[f.key] !== '' ? parseFloat(payload[f.key]) : null
      } else if (payload[f.key] === '') {
        payload[f.key] = null
      }
    }

    setLoading(true)
    try {
      if (initialData?.id) {
        await updateRecord(type, initialData.id, payload)
        onClose()
      } else {
        const success = await createRecord(type, payload)
        if (success) onClose()
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao salvar.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Detalhes e Edição' : 'Novo Registro'}: {TITLES[type]}
          </DialogTitle>
          <DialogDescription>
            {fetching ? (
              <span className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-3 h-3 animate-spin" /> Consultando base de dados externa...
              </span>
            ) : (
              'Modifique os dados nos campos abaixo. A consulta de CEP e CNPJ preenche dados automaticamente.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {FIELDS[type].map((field) => (
            <div className="grid gap-2" key={field.key}>
              <Label className="text-gray-700 font-medium text-xs uppercase tracking-wider">
                {field.label} {field.req && <span className="text-red-500">*</span>}
              </Label>
              <div className="flex gap-2">
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  step={field.type === 'number' ? '0.01' : undefined}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  onBlur={(e) => field.action && handleAction(field.action, e.target.value)}
                  placeholder={field.action ? `Digite o ${field.label} para buscar` : ''}
                  className="bg-gray-50 focus-visible:ring-solved h-9 flex-1"
                />
                {field.action && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0 bg-white"
                    onClick={() => handleAction(field.action, formData[field.key])}
                    title={`Buscar por ${field.label}`}
                  >
                    <Search className="w-4 h-4 text-gray-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || fetching}
            className="bg-solved hover:bg-solved-dark text-white shadow-sm"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Registro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
