import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import useCaseStore from '@/stores/useCaseStore'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function NegotiationPanel({ compact = false }: { compact?: boolean }) {
  const {
    isQualified,
    causerIntention,
    setCauserIntention,
    hasInsurance,
    setHasInsurance,
    wantsToNegotiate,
    setWantsToNegotiate,
  } = useCaseStore()

  return (
    <div
      className={cn(
        'bg-blue-50/30 rounded-md border border-blue-100/50 shadow-sm',
        compact ? 'p-3 space-y-3' : 'p-4 space-y-5',
      )}
    >
      {!compact && (
        <div className="flex items-center justify-between border-b border-blue-100 pb-2 mb-2">
          <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">
            Triagem & Negociação
          </h3>
          {isQualified && (
            <Badge className="bg-green-600 hover:bg-green-700 uppercase text-[10px] animate-in fade-in zoom-in duration-300 shadow-sm">
              Qualificado
            </Badge>
          )}
        </div>
      )}

      <div className={cn('space-y-4', compact && 'flex flex-col gap-3')}>
        {/* Step 1: Intention */}
        <div className="space-y-2">
          <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
            Posicionamento do Causador
          </Label>
          <RadioGroup
            value={causerIntention || ''}
            onValueChange={(v) => setCauserIntention(v as any)}
            className="flex gap-2"
          >
            <div
              className={cn(
                'flex items-center space-x-2 px-3 py-2 rounded-md border flex-1 cursor-pointer transition-colors',
                causerIntention === 'assume'
                  ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                  : 'bg-white border-gray-200 hover:bg-gray-50',
              )}
            >
              <RadioGroupItem value="assume" id={`int-assume-${compact ? 'c' : 'f'}`} />
              <Label
                htmlFor={`int-assume-${compact ? 'c' : 'f'}`}
                className="text-sm cursor-pointer w-full text-gray-800 font-medium"
              >
                Assume e tem intenção de acordo
              </Label>
            </div>
            <div
              className={cn(
                'flex items-center space-x-2 px-3 py-2 rounded-md border flex-1 cursor-pointer transition-colors',
                causerIntention === 'nao_assume'
                  ? 'bg-red-50 border-red-400 shadow-sm ring-1 ring-red-400'
                  : 'bg-white border-gray-200 hover:bg-gray-50',
              )}
            >
              <RadioGroupItem value="nao_assume" id={`int-nao-${compact ? 'c' : 'f'}`} />
              <Label
                htmlFor={`int-nao-${compact ? 'c' : 'f'}`}
                className="text-sm cursor-pointer w-full text-gray-800 font-medium"
              >
                Não Assume Responsabilidade
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Step 2: Insurance (Only if assumes) */}
        {causerIntention === 'assume' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 pt-2 border-t border-dashed border-gray-200">
            <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
              Possui Seguro para Terceiros?
            </Label>
            <RadioGroup
              value={hasInsurance === null ? '' : hasInsurance ? 'yes' : 'no'}
              onValueChange={(v) => setHasInsurance(v === 'yes')}
              className="flex gap-2"
            >
              <div
                className={cn(
                  'flex items-center space-x-2 px-3 py-1.5 rounded-md border flex-1 cursor-pointer transition-colors',
                  hasInsurance === true
                    ? 'bg-green-50 border-green-400 shadow-sm'
                    : 'bg-white border-gray-200 hover:bg-gray-50',
                )}
              >
                <RadioGroupItem value="yes" id={`ins-yes-${compact ? 'c' : 'f'}`} />
                <Label
                  htmlFor={`ins-yes-${compact ? 'c' : 'f'}`}
                  className="text-sm cursor-pointer w-full text-gray-700"
                >
                  Sim, Possui Seguro
                </Label>
              </div>
              <div
                className={cn(
                  'flex items-center space-x-2 px-3 py-1.5 rounded-md border flex-1 cursor-pointer transition-colors',
                  hasInsurance === false
                    ? 'bg-orange-50 border-orange-400 shadow-sm'
                    : 'bg-white border-gray-200 hover:bg-gray-50',
                )}
              >
                <RadioGroupItem value="no" id={`ins-no-${compact ? 'c' : 'f'}`} />
                <Label
                  htmlFor={`ins-no-${compact ? 'c' : 'f'}`}
                  className="text-sm cursor-pointer w-full text-gray-700"
                >
                  Não (Sem Seguro)
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 3: Specific flows based on Insurance */}
        {causerIntention === 'assume' && hasInsurance === false && (
          <div className="flex items-center justify-between bg-white px-3 py-2 rounded-md border border-gray-200 animate-in slide-in-from-top-2 shadow-sm">
            <Label
              htmlFor={`wants-negotiate-${compact ? 'c' : 'f'}`}
              className="text-sm cursor-pointer text-gray-800 font-medium"
            >
              Acordo de valores sem vistoria presencial?
            </Label>
            <Switch
              id={`wants-negotiate-${compact ? 'c' : 'f'}`}
              checked={wantsToNegotiate}
              onCheckedChange={setWantsToNegotiate}
            />
          </div>
        )}

        {/* Status Indicators */}
        {causerIntention === 'nao_assume' && (
          <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded-md border border-red-200 font-medium animate-in fade-in zoom-in duration-300">
            Ação: Realizar Repescagem Confirmação e analisar Cobrança Judicial ou Baixa.
          </div>
        )}

        {isQualified && compact && (
          <div className="mt-2 text-[11px] text-green-800 bg-green-100 p-1.5 rounded border border-green-300 font-bold text-center animate-in fade-in zoom-in duration-300 shadow-sm">
            SINISTRO QUALIFICADO
          </div>
        )}
      </div>
    </div>
  )
}
