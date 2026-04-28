import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FileSignature, Upload, FileText, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useKanbanStore from '@/stores/useKanbanStore'

export function AgreementPanel() {
  const { selectedClaim, updateClaim } = useKanbanStore()
  const { toast } = useToast()

  const [notes, setNotes] = useState(selectedClaim?.agreementNotes || '')
  const [signed, setSigned] = useState(selectedClaim?.agreementSigned || false)
  const [generated, setGenerated] = useState(selectedClaim?.agreementGenerated || false)

  useEffect(() => {
    setNotes(selectedClaim?.agreementNotes || '')
    setSigned(selectedClaim?.agreementSigned || false)
    setGenerated(selectedClaim?.agreementGenerated || false)
  }, [selectedClaim])

  const handleSaveNotes = () => {
    if (selectedClaim && notes !== selectedClaim.agreementNotes) {
      updateClaim(selectedClaim.id, { agreementNotes: notes })
      toast({ title: 'Anotações salvas', className: 'bg-green-50 border-green-200' })
    }
  }

  const handleGenerate = () => {
    setGenerated(true)
    if (selectedClaim) {
      updateClaim(selectedClaim.id, { agreementGenerated: true })
      toast({ title: 'Termo gerado com sucesso', className: 'bg-green-50 border-green-200' })
    }
  }

  const handleToggleSigned = (val: boolean) => {
    setSigned(val)
    if (selectedClaim) {
      updateClaim(selectedClaim.id, { agreementSigned: val })
      if (val) {
        toast({ title: 'Termo marcado como assinado', className: 'bg-green-50 border-green-200' })
      }
    }
  }

  return (
    <div className="bg-indigo-50/40 p-5 rounded-md border border-indigo-200 mt-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-5">
        <FileSignature className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-indigo-900 uppercase text-sm tracking-wider">
          Gestão de Termos de Acordo
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Ações do Documento
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGenerate}
                variant={generated ? 'outline' : 'default'}
                className={
                  generated
                    ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100 shadow-sm'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                }
              >
                {generated ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Termo Gerado
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" /> Gerar Termo Padrão
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="gap-2 shadow-sm border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              >
                <Upload className="w-4 h-4" />
                Anexar Customizado
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-md border border-indigo-100 shadow-sm transition-colors hover:border-indigo-300">
            <Label className="text-sm cursor-pointer text-indigo-950 font-semibold">
              Documentação Assinada e Validada?
            </Label>
            <Switch
              checked={signed}
              onCheckedChange={handleToggleSigned}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {signed && (
            <div className="text-xs text-green-800 bg-green-100 p-2.5 rounded border border-green-300 mt-2 font-medium animate-in zoom-in duration-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Status: Pronto para avançar para a etapa "Concluído".
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">
            Anotações da Tratativa (Equipe Interna)
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Descreva o status das tratativas com a seguradora ou acompanhamento do acordo..."
            className="min-h-[140px] bg-white resize-none border-indigo-200 focus-visible:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>
    </div>
  )
}
