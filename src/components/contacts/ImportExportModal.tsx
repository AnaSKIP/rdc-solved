import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { UploadCloud, Download, Loader2, ArrowRight } from 'lucide-react'
import useContactStore from '@/stores/useContactStore'
import { useToast } from '@/hooks/use-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const FIELDS_MAP: Record<string, { key: string; label: string }[]> = {
  clients: [
    { key: 'RAZÃO SOCIAL', label: 'Razão Social' },
    { key: 'CNPJ', label: 'CNPJ' },
    { key: 'TELEFONE', label: 'Telefone' },
    { key: 'ENDEREÇO', label: 'Endereço' },
    { key: 'COMISSÃO', label: 'Comissão (%)' },
  ],
  analysts: [
    { key: 'NOME', label: 'Nome' },
    { key: 'CNPJ', label: 'CNPJ' },
    { key: 'TELEFONE', label: 'Telefone/Celular' },
    { key: 'ENDERECO', label: 'Endereço' },
    { key: 'MENSALIDADE', label: 'Mensalidade' },
    { key: 'COMISSAO - 0 A 9.999,99', label: 'Comissão (%)' },
  ],
  insurers: [
    { key: 'NOME', label: 'Nome' },
    { key: 'TELEFONE', label: 'Telefone' },
  ],
  internal_team: [
    { key: 'name', label: 'Nome' },
    { key: 'phone', label: 'Telefone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Endereço' },
    { key: 'role', label: 'Função' },
  ],
}

export function ImportExportModal({ isOpen, onClose }: Props) {
  const { clients, analysts, insurers, internalTeam, replaceData, appendData } = useContactStore()
  const { toast } = useToast()

  const [tab, setTab] = useState('import')
  const [targetType, setTargetType] = useState<string>('clients')
  const [replace, setReplace] = useState(false)
  const [step, setStep] = useState(1)
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim() !== '')
      const headers = lines[0].split(',').map((h) => h.trim().replace(/['"]/g, ''))
      const rows = lines.slice(1).map((l) => l.split(',').map((c) => c.trim().replace(/['"]/g, '')))
      setCsvData({ headers, rows })

      const newMappings: Record<string, string> = {}
      FIELDS_MAP[targetType].forEach((f) => {
        const match = headers.find(
          (h) =>
            h.toLowerCase().includes(f.label.toLowerCase()) ||
            h.toLowerCase() === f.key.toLowerCase(),
        )
        if (match) newMappings[f.key] = match
      })
      setMappings(newMappings)
      setStep(2)
    }
    reader.readAsText(file)
  }

  const validatePhone = (val: string) => {
    const digits = val.replace(/\D/g, '')
    return digits.length > 0 ? digits : null
  }

  const validateCNPJ = (val: string) => {
    const digits = val.replace(/\D/g, '')
    return digits.length === 14
      ? digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      : val
  }

  const handleImport = async () => {
    if (!csvData) return
    setLoading(true)

    const inserts = csvData.rows.map((row) => {
      const record: any = {}
      Object.entries(mappings).forEach(([dbKey, csvHeader]) => {
        const idx = csvData.headers.indexOf(csvHeader)
        if (idx >= 0) {
          let val: any = row[idx]
          if (dbKey === 'TELEFONE' || dbKey === 'phone') val = validatePhone(val)
          if (dbKey === 'CNPJ' || dbKey === 'cnpj') val = validateCNPJ(val)
          if (
            dbKey === 'COMISSÃO' ||
            dbKey === 'COMISSAO - 0 A 9.999,99' ||
            dbKey === 'MENSALIDADE'
          ) {
            val = val ? parseFloat(val) : null
            if (isNaN(val)) val = null
          }
          if (val === '') val = null
          record[dbKey] = val
        }
      })
      return record
    })

    if (replace) {
      await replaceData(targetType as any, inserts)
    } else {
      await appendData(targetType as any, inserts)
    }

    setLoading(false)
    handleReset()
  }

  const handleExport = () => {
    let data: any[] = []
    if (targetType === 'clients') data = clients
    if (targetType === 'analysts') data = analysts
    if (targetType === 'insurers') data = insurers
    if (targetType === 'internal_team') data = internalTeam

    if (data.length === 0) {
      toast({ title: 'Aviso', description: 'Não há dados para exportar.', variant: 'destructive' })
      return
    }

    const fields = FIELDS_MAP[targetType]
    const headers = fields.map((f) => f.label)
    const rows = data.map((item) => fields.map((f) => `"${item[f.key] || ''}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `export_${targetType}.csv`
    a.click()
    onClose()
  }

  const handleReset = () => {
    setStep(1)
    setCsvData(null)
    setMappings({})
    setReplace(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleReset()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciamento de Planilhas</DialogTitle>
          <DialogDescription>
            Importação inteligente com mapeamento automático e exportação de dados.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Importar CSV</TabsTrigger>
            <TabsTrigger value="export">Exportar CSV</TabsTrigger>
          </TabsList>

          <div className="py-4">
            <div className="space-y-2 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <Label className="text-gray-700">Selecione a Categoria Alvo</Label>
              <Select
                value={targetType}
                onValueChange={(t) => {
                  setTargetType(t)
                  setStep(1)
                  setCsvData(null)
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clients">Clientes</SelectItem>
                  <SelectItem value="analysts">Analistas</SelectItem>
                  <SelectItem value="insurers">Seguradoras</SelectItem>
                  <SelectItem value="internal_team">Equipe Interna</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="import" className="mt-0">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 relative transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                    />
                    <UploadCloud className="w-10 h-10 text-solved mb-3" />
                    <h3 className="font-medium text-gray-900">
                      Clique ou arraste seu arquivo CSV aqui
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      O arquivo deve conter cabeçalhos na primeira linha
                    </p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded border border-red-100">
                    <Checkbox
                      id="replace"
                      checked={replace}
                      onCheckedChange={(c) => setReplace(!!c)}
                      className="mt-0.5 border-red-300 data-[state=checked]:bg-red-600"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="replace"
                        className="text-sm font-semibold text-red-800 cursor-pointer"
                      >
                        Substituir todos os dados existentes
                      </Label>
                      <p className="text-xs text-red-600">
                        Atenção: Todos os registros atuais desta categoria serão apagados antes da
                        importação.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-2">
                    <h4 className="font-medium text-sm text-gray-800">Mapeamento de Colunas</h4>
                    <p className="text-xs text-gray-500">
                      Associe as colunas da sua planilha aos campos do sistema.
                    </p>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto space-y-3 pr-2">
                    {FIELDS_MAP[targetType].map((field) => (
                      <div
                        key={field.key}
                        className="grid grid-cols-[1fr_auto_2fr] gap-3 items-center bg-white p-2 rounded border border-gray-100"
                      >
                        <Label className="text-right text-xs font-semibold text-gray-700">
                          {field.label}
                        </Label>
                        <ArrowRight className="w-3 h-3 text-gray-300" />
                        <Select
                          value={mappings[field.key] || ''}
                          onValueChange={(v) => setMappings((p) => ({ ...p, [field.key]: v }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-gray-50">
                            <SelectValue placeholder="-- Ignorar --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">-- Ignorar --</SelectItem>
                            {csvData?.headers.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <DialogFooter className="pt-4 border-t border-gray-100">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Voltar
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={loading}
                      className="bg-solved hover:bg-solved-dark text-white min-w-[140px]"
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Importar {csvData?.rows.length} Registros
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="mt-0">
              <div className="p-6 bg-gray-50 rounded-lg text-center border border-gray-200">
                <Download className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">Exportar Dados</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Será gerado um arquivo CSV com todos os registros da categoria selecionada.
                </p>
                <Button
                  onClick={handleExport}
                  className="gap-2 bg-white text-gray-900 border border-gray-200 hover:bg-gray-100 shadow-sm w-full sm:w-auto"
                >
                  Baixar Planilha CSV
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
