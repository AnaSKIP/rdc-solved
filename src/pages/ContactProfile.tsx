import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Tag,
  Copy,
  FolderKanban,
  AlertTriangle,
  FileWarning,
  PercentSquare,
  FileText,
  MapPin,
  CheckCircle,
  Eye,
  RefreshCw,
  Upload,
  Trash2,
  Wallet,
} from 'lucide-react'
import useContactStore from '@/stores/useContactStore'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FilePreviewModal } from '@/components/FilePreviewModal'
import { fetchCNPJ } from '@/services/external'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export default function ContactProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contacts, contactClaims, updateContactClaim, updateRecord, analysts } = useContactStore()
  const { toast } = useToast()
  const { isAdmin } = useAuth()

  const foundContact = contacts.find((c) => c.id === id)
  const isCauser = id?.startsWith('causer-') || foundContact?.category === 'Causador'
  const isAnalyst = foundContact?.category === 'Colaborador Analista'
  const analystData = foundContact?.originalData

  const contact = foundContact || {
    id: id || '',
    name: id?.startsWith('client-')
      ? 'Cliente não identificado'
      : id?.startsWith('causer-')
        ? 'Causador não identificado'
        : 'Contato não encontrado no Store',
    category: (id?.startsWith('client-')
      ? 'Cliente'
      : id?.startsWith('causer-')
        ? 'Causador'
        : 'Desconhecido') as any,
    email: '---',
    phone: '---',
    cnpj: '---',
    address: '---',
    odooRef: id || '',
    driveLink: undefined,
    commissionRate: undefined,
    is_enriched: false,
  }

  const claimDetails = isCauser
    ? contactClaims[id as string] || {
        placaCausador: null,
        dinamicaAcidente: null,
        confidencePlaca: 0,
        confidenceDinamica: 0,
        assignedAnalyst: 'Distribuição Automática',
        is_enriched: false,
      }
    : null

  const isPlacaMissing = claimDetails
    ? !claimDetails.placaCausador || claimDetails.confidencePlaca < 70
    : false
  const isDinamicaMissing = claimDetails
    ? !claimDetails.dinamicaAcidente || claimDetails.confidenceDinamica < 70
    : false
  const hasMissingData = isPlacaMissing || isDinamicaMissing

  const [placaInput, setPlacaInput] = useState(claimDetails?.placaCausador || '')
  const [dinamicaInput, setDinamicaInput] = useState(claimDetails?.dinamicaAcidente || '')
  const [commissionInput, setCommissionInput] = useState(contact.commissionRate?.toString() || '')

  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)
  const [isEnriching, setIsEnriching] = useState(false)

  const [docIdentidadeInput, setDocIdentidadeInput] = useState(
    analystData?.documento_identidade_url || '',
  )
  const [comprovanteInput, setComprovanteInput] = useState(
    analystData?.comprovante_endereco_url || '',
  )
  const [comissaoAbaixoInput, setComissaoAbaixoInput] = useState(
    analystData?.['COMISSAO - 0 A 9.999,99']?.toString() || '',
  )
  const [comissaoAcimaInput, setComissaoAcimaInput] = useState(
    analystData?.['COMISSAO - 9.999,99 ACIMA']?.toString() || '',
  )
  const [mensalidadeInput, setMensalidadeInput] = useState(
    analystData?.MENSALIDADE?.toString() || '',
  )
  const [analystEmailInput, setAnalystEmailInput] = useState(analystData?.email || '')

  useEffect(() => {
    if (claimDetails) {
      setPlacaInput(claimDetails.placaCausador || '')
      setDinamicaInput(claimDetails.dinamicaAcidente || '')
    }
  }, [claimDetails?.placaCausador, claimDetails?.dinamicaAcidente])

  useEffect(() => {
    if (contact.commissionRate !== undefined && contact.commissionRate !== null) {
      setCommissionInput(contact.commissionRate.toString())
    }
  }, [contact.commissionRate])

  useEffect(() => {
    if (analystData) {
      setDocIdentidadeInput(analystData.documento_identidade_url || '')
      setComprovanteInput(analystData.comprovante_endereco_url || '')
      setComissaoAbaixoInput(analystData['COMISSAO - 0 A 9.999,99']?.toString() || '')
      setComissaoAcimaInput(analystData['COMISSAO - 9.999,99 ACIMA']?.toString() || '')
      setMensalidadeInput(analystData.MENSALIDADE?.toString() || '')
      setAnalystEmailInput(analystData.email || '')
    }
  }, [analystData])

  const handleCopyLink = () => {
    if (contact.driveLink) {
      navigator.clipboard.writeText(contact.driveLink)
      toast({
        title: 'Link copiado com sucesso!',
        description: 'Envie este link para o cliente realizar o upload seguro de novos sinistros.',
        className: 'bg-green-50 border-green-200 text-green-900',
      })
    }
  }

  const handleSaveClaim = (field: 'placaCausador' | 'dinamicaAcidente', value: string) => {
    if (id) {
      updateContactClaim(id, {
        [field]: value,
        ...(field === 'placaCausador' ? { confidencePlaca: 100 } : { confidenceDinamica: 100 }),
      })
      toast({
        title: 'Revisão Concluída',
        description: `O campo ${field === 'placaCausador' ? 'Placa do Causador' : 'Dinâmica do Acidente'} foi atualizado e validado manualmente.`,
        className: 'bg-green-50 border-green-200 text-green-900',
      })
    }
  }

  const handleSaveCommission = () => {
    const val = parseFloat(commissionInput)
    if (isNaN(val) || val < 0 || val > 100) {
      toast({
        title: 'Valor Inválido',
        description: 'A taxa de comissão deve ser um número entre 0 e 100.',
        variant: 'destructive',
      })
      return
    }
    if (id && foundContact) {
      updateRecord('clients', id, { COMISSÃO: val })
      toast({
        title: 'Dados Financeiros Atualizados',
        description: `Taxa de comissão salva com sucesso: ${val}%.`,
        className: 'bg-green-50 border-green-200 text-green-900',
      })
    }
  }

  const handleSaveAnalystField = (field: string, value: string, label: string) => {
    if (!id || !foundContact) return
    const numVal = parseFloat(value)
    const payload: any = { [field]: isNaN(numVal) ? null : numVal }
    updateRecord('analysts', id, payload)
    toast({
      title: 'Dados Financeiros Atualizados',
      description: `${label} salvo com sucesso.`,
      className: 'bg-green-50 border-green-200 text-green-900',
    })
  }

  const handleSaveAnalystEmail = async () => {
    if (!id || !foundContact) return

    const trimmedEmail = analystEmailInput.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      toast({
        title: 'E-mail Inválido',
        description: 'Por favor, insira um endereço de e-mail válido (ex: nome@dominio.com).',
        variant: 'destructive',
      })
      return
    }

    const duplicate = analysts.find(
      (a) => a.email?.toLowerCase() === trimmedEmail.toLowerCase() && a.id !== id,
    )
    if (duplicate) {
      toast({
        title: 'E-mail já cadastrado',
        description: 'Este e-mail já está sendo usado por outro colaborador.',
        variant: 'destructive',
      })
      return
    }

    if (trimmedEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', trimmedEmail)
        .maybeSingle()

      if (!profile) {
        toast({
          title: 'Atenção: E-mail não vinculado',
          description:
            'Este e-mail não corresponde a um usuário no sistema de autenticação. O colaborador deve usar este mesmo e-mail para acessar o sistema.',
          className: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        })
      }
    }

    updateRecord('analysts', id, { email: trimmedEmail || null })
  }

  const handleSaveDocument = (
    field: 'documento_identidade_url' | 'comprovante_endereco_url',
    value: string,
  ) => {
    if (!id || !foundContact) return
    updateRecord('analysts', id, { [field]: value || null })
    toast({
      title: 'Documento Salvo',
      description: 'O link do documento foi salvo com sucesso.',
      className: 'bg-green-50 border-green-200 text-green-900',
    })
  }

  const handleRemoveDocument = (field: 'documento_identidade_url' | 'comprovante_endereco_url') => {
    if (!isAdmin) {
      toast({
        title: 'Permissão Negada',
        description: 'Autorização de um Administrador é necessária.',
        variant: 'destructive',
      })
      return
    }
    if (!id || !foundContact) return
    updateRecord('analysts', id, { [field]: null })
    if (field === 'documento_identidade_url') setDocIdentidadeInput('')
    else setComprovanteInput('')
    toast({
      title: 'Documento Removido',
      description: 'O documento foi removido com sucesso.',
      className: 'bg-green-50 border-green-200 text-green-900',
    })
  }

  const handleEnrich = async () => {
    if (!contact.cnpj || contact.cnpj === '---') {
      toast({
        title: 'Atenção',
        description: '⚠️ Não foi possível buscar os dados automáticos. CNPJ não informado.',
        className: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      })
      return
    }
    setIsEnriching(true)
    try {
      const data = await fetchCNPJ(contact.cnpj)
      if (data.erro) {
        toast({
          title: 'Falha na Busca',
          description: `⚠️ Não foi possível buscar os dados automáticos para este CNPJ (${contact.cnpj}) no momento.`,
          className: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: `✅ Cadastro de ${data.razao_social || contact.name} enriquecido com sucesso!`,
          className: 'bg-green-50 border-green-200 text-green-900',
        })
        const targetType = contact.category === 'Cliente' ? 'clients' : 'analysts'
        if (foundContact) {
          updateRecord(targetType, contact.id, {
            is_enriched: true,
            name: data.razao_social || contact.name,
            address: `${data.logradouro || ''}, ${data.numero || ''} - ${data.municipio || ''}/${data.uf || ''}`,
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Erro de Rede',
        description: `⚠️ Serviço indisponível. Verifique sua conexão e tente novamente.`,
        className: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      })
    } finally {
      setIsEnriching(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0 hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            Perfil do Contato
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualização detalhada das informações do contato.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {hasMissingData && claimDetails && (
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-200 text-red-900 shadow-sm animate-in fade-in slide-in-from-top-2"
            >
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800 font-bold">
                Atenção: Revisão de Dados Pendente
              </AlertTitle>
              <AlertDescription className="text-red-700 mt-2">
                <p className="mb-2 text-sm">
                  A IA de extração de documentos encontrou problemas de confidência nos seguintes
                  campos. Por favor, verifique e insira os dados manualmente.
                </p>
                <ul className="list-disc list-inside ml-1 space-y-1 text-sm font-medium">
                  {isPlacaMissing && (
                    <li>
                      Placa do causador não identificada ou pendente (Confiança:{' '}
                      {claimDetails.confidencePlaca}%)
                    </li>
                  )}
                  {isDinamicaMissing && (
                    <li>
                      Dinâmica do acidente pendente (Confiança: {claimDetails.confidenceDinamica}%)
                    </li>
                  )}
                </ul>
                <div className="mt-3 text-xs bg-red-100 inline-block px-2 py-1 rounded text-red-800 font-semibold border border-red-200">
                  Analista Responsável: {claimDetails.assignedAnalyst}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="h-24 bg-gradient-to-r from-blue-50 to-solved/10 border-b border-gray-100"></div>
            <div className="px-6 pb-6 relative">
              <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-sm flex items-center justify-center -mt-10 mb-4 bg-solved/5">
                <User className="w-10 h-10 text-solved" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{contact.name}</h2>
                {(contact.is_enriched || claimDetails?.is_enriched) && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 self-start sm:self-auto hover:bg-green-200">
                    <CheckCircle className="w-3 h-3" /> Dados Enriquecidos
                  </Badge>
                )}
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-none hover:bg-blue-200 shadow-none mb-6 font-medium">
                {contact.category}
              </Badge>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Informações de Contato
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex items-center gap-1"
                      onClick={handleEnrich}
                      disabled={isEnriching}
                    >
                      <RefreshCw className={cn('w-3 h-3', isEnriching && 'animate-spin')} />
                      Enriquecer
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {contact.email && contact.email !== '---' && (
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{contact.phone || 'N/A'}</span>
                    </div>
                    {contact.cnpj && contact.cnpj !== '---' && (
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span>{contact.cnpj}</span>
                      </div>
                    )}
                    {contact.address && contact.address !== '---' && (
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="line-clamp-2">{contact.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Dados do Sistema
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span>ID: {contact.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>Ref Origem: {contact.odooRef}</span>
                    </div>
                  </div>
                </div>

                {contact.category === 'Cliente' && (
                  <div className="space-y-4 md:col-span-2 pt-6 mt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <PercentSquare className="w-5 h-5 text-green-600" />
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Dados Financeiros (Comissões)
                      </h3>
                    </div>
                    <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-sm font-semibold flex items-center gap-2 text-gray-800">
                          Taxa de Comissão RDC (%)
                        </Label>
                        <p className="text-xs text-gray-500">
                          Percentual cobrado pelo RDC sobre o valor recuperado para este cliente.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-24">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={commissionInput}
                            onChange={(e) => setCommissionInput(e.target.value)}
                            placeholder="Ex: 20"
                            className="bg-white pr-8 focus-visible:ring-green-500"
                          />
                          <span className="absolute right-3 top-2.5 text-sm text-gray-400">%</span>
                        </div>
                        <Button
                          onClick={handleSaveCommission}
                          className="bg-solved hover:bg-solved-dark text-white shadow-sm"
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isAnalyst && (
                  <div className="space-y-4 md:col-span-2 pt-6 mt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        E-mail do Colaborador
                      </h3>
                      {!isAdmin && (
                        <Badge className="bg-gray-100 text-gray-600 border-none text-[10px]">
                          Somente Leitura
                        </Badge>
                      )}
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-sm font-semibold text-gray-800">
                          E-mail de Acesso ao Sistema
                        </Label>
                        <p className="text-xs text-gray-500">
                          Este e-mail é a credencial única do colaborador para autenticação. Deve
                          ser o mesmo utilizado no cadastro de usuários.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <Input
                          type="email"
                          value={analystEmailInput}
                          onChange={(e) => setAnalystEmailInput(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="nome@rdccobrancas.com.br"
                          className="bg-white flex-1 sm:w-72 focus-visible:ring-blue-500 disabled:opacity-70"
                        />
                        {isAdmin && (
                          <Button
                            onClick={handleSaveAnalystEmail}
                            className="bg-solved hover:bg-solved-dark text-white shadow-sm shrink-0"
                          >
                            Salvar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isAnalyst && (
                  <div className="space-y-4 md:col-span-2 pt-6 mt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <PercentSquare className="w-5 h-5 text-green-600" />
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Dados Financeiros do Analista
                      </h3>
                      {!isAdmin && (
                        <Badge className="bg-gray-100 text-gray-600 border-none text-[10px]">
                          Somente Leitura
                        </Badge>
                      )}
                    </div>
                    <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                        <div className="space-y-1.5 flex-1">
                          <Label className="text-sm font-semibold text-gray-800">
                            Comissão - 0 a 9.999,99 (%)
                          </Label>
                          <p className="text-xs text-gray-500">
                            Percentual de comissão para valores até R$ 9.999,99.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative w-28">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={comissaoAbaixoInput}
                              onChange={(e) => setComissaoAbaixoInput(e.target.value)}
                              disabled={!isAdmin}
                              placeholder="Ex: 10"
                              className="bg-white pr-8 focus-visible:ring-green-500 disabled:opacity-70"
                            />
                            <span className="absolute right-3 top-2.5 text-sm text-gray-400">
                              %
                            </span>
                          </div>
                          {isAdmin && (
                            <Button
                              onClick={() =>
                                handleSaveAnalystField(
                                  'COMISSAO - 0 A 9.999,99',
                                  comissaoAbaixoInput,
                                  'Comissão 0-9.999,99',
                                )
                              }
                              className="bg-solved hover:bg-solved-dark text-white shadow-sm shrink-0"
                            >
                              Salvar
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                        <div className="space-y-1.5 flex-1">
                          <Label className="text-sm font-semibold text-gray-800">
                            Comissão - Acima de 9.999,99 (%)
                          </Label>
                          <p className="text-xs text-gray-500">
                            Percentual de comissão para valores acima de R$ 9.999,99.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative w-28">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={comissaoAcimaInput}
                              onChange={(e) => setComissaoAcimaInput(e.target.value)}
                              disabled={!isAdmin}
                              placeholder="Ex: 15"
                              className="bg-white pr-8 focus-visible:ring-green-500 disabled:opacity-70"
                            />
                            <span className="absolute right-3 top-2.5 text-sm text-gray-400">
                              %
                            </span>
                          </div>
                          {isAdmin && (
                            <Button
                              onClick={() =>
                                handleSaveAnalystField(
                                  'COMISSAO - 9.999,99 ACIMA',
                                  comissaoAcimaInput,
                                  'Comissão acima de 9.999,99',
                                )
                              }
                              className="bg-solved hover:bg-solved-dark text-white shadow-sm shrink-0"
                            >
                              Salvar
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center pt-3 border-t border-green-100">
                        <div className="space-y-1.5 flex-1">
                          <Label className="text-sm font-semibold flex items-center gap-2 text-gray-800">
                            <Wallet className="w-4 h-4 text-green-600" />
                            Mensalidade (R$)
                          </Label>
                          <p className="text-xs text-gray-500">
                            Valor da mensalidade paga pelo analista.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative w-32">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={mensalidadeInput}
                              onChange={(e) => setMensalidadeInput(e.target.value)}
                              disabled={!isAdmin}
                              placeholder="Ex: 2500.00"
                              className="bg-white pl-7 focus-visible:ring-green-500 disabled:opacity-70"
                            />
                            <span className="absolute left-3 top-2.5 text-sm text-gray-400">
                              R$
                            </span>
                          </div>
                          {isAdmin && (
                            <Button
                              onClick={() =>
                                handleSaveAnalystField(
                                  'MENSALIDADE',
                                  mensalidadeInput,
                                  'Mensalidade',
                                )
                              }
                              className="bg-solved hover:bg-solved-dark text-white shadow-sm shrink-0"
                            >
                              Salvar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isAnalyst && (
                  <div className="space-y-4 md:col-span-2 pt-6 mt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Documentos do Analista
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <Label className="text-sm font-semibold text-gray-800">
                              RG ou Carteira de Habilitação
                            </Label>
                            <p className="text-xs text-gray-500">
                              Informe o link do documento de identificação.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={docIdentidadeInput}
                            onChange={(e) => setDocIdentidadeInput(e.target.value)}
                            placeholder="https://exemplo.com/documento.pdf"
                            className="bg-white flex-1"
                          />
                          <Button
                            onClick={() =>
                              handleSaveDocument('documento_identidade_url', docIdentidadeInput)
                            }
                            size="sm"
                            className="bg-solved hover:bg-solved-dark text-white shrink-0 gap-1"
                          >
                            <Upload className="w-3.5 h-3.5" /> Salvar Link
                          </Button>
                          {analystData?.documento_identidade_url && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 gap-1"
                                onClick={() =>
                                  setPreviewFile({
                                    url: analystData.documento_identidade_url,
                                    name: 'documento_identidade.pdf',
                                    type: 'pdf',
                                  })
                                }
                              >
                                <Eye className="w-3.5 h-3.5" /> Visualizar
                              </Button>
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleRemoveDocument('documento_identidade_url')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remover
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <Label className="text-sm font-semibold text-gray-800">
                              Comprovante de Endereço
                            </Label>
                            <p className="text-xs text-gray-500">
                              Informe o link do comprovante de residência.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={comprovanteInput}
                            onChange={(e) => setComprovanteInput(e.target.value)}
                            placeholder="https://exemplo.com/comprovante.pdf"
                            className="bg-white flex-1"
                          />
                          <Button
                            onClick={() =>
                              handleSaveDocument('comprovante_endereco_url', comprovanteInput)
                            }
                            size="sm"
                            className="bg-solved hover:bg-solved-dark text-white shrink-0 gap-1"
                          >
                            <Upload className="w-3.5 h-3.5" /> Salvar Link
                          </Button>
                          {analystData?.comprovante_endereco_url && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 gap-1"
                                onClick={() =>
                                  setPreviewFile({
                                    url: analystData.comprovante_endereco_url,
                                    name: 'comprovante_endereco.pdf',
                                    type: 'pdf',
                                  })
                                }
                              >
                                <Eye className="w-3.5 h-3.5" /> Visualizar
                              </Button>
                              {isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => handleRemoveDocument('comprovante_endereco_url')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remover
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {contact.category === 'Cliente' && (
                  <div className="space-y-4 md:col-span-2 pt-6 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Portal de Submissão Segura
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Compartilhe o link abaixo com o cliente para que ele possa enviar documentos
                      de novos sinistros.
                    </p>
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                      <FolderKanban className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-gray-800">
                          Pasta Google Drive Exclusiva
                        </p>
                        <p className="text-xs text-gray-500 truncate" title={contact.driveLink}>
                          {contact.driveLink || 'Nenhum link gerado para este cliente.'}
                        </p>
                      </div>
                      {contact.driveLink && (
                        <Button
                          size="sm"
                          onClick={handleCopyLink}
                          className="shrink-0 gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900 shadow-sm"
                          variant="outline"
                        >
                          <Copy className="w-4 h-4" /> Copiar Link
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {claimDetails && (
                  <div className="space-y-4 md:col-span-2 pt-6 mt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <FileWarning className="w-5 h-5 text-solved" />
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Validação de Dados IA (Sinistro)
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                          Placa do Veículo Causador
                          {isPlacaMissing ? (
                            <Badge
                              variant="destructive"
                              className="h-4 px-1.5 text-[10px] bg-red-100 text-red-700 hover:bg-red-200 border-none"
                            >
                              Verificar
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 h-4 px-1.5 text-[10px] border-none hover:bg-green-200">
                              Validado
                            </Badge>
                          )}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={placaInput}
                            onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
                            placeholder="Ex: ABC1234"
                            className={
                              isPlacaMissing
                                ? 'border-red-300 focus-visible:ring-red-500 bg-white'
                                : 'bg-white'
                            }
                          />
                          <Button
                            onClick={() => handleSaveClaim('placaCausador', placaInput)}
                            disabled={!placaInput || placaInput === claimDetails.placaCausador}
                            size="sm"
                            className="shrink-0 bg-solved hover:bg-solved-dark text-white"
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 md:col-span-2 mt-2">
                        <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                          Dinâmica do Acidente
                          {isDinamicaMissing ? (
                            <Badge
                              variant="destructive"
                              className="h-4 px-1.5 text-[10px] bg-red-100 text-red-700 hover:bg-red-200 border-none"
                            >
                              Verificar
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 h-4 px-1.5 text-[10px] border-none hover:bg-green-200">
                              Validado
                            </Badge>
                          )}
                        </Label>
                        <div className="flex flex-col gap-3">
                          <Textarea
                            value={dinamicaInput}
                            onChange={(e) => setDinamicaInput(e.target.value)}
                            placeholder="Descreva a dinâmica do acidente..."
                            className={`min-h-[100px] bg-white ${isDinamicaMissing ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleSaveClaim('dinamicaAcidente', dinamicaInput)}
                              disabled={
                                !dinamicaInput || dinamicaInput === claimDetails.dinamicaAcidente
                              }
                              size="sm"
                              className="bg-solved hover:bg-solved-dark text-white"
                            >
                              Salvar Dinâmica
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
