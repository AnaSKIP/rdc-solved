import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Scale, FileText, Image as ImageIcon, File } from 'lucide-react'
import { FilePreviewModal } from '@/components/FilePreviewModal'
import {
  fetchJudicialMovements,
  addJudicialMovement,
  updateJudicialStatus,
  type JudicialMovement,
  type JudicialClaim,
} from '@/services/judicial'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface Props {
  claim: JudicialClaim
  onBack: () => void
  onUpdate: () => void
}

export function JudicialCaseDetail({ claim, onBack, onUpdate }: Props) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [movements, setMovements] = useState<JudicialMovement[]>([])
  const [newMovement, setNewMovement] = useState('')
  const [judicialStatus, setJudicialStatus] = useState(claim.judicial_status || '')
  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)

  useEffect(() => {
    setJudicialStatus(claim.judicial_status || '')
    fetchJudicialMovements(claim.id).then(setMovements).catch(console.error)
  }, [claim])

  const handleAddMovement = async () => {
    if (!newMovement.trim() || !user?.id) return
    try {
      const movement = await addJudicialMovement(claim.id, newMovement, user.id)
      if (movement) setMovements([movement, ...movements])
      setNewMovement('')
      toast({
        title: 'Movimento registrado',
        className: 'bg-green-50 border-green-200 text-green-900',
      })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleStatusSave = async () => {
    try {
      await updateJudicialStatus(claim.id, judicialStatus)
      toast({
        title: 'Status atualizado',
        className: 'bg-green-50 border-green-200 text-green-900',
      })
      onUpdate()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const getFileIcon = (type: string) => {
    if (type === 'pdf' || type?.includes('pdf'))
      return <FileText className="w-5 h-5 text-red-500" />
    if (type === 'image' || type?.includes('image'))
      return <ImageIcon className="w-5 h-5 text-blue-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="bg-white border-b px-6 py-4 shrink-0 shadow-sm z-10 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex items-center gap-3">
          <Scale className="w-6 h-6 text-red-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{claim.ra}</h1>
            <p className="text-sm text-gray-500">
              {claim.judicial_process_number || 'Sem número de processo'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Cliente</h3>
            <p className="text-sm font-semibold text-gray-800">{claim.client_name || 'N/A'}</p>
            <p className="text-xs text-gray-500">
              CNPJ: {claim.client_cnpj || claim.company_cnpj || 'N/A'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Causador</h3>
            <p className="text-sm font-semibold text-gray-800">{claim.causer_name || 'N/A'}</p>
            <p className="text-xs text-gray-500">Doc: {claim.causer_document || 'N/A'}</p>
            <p className="text-xs text-gray-500">WhatsApp: {claim.causer_whatsapp || 'N/A'}</p>
            <p className="text-xs text-gray-500">Placa: {claim.placa_causador || 'N/A'}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Acidente</h3>
            <p className="text-xs text-gray-500 mb-1">
              Data: {claim.date ? new Date(claim.date).toLocaleDateString('pt-BR') : 'N/A'}
            </p>
            <p className="text-xs text-gray-600 line-clamp-3">
              {claim.relato_acidente || 'Sem relato'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Financeiro</h3>
            <p className="text-lg font-bold text-emerald-700">
              R${' '}
              {(claim.financial_total_value || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Status Judicial</h3>
          <div className="flex gap-2">
            <Input
              value={judicialStatus}
              onChange={(e) => setJudicialStatus(e.target.value)}
              placeholder="Ex: Aguardando citação..."
            />
            <Button
              onClick={handleStatusSave}
              size="sm"
              className="bg-solved hover:bg-solved-dark text-white shrink-0"
            >
              Salvar
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
            Movimentações Processuais
          </h3>
          <Textarea
            value={newMovement}
            onChange={(e) => setNewMovement(e.target.value)}
            placeholder="Descreva a movimentação..."
            className="mb-2 min-h-[70px]"
          />
          <div className="flex justify-end mb-4">
            <Button
              onClick={handleAddMovement}
              size="sm"
              className="bg-solved hover:bg-solved-dark text-white"
            >
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {movements.map((m) => (
              <div key={m.id} className="border-l-2 border-solved pl-3 py-1">
                <p className="text-xs text-gray-400">
                  {new Date(m.created_at).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-gray-700">{m.description}</p>
              </div>
            ))}
            {movements.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                Nenhuma movimentação registrada.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Documentos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(claim.attachments || []).map((file) => (
              <div
                key={file.id}
                onClick={() =>
                  setPreviewFile({ url: file.url, name: file.file_name, type: file.file_type })
                }
                className="border rounded-md p-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex flex-col gap-2"
              >
                {getFileIcon(file.file_type)}
                <p className="text-xs font-medium text-gray-700 line-clamp-2">{file.file_name}</p>
              </div>
            ))}
            {(!claim.attachments || claim.attachments.length === 0) && (
              <p className="text-xs text-gray-400 col-span-full text-center py-4">
                Nenhum documento anexado.
              </p>
            )}
          </div>
        </div>
      </div>

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || null}
        fileName={previewFile?.name || ''}
        fileType={previewFile?.type || ''}
      />
    </div>
  )
}
