import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  Camera,
  AlertTriangle,
  Calendar as CalendarIcon,
  DollarSign,
  Bus,
  Sparkles,
  Link as LinkIcon,
  Check,
  ChevronsUpDown,
  Loader2,
  Upload,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { NegotiationPanel } from './NegotiationPanel'
import { AgreementPanel } from './AgreementPanel'
import { CaseTags } from './CaseTags'
import { FinancialPanel } from './FinancialPanel'
import useCaseStore from '@/stores/useCaseStore'
import useKanbanStore from '@/stores/useKanbanStore'
import useContactStore from '@/stores/useContactStore'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { cn, formatRaDisplay } from '@/lib/utils'

const Field = ({
  label,
  value,
  help,
}: {
  label: string
  value: React.ReactNode
  help?: boolean
}) => (
  <div className="flex py-2 border-b border-gray-100 group transition-colors items-center">
    <div className="w-[35%] text-[13px] text-gray-600 font-semibold flex items-center uppercase tracking-wide">
      {label}
      {help && <span className="ml-1 text-[10px] text-blue-500 cursor-help">?</span>}
    </div>
    <div className="w-[65%] text-sm text-gray-900">{value}</div>
  </div>
)

const getReturnDateSafe = (dateString?: string | null) => {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

export function CaseForm() {
  const {
    raNumber,
    setRaNumber,
    claimCategory,
    setClaimCategory,
    causerIntention,
    hasInsurance,
    vistoriaStatus,
    setVistoriaStatus,
    insuranceCompany,
    setInsuranceCompany,
    analystName,
    addActivity,
  } = useCaseStore()
  const { selectedClaim, updateClaim } = useKanbanStore()
  const { contacts } = useContactStore()
  const { toast } = useToast()

  const analystContact = (contacts || []).find(
    (c) =>
      c?.name &&
      analystName &&
      c.name.toString().toLowerCase() === analystName.toString().toLowerCase(),
  )

  const [openSeguradora, setOpenSeguradora] = useState(false)
  const [openCliente, setOpenCliente] = useState(false)

  const seguradoras = (contacts || []).filter((c) =>
    c.category?.toLowerCase().includes('seguradora'),
  )
  const clientes = (contacts || []).filter(
    (c) => c.category === 'Cliente' || c.category?.toLowerCase() === 'cliente',
  )

  const [placaOnibus, setPlacaOnibus] = useState(selectedClaim?.placaOnibus || '')
  const [prefixoOnibus, setPrefixoOnibus] = useState(selectedClaim?.prefixoOnibus || '')
  const [claimDate, setClaimDate] = useState(
    selectedClaim?.rawDate ? selectedClaim.rawDate.slice(0, 10) : '',
  )
  const [returnDate, setReturnDate] = useState(getReturnDateSafe(selectedClaim?.returnScheduledAt))
  const [returnSubject, setReturnSubject] = useState(selectedClaim?.returnSubject || '')

  const [vistoriaDate, setVistoriaDate] = useState(getReturnDateSafe(selectedClaim?.vistoriaDate))
  const [vistoriaLink, setVistoriaLink] = useState(selectedClaim?.vistoriaLink || '')
  const [judicialProcessNumber, setJudicialProcessNumber] = useState(
    selectedClaim?.judicialProcessNumber || '',
  )

  const [placaCausador, setPlacaCausador] = useState(selectedClaim?.placaCausador || '')
  const [dinamicaAcidente, setDinamicaAcidente] = useState(selectedClaim?.dinamicaAcidente || '')
  const [causerName, setCauserName] = useState(selectedClaim?.causerName || '')
  const [causerPhone, setCauserPhone] = useState(selectedClaim?.causerPhone || '')
  const [causerDocument, setCauserDocument] = useState(selectedClaim?.causerDocument || '')
  const [tipoVeiculoCausador, setTipoVeiculoCausador] = useState(
    selectedClaim?.tipoVeiculoCausador || '',
  )

  // Novos campos do Causador / Proprietário
  const [causerEndereco, setCauserEndereco] = useState(
    selectedClaim?.causerEndereco || selectedClaim?.causer_endereco || '',
  )
  const [proprietarioNome, setProprietarioNome] = useState(
    selectedClaim?.proprietarioVeiculoCausador ||
      selectedClaim?.proprietario_veiculo_causador ||
      '',
  )
  const [proprietarioTelefone, setProprietarioTelefone] = useState(
    selectedClaim?.proprietarioTelefone || selectedClaim?.proprietario_telefone || '',
  )

  const [causerClaimNumber, setCauserClaimNumberLocal] = useState(
    selectedClaim?.causerClaimNumber || '',
  )
  const [clientClaimNumber, setClientClaimNumberLocal] = useState(
    selectedClaim?.clientClaimNumber || '',
  )

  const [assumedClaimValue, setAssumedClaimValue] = useState(
    selectedClaim?.financialTotalValue || 0,
  )

  const [isEnriching, setIsEnriching] = useState(false)

  const handleEnriquecer = async () => {
    setIsEnriching(true)
    try {
      let extractedData: any = {}

      // 1. Consultar Infocar / SCI se tiver placa
      if (placaCausador) {
        toast({
          title: '🔍 Consultando Bases Externas',
          description: 'Buscando informações oficiais do veículo e proprietário...',
        })

        const { data: externalData } = await supabase.functions.invoke('enrich-infocar-sci', {
          body: { placa: placaCausador },
        })

        if (externalData && externalData.success && externalData.data) {
          extractedData = { ...extractedData, ...externalData.data }
        } else if (externalData && externalData.message) {
          toast({
            title: 'Aviso de Consulta',
            description: externalData.message,
            variant: 'destructive',
          })
        }
      }

      // 2. Extrair dados dos anexos reais (B.O. / Relatório)
      toast({
        title: '📄 Analisando Documentos',
        description: 'Processando B.O. para extração factual da dinâmica...',
      })

      const pdfAttachment = selectedClaim?.attachments?.find(
        (a) => a.file_type?.toLowerCase() === 'pdf' || a.url?.toLowerCase().endsWith('.pdf'),
      )

      if (pdfAttachment?.url) {
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke('process-pdf', {
          body: { fileUrl: pdfAttachment.url, fileName: pdfAttachment.file_name },
        })

        if (!pdfError && pdfData?.extracted) {
          extractedData = { ...extractedData, ...pdfData.extracted }
        }
      } else {
        toast({
          title: 'Aviso',
          description: 'Nenhum anexo PDF encontrado para extrair a dinâmica do B.O.',
          variant: 'destructive',
        })
      }

      // 3. Atualizar formulário com dados reais
      const updates: any = {}
      if (extractedData.causerName && !causerName) {
        updates.causerName = extractedData.causerName
        setCauserName(extractedData.causerName)
      }
      if (extractedData.causerDocument && !causerDocument) {
        updates.causerDocument = extractedData.causerDocument
        setCauserDocument(extractedData.causerDocument)
      }
      if (extractedData.causerPhone && !causerPhone) {
        updates.causerPhone = extractedData.causerPhone
        setCauserPhone(extractedData.causerPhone)
      }
      if (extractedData.marcaModelo && !tipoVeiculoCausador) {
        updates.tipoVeiculoCausador = extractedData.marcaModelo
        setTipoVeiculoCausador(extractedData.marcaModelo)
      }
      if (extractedData.placaCausador && !placaCausador) {
        updates.placaCausador = extractedData.placaCausador
        setPlacaCausador(extractedData.placaCausador)
      }
      if (extractedData.dinamica && !dinamicaAcidente) {
        updates.dinamicaAcidente = extractedData.dinamica
        setDinamicaAcidente(extractedData.dinamica)
      }

      // Novos campos de Proprietário e Endereço
      if (extractedData.causerEndereco && !causerEndereco) {
        updates.causerEndereco = extractedData.causerEndereco
        updates.causer_endereco = extractedData.causerEndereco
        setCauserEndereco(extractedData.causerEndereco)
      }
      if (extractedData.proprietarioNome && !proprietarioNome) {
        updates.proprietarioVeiculoCausador = extractedData.proprietarioNome
        updates.proprietario_veiculo_causador = extractedData.proprietarioNome
        setProprietarioNome(extractedData.proprietarioNome)
      }
      if (extractedData.proprietarioTelefone && !proprietarioTelefone) {
        updates.proprietarioTelefone = extractedData.proprietarioTelefone
        updates.proprietario_telefone = extractedData.proprietarioTelefone
        setProprietarioTelefone(extractedData.proprietarioTelefone)
      }

      if (Object.keys(updates).length > 0 && selectedClaim?.id) {
        updateClaim(selectedClaim.id.toString(), updates)
        toast({
          title: '✨ Dados Atualizados',
          description: 'Informações processadas e preenchidas com sucesso.',
          className: 'bg-green-50 border-green-200 text-green-900',
        })
      } else {
        toast({
          title: 'Sem novos dados',
          description: 'A consulta não retornou dados inéditos para preencher.',
        })
      }
    } catch (e: any) {
      toast({
        title: 'Erro no Processamento',
        description: e.message || 'Falha ao buscar dados externos.',
        variant: 'destructive',
      })
    } finally {
      setIsEnriching(false)
    }
  }

  useEffect(() => {
    setPlacaOnibus(selectedClaim?.placaOnibus || '')
    setPrefixoOnibus(selectedClaim?.prefixoOnibus || '')
    setClaimDate(selectedClaim?.rawDate ? selectedClaim.rawDate.slice(0, 10) : '')
    setReturnDate(getReturnDateSafe(selectedClaim?.returnScheduledAt))
    setReturnSubject(selectedClaim?.returnSubject || '')
    setVistoriaDate(getReturnDateSafe(selectedClaim?.vistoriaDate))
    setVistoriaLink(selectedClaim?.vistoriaLink || '')
    setJudicialProcessNumber(selectedClaim?.judicialProcessNumber || '')
    setPlacaCausador(selectedClaim?.placaCausador || '')
    setDinamicaAcidente(selectedClaim?.dinamicaAcidente || '')
    setCauserName(selectedClaim?.causerName || '')
    setCauserPhone(selectedClaim?.causerPhone || '')
    setCauserDocument(selectedClaim?.causerDocument || '')
    setTipoVeiculoCausador(selectedClaim?.tipoVeiculoCausador || '')

    setCauserEndereco(selectedClaim?.causerEndereco || selectedClaim?.causer_endereco || '')
    setProprietarioNome(
      selectedClaim?.proprietarioVeiculoCausador ||
        selectedClaim?.proprietario_veiculo_causador ||
        '',
    )
    setProprietarioTelefone(
      selectedClaim?.proprietarioTelefone || selectedClaim?.proprietario_telefone || '',
    )

    setCauserClaimNumberLocal(selectedClaim?.causerClaimNumber || '')
    setClientClaimNumberLocal(selectedClaim?.clientClaimNumber || '')
    setAssumedClaimValue(selectedClaim?.financialTotalValue || 0)
  }, [selectedClaim])

  // Lógica de mapeamento do cliente
  const clientIdValue =
    selectedClaim?.companyId || selectedClaim?.clientId || selectedClaim?.client_id
  const clientNameValue =
    selectedClaim?.companyName || selectedClaim?.cliente_nome || selectedClaim?.clientName

  const foundClientById = clientes.find((c) => c.id === clientIdValue)
  const foundClientByName = clientNameValue
    ? clientes.find(
        (c) =>
          c.name?.toLowerCase().includes(clientNameValue.toLowerCase()) ||
          clientNameValue.toLowerCase().includes(c.name?.toLowerCase()),
      )
    : undefined

  const currentClient = foundClientById || foundClientByName
  const displayClientName = currentClient?.name || clientNameValue || 'Selecione o cliente...'

  useEffect(() => {
    // Auto-vincular cliente se o ID estiver vazio mas achamos pelo nome
    if (selectedClaim?.id && !clientIdValue && foundClientByName) {
      if (selectedClaim.companyId !== foundClientByName.id) {
        updateClaim(selectedClaim.id.toString(), {
          companyId: foundClientByName.id,
          companyName: foundClientByName.name,
          companyCnpj: foundClientByName.cnpj || '',
        })
      }
    }
  }, [selectedClaim?.id, clientIdValue, foundClientByName, selectedClaim?.companyId, updateClaim])

  const handleSaveData = (updates: any, msg: string) => {
    if (selectedClaim?.id) {
      updateClaim(selectedClaim.id.toString(), updates)
      toast({ title: msg, className: 'bg-green-50 border-green-200' })
    }
  }

  const handleResolvePositiveInteraction = () => {
    if (selectedClaim?.id) {
      updateClaim(selectedClaim.id.toString(), { hasPositiveInteraction: false })
      toast({
        title: 'Atenção Finalizada',
        description: 'Você marcou a interação do lead como analisada.',
      })
    }
  }

  const commissionPct = assumedClaimValue >= 10000 ? 5 : 4
  const expectedGainValue = Math.max(0, assumedClaimValue * (commissionPct / 100) - 80)
  const expectedGain = expectedGainValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const displayRaStr = selectedClaim?.raNumber?.toString() || raNumber?.toString() || 'S/N'
  const { ra: displayRa, cnpj: displayCnpj } = formatRaDisplay(
    displayRaStr,
    selectedClaim?.companyCnpj || currentClient?.cnpj,
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto">
      {selectedClaim?.hasPositiveInteraction && (
        <Alert className="mb-6 border-green-500 bg-green-50 animate-in slide-in-from-top-2 shadow-sm">
          <Sparkles className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800 font-bold">
            Ação Requerida: Resposta Positiva Detectada
          </AlertTitle>
          <AlertDescription className="text-green-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
            <span>
              A inteligência do sistema identificou que o causador demonstrou interesse em negociar
              via WhatsApp. Verifique as mensagens na aba do painel lateral.
            </span>
            <Button
              size="sm"
              onClick={handleResolvePositiveInteraction}
              className="bg-green-600 hover:bg-green-700 text-white shrink-0 shadow-sm"
            >
              Marcar como Analisado
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white border border-gray-200 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-6 sm:p-8 relative overflow-hidden">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-light text-gray-900 tracking-tight">{displayRa}</h1>
              {selectedClaim?.returnScheduledAt && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-800 border-blue-200 flex flex-col items-start gap-0.5 shadow-sm mt-1 px-2 py-1"
                >
                  <span className="flex items-center gap-1 font-semibold">
                    <CalendarIcon className="w-3 h-3" /> Retorno:{' '}
                    {new Date(selectedClaim.returnScheduledAt).toLocaleString('pt-BR')}
                  </span>
                  {selectedClaim.returnSubject && (
                    <span className="text-[10px] opacity-80 font-normal">
                      Assunto: {selectedClaim.returnSubject}
                    </span>
                  )}
                </Badge>
              )}
            </div>
            {displayCnpj && (
              <div className="text-sm text-gray-500 font-medium flex items-center gap-1">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200 shadow-sm">
                  CNPJ: {displayCnpj}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-8 mt-4 bg-gray-50/80 p-4 rounded-lg border border-gray-100 shadow-inner">
            <div className="flex-1 min-w-[200px]">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-green-600" /> Receita Esperada (RA)
              </div>
              <div className="flex items-center gap-2 max-w-[200px]">
                <span className="text-xl text-gray-900 font-medium">R$</span>
                <Input
                  type="number"
                  value={assumedClaimValue || ''}
                  onChange={(e) => setAssumedClaimValue(Number(e.target.value))}
                  onBlur={() =>
                    handleSaveData({ financialTotalValue: assumedClaimValue }, 'Receita atualizada')
                  }
                  className="h-9 text-lg font-semibold bg-white border-gray-300 shadow-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-purple-600" /> Previsão de Ganho (Analista)
              </div>
              <div className="text-xl flex items-center gap-2 text-purple-700 font-bold">
                {expectedGain}
                <Badge
                  variant="secondary"
                  className="text-[10px] h-5 bg-purple-100 text-purple-800 border-none shadow-sm flex items-center gap-1"
                  title="Desconto fixo de vistoria (-R$ 80,00) aplicado"
                >
                  {commissionPct}% <span className="text-[8px] opacity-70">-R$80</span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
          <div>
            <CaseTags />

            <Field
              label="Classificação"
              value={
                <Select value={claimCategory} onValueChange={(v) => setClaimCategory(v as any)}>
                  <SelectTrigger className="h-8 text-sm bg-white border-gray-300 font-medium w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Postes (EDP, Cemig, Light, Enel)">
                      Postes (EDP, Cemig, Light, Enel)
                    </SelectItem>
                    <SelectItem value="Ônibus">Ônibus</SelectItem>
                    <SelectItem value="Não Classificado">Não Classificado</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <Field
              label="CLIENTE"
              value={
                <Popover open={openCliente} onOpenChange={setOpenCliente}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCliente}
                      className="w-full justify-between h-8 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50 text-solved"
                    >
                      <span className="truncate font-semibold">{displayClientName}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." className="h-9 text-sm" />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {clientes.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => {
                                if (selectedClaim?.id) {
                                  const newCnpj = c.cnpj || ''
                                  let newRa = selectedClaim.raNumber || ''

                                  let baseRa = newRa
                                  if (
                                    selectedClaim.companyCnpj &&
                                    newRa.includes(selectedClaim.companyCnpj)
                                  ) {
                                    baseRa = newRa.replace(`-${selectedClaim.companyCnpj}`, '')
                                  } else {
                                    const parts = newRa.split('-')
                                    if (parts.length > 2) {
                                      baseRa = parts.slice(0, 2).join('-').trim()
                                    }
                                  }

                                  if (newCnpj && !baseRa.includes(newCnpj)) {
                                    newRa = `${baseRa}-${newCnpj}`
                                  } else {
                                    newRa = baseRa
                                  }

                                  updateClaim(selectedClaim.id, {
                                    companyId: c.id,
                                    companyName: c.name,
                                    companyCnpj: newCnpj,
                                    raNumber: newRa,
                                  })
                                  setRaNumber(newRa)
                                }
                                setOpenCliente(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  currentClient?.id === c.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              }
            />
            <Field
              label="Analista"
              value={
                <span className="text-gray-900 font-medium">
                  {analystName?.toString() || 'N/A'}
                </span>
              }
            />

            <div className="mt-6 mb-2 flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-1">
              <Bus className="w-4 h-4 text-solved" /> Dados do Veículo Cliente
            </div>
            <div className="space-y-3 mb-6 p-3 bg-gray-50/50 rounded-md border border-gray-100">
              <div className="flex items-center gap-4">
                <Label className="w-24 text-xs text-gray-500 font-bold uppercase shrink-0">
                  Data Acidente
                </Label>
                <Input
                  type="date"
                  value={claimDate}
                  onChange={(e) => setClaimDate(e.target.value)}
                  onBlur={() =>
                    handleSaveData(
                      { rawDate: claimDate ? new Date(claimDate).toISOString() : null },
                      'Data do acidente salva',
                    )
                  }
                  className="h-8 text-sm bg-white flex-1"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24 text-xs text-gray-500 font-bold uppercase shrink-0">
                  Placa
                </Label>
                <Input
                  value={placaOnibus}
                  onChange={(e) => setPlacaOnibus(e.target.value.toUpperCase())}
                  onBlur={() =>
                    handleSaveData({ placaOnibus, prefixoOnibus }, 'Dados do veículo atualizados')
                  }
                  className="h-8 text-sm bg-white flex-1"
                  placeholder="Ex: ABC1234"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24 text-xs text-gray-500 font-bold uppercase shrink-0">
                  Prefixo
                </Label>
                <Input
                  value={prefixoOnibus}
                  onChange={(e) => setPrefixoOnibus(e.target.value)}
                  onBlur={() =>
                    handleSaveData({ placaOnibus, prefixoOnibus }, 'Dados do veículo atualizados')
                  }
                  className="h-8 text-sm bg-white flex-1"
                  placeholder="Ex: 1002"
                />
              </div>
            </div>

            <div className="mt-6 mb-2 flex items-center justify-between border-b pb-1">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-orange-500" /> Dados do Causador & Acidente
              </div>
              <div className="flex items-center gap-2">
                {(!placaCausador || !dinamicaAcidente || !causerName) && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 hidden sm:flex"
                  >
                    Incompleto
                  </Badge>
                )}
                <Button
                  size="sm"
                  onClick={handleEnriquecer}
                  disabled={isEnriching}
                  className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {isEnriching ? (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1.5" />
                  )}
                  Enriquecer
                </Button>
              </div>
            </div>
            <div className="space-y-3 mb-6 p-3 bg-orange-50/30 rounded-md border border-orange-100/50">
              <div className="flex items-center gap-4">
                <Label className="w-32 text-xs text-gray-500 font-bold uppercase shrink-0">
                  Nome Causador
                </Label>
                <Input
                  value={causerName}
                  onChange={(e) => setCauserName(e.target.value)}
                  onBlur={() => handleSaveData({ causerName }, 'Nome do causador atualizado')}
                  className="h-8 text-sm bg-white flex-1"
                  placeholder="Nome completo do causador"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-xs text-gray-500 font-bold uppercase shrink-0">
                  Telefone Causador
                </Label>
                <Input
                  value={causerPhone}
                  onChange={(e) => setCauserPhone(e.target.value)}
                  onBlur={() => handleSaveData({ causerPhone }, 'Telefone do causador atualizado')}
                  className="h-8 text-sm bg-white flex-1"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-xs text-gray-500 font-bold uppercase shrink-0">
                  CPF/CNPJ Causador
                </Label>
                <Input
                  value={causerDocument}
                  onChange={(e) => setCauserDocument(e.target.value)}
                  onBlur={() =>
                    handleSaveData({ causerDocument }, 'Documento do causador atualizado')
                  }
                  className="h-8 text-sm bg-white flex-1"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-xs text-gray-500 font-bold uppercase shrink-0">
                  Placa Causador
                </Label>
                <Input
                  value={placaCausador}
                  onChange={(e) => setPlacaCausador(e.target.value.toUpperCase())}
                  onBlur={() => handleSaveData({ placaCausador }, 'Placa do causador atualizada')}
                  className="h-8 text-sm bg-white flex-1"
                  placeholder="Ex: ABC1234"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-xs text-gray-500 font-bold uppercase shrink-0">
                  Marca / Modelo
                </Label>
                <Input
                  value={tipoVeiculoCausador}
                  onChange={(e) => setTipoVeiculoCausador(e.target.value.toUpperCase())}
                  onBlur={() =>
                    handleSaveData({ tipoVeiculoCausador }, 'Marca / Modelo atualizado')
                  }
                  className="h-8 text-sm bg-white flex-1"
                  placeholder="Ex: FORD / ECOSPORT"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-xs text-gray-500 font-bold uppercase shrink-0">
                  Endereço Causador
                </Label>
                <Input
                  value={causerEndereco}
                  onChange={(e) => setCauserEndereco(e.target.value)}
                  onBlur={() =>
                    handleSaveData(
                      { causerEndereco, causer_endereco: causerEndereco },
                      'Endereço do causador atualizado',
                    )
                  }
                  className="h-8 text-sm bg-white flex-1"
                  placeholder="Logradouro, Bairro, Cidade - UF"
                />
              </div>

              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-orange-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                    Dados do Proprietário (Legal)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-32 text-xs text-gray-500 font-bold uppercase shrink-0">
                    Nome Proprietário
                  </Label>
                  <Input
                    value={proprietarioNome}
                    onChange={(e) => setProprietarioNome(e.target.value)}
                    onBlur={() =>
                      handleSaveData(
                        {
                          proprietarioVeiculoCausador: proprietarioNome,
                          proprietario_veiculo_causador: proprietarioNome,
                        },
                        'Nome do proprietário atualizado',
                      )
                    }
                    className="h-8 text-sm bg-white flex-1 border-blue-200 focus-visible:ring-blue-500"
                    placeholder="Nome que consta no documento do veículo"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="w-32 text-xs text-gray-500 font-bold uppercase shrink-0">
                    Tel. Proprietário
                  </Label>
                  <Input
                    value={proprietarioTelefone}
                    onChange={(e) => setProprietarioTelefone(e.target.value)}
                    onBlur={() =>
                      handleSaveData(
                        { proprietarioTelefone, proprietario_telefone: proprietarioTelefone },
                        'Telefones do proprietário atualizados',
                      )
                    }
                    className="h-8 text-sm bg-white flex-1 border-blue-200 focus-visible:ring-blue-500"
                    placeholder="(00) 00000-0000, (11) 11111-1111"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-orange-200/50">
                <Label className="text-xs text-gray-500 font-bold uppercase">
                  Dinâmica do Acidente
                </Label>
                <textarea
                  value={dinamicaAcidente}
                  onChange={(e) => setDinamicaAcidente(e.target.value)}
                  onBlur={() => handleSaveData({ dinamicaAcidente }, 'Dinâmica atualizada')}
                  className="min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Resumo extraído do B.O. ou Relatório de ocorrência..."
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-6">
              <NegotiationPanel />
            </div>

            <div className="bg-blue-50/40 p-4 rounded-md border border-blue-200 mb-6 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-blue-900 uppercase text-sm tracking-wider">
                  Agendar Retorno
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-center">
                  <Input
                    type="datetime-local"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="h-9 bg-white shadow-sm flex-1"
                  />
                </div>
                <Input
                  placeholder="Assunto do retorno..."
                  value={returnSubject}
                  onChange={(e) => setReturnSubject(e.target.value)}
                  onBlur={() => handleSaveData({ returnSubject }, 'Assunto do retorno salvo')}
                  className="h-9 bg-white shadow-sm"
                />
                <Button
                  onClick={() => {
                    handleSaveData(
                      {
                        returnScheduledAt: returnDate ? new Date(returnDate).toISOString() : null,
                        returnSubject,
                      },
                      'Retorno agendado com sucesso!',
                    )
                    if (returnDate && selectedClaim?.id) {
                      addActivity({
                        claimId: selectedClaim.id,
                        type: 'system',
                        text: `Retorno de contato agendado para: ${new Date(returnDate).toLocaleString('pt-BR')}${returnSubject ? ` - Assunto: ${returnSubject}` : ''}`,
                      })
                    }
                  }}
                  className="h-9 bg-solved hover:bg-solved-dark text-white shadow-sm w-full"
                >
                  Salvar Agendamento
                </Button>
              </div>
            </div>

            {causerIntention === 'assume' && hasInsurance === true && (
              <div className="bg-green-50/50 p-4 rounded-md border border-green-200 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="w-5 h-5 text-green-700" />
                  <h3 className="font-bold text-green-900 uppercase text-sm tracking-wider">
                    Vistoria e Seguradora
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-semibold text-green-800 uppercase tracking-wider">
                      Seguradora
                    </Label>
                    <Popover open={openSeguradora} onOpenChange={setOpenSeguradora}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openSeguradora}
                          className="w-full justify-between h-8 text-sm font-normal bg-white border-green-200 hover:bg-green-50"
                        >
                          <span className="truncate">
                            {insuranceCompany
                              ? seguradoras.find(
                                  (s) => s.name.toLowerCase() === insuranceCompany.toLowerCase(),
                                )?.name || insuranceCompany
                              : 'Selecione a seguradora...'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar seguradora..."
                            className="h-9 text-sm"
                          />
                          <CommandList>
                            <CommandEmpty>Nenhuma seguradora encontrada.</CommandEmpty>
                            <CommandGroup>
                              {seguradoras.map((s) => (
                                <CommandItem
                                  key={s.id}
                                  value={s.name}
                                  onSelect={(currentValue) => {
                                    const selected = seguradoras.find(
                                      (x) => x.name.toLowerCase() === currentValue.toLowerCase(),
                                    )
                                    const newVal = selected ? selected.name : currentValue
                                    const finalVal = newVal === insuranceCompany ? '' : newVal
                                    setInsuranceCompany(finalVal)
                                    setOpenSeguradora(false)
                                    handleSaveData(
                                      { insuranceCompany: finalVal },
                                      'Seguradora salva',
                                    )
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      insuranceCompany === s.name ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  {s.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Select
                    value={vistoriaStatus}
                    onValueChange={(v) => {
                      setVistoriaStatus(v as any)
                      if (v === 'realizada' && selectedClaim?.id) {
                        addActivity({
                          claimId: selectedClaim.id,
                          type: 'vistoria',
                          text: `Status da vistoria atualizado para Realizada.`,
                        })
                      } else if (v === 'marcada' && selectedClaim?.id) {
                        addActivity({
                          claimId: selectedClaim.id,
                          type: 'vistoria',
                          text: `Status da vistoria atualizado para Marcada.`,
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 bg-white border-green-200">
                      <SelectValue placeholder="Status da Vistoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="marcada">Marcada</SelectItem>
                      <SelectItem value="realizada">Realizada</SelectItem>
                      <SelectItem value="dispensada">Dispensada</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-semibold text-green-800 uppercase tracking-wider">
                        Nº Sinistro Causador
                      </Label>
                      <Input
                        value={causerClaimNumber}
                        onChange={(e) => setCauserClaimNumberLocal(e.target.value)}
                        onBlur={() =>
                          handleSaveData({ causerClaimNumber }, 'Nº Sinistro Causador salvo')
                        }
                        className="h-8 text-sm bg-white border-green-200"
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-semibold text-green-800 uppercase tracking-wider">
                        Nº Sinistro Cliente
                      </Label>
                      <Input
                        value={clientClaimNumber}
                        onChange={(e) => setClientClaimNumberLocal(e.target.value)}
                        onBlur={() =>
                          handleSaveData({ clientClaimNumber }, 'Nº Sinistro Cliente salvo')
                        }
                        className="h-8 text-sm bg-white border-green-200"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Input
                      type="datetime-local"
                      value={vistoriaDate}
                      onChange={(e) => setVistoriaDate(e.target.value)}
                      onBlur={() => {
                        handleSaveData(
                          {
                            vistoriaDate: vistoriaDate
                              ? new Date(vistoriaDate).toISOString()
                              : null,
                          },
                          'Data de vistoria salva',
                        )
                        if (vistoriaDate && selectedClaim?.id) {
                          addActivity({
                            claimId: selectedClaim.id,
                            type: 'vistoria',
                            text: `Vistoria de constatação agendada para: ${new Date(vistoriaDate).toLocaleString('pt-BR')}`,
                          })
                        }
                      }}
                      className="h-8 text-sm bg-white border-green-200"
                      placeholder="Data Vistoria"
                    />
                  </div>
                  <div className="flex gap-2 items-center relative">
                    <LinkIcon className="absolute left-2 w-4 h-4 text-gray-400 z-10" />
                    <Input
                      value={vistoriaLink}
                      onChange={(e) => setVistoriaLink(e.target.value)}
                      onBlur={() => handleSaveData({ vistoriaLink }, 'Link da vistoria salvo')}
                      className="h-8 pl-8 text-sm bg-white border-green-200"
                      placeholder="Link do Laudo / Drive"
                    />
                  </div>

                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-green-200/50">
                    <Label className="text-[11px] font-semibold text-green-800 uppercase tracking-wider">
                      Documentos Complementares
                    </Label>
                    <div className="relative">
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            toast({
                              title: 'Documento anexado com sucesso!',
                              description: e.target.files[0].name,
                              className: 'bg-green-50 border-green-200 text-green-900',
                            })
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        className="w-full bg-white border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 gap-2 h-8 text-xs font-medium shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Anexar Documento
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <AgreementPanel />
            </div>

            <div className="mb-6">
              <FinancialPanel />
            </div>

            {causerIntention === 'nao_assume' && (
              <div className="bg-red-50/50 p-4 rounded-md border border-red-200 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-red-900 uppercase text-sm tracking-wider">
                    Ação Judicial
                  </h3>
                </div>
                <p className="text-xs text-red-800 mb-3">
                  Causador não assume. Caso encaminhado para o jurídico.
                </p>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-red-900 font-semibold">Número do Processo</Label>
                    <Input
                      value={judicialProcessNumber}
                      onChange={(e) => setJudicialProcessNumber(e.target.value)}
                      onBlur={() =>
                        handleSaveData({ judicialProcessNumber }, 'Nº do processo salvo')
                      }
                      placeholder="Ex: 0001234-56.2025.8.27.0001"
                      className="h-8 text-sm bg-white border-red-200 focus-visible:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
