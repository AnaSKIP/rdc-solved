import { useState, useEffect } from 'react'
import useCaseStore from '@/stores/useCaseStore'
import { useToast } from '@/hooks/use-toast'
import {
  fetchTravelPlanByClaimId,
  upsertTravelPlan,
  fetchHotelKB,
  TravelPlan,
  TravelHotelKB,
} from '@/services/travel-planning'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Plane,
  Building2,
  Bus,
  DollarSign,
  Calendar,
  Upload,
  Search,
  MapPin,
  Save,
  Loader2,
  Info,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const DESTINATION_CITIES = [
  'Ribeirão Preto / São Carlos',
  'Belo Horizonte',
  'Vitória',
  'Vila Velha',
  'Outra',
]

interface TravelPlanningPanelProps {
  claimId?: string
  claimInfo?: {
    causerClaimNumber?: string | null
    clientClaimNumber?: string | null
    clientName?: string | null
  }
}

export function TravelPlanningPanel({ claimId, claimInfo }: TravelPlanningPanelProps) {
  const { addActivity, analystName } = useCaseStore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')

  const [planId, setPlanId] = useState<string | undefined>(undefined)
  const [destinationCity, setDestinationCity] = useState('Belo Horizonte')
  const [responsibleName, setResponsibleName] = useState(analystName || '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('Vistoria de Constatação')
  const [relatedCompany, setRelatedCompany] = useState('')
  const [status, setStatus] = useState('Pendente')

  // Hotel
  const [hotelName, setHotelName] = useState('')
  const [hotelDailyRate, setHotelDailyRate] = useState<number>(0)
  const [hotelQty, setHotelQty] = useState<number>(0)
  const [hotelStatus, setHotelStatus] = useState('A consultar')

  // Bus
  const [busCompanyLine, setBusCompanyLine] = useState('')
  const [busValue, setBusValue] = useState<number>(0)
  const [busDate, setBusDate] = useState('')
  const [busStatus, setBusStatus] = useState('A consultar')

  // Air
  const [airCompany, setAirCompany] = useState('')
  const [airRoute, setAirRoute] = useState('')
  const [airValue, setAirValue] = useState<number>(0)
  const [airDate, setAirDate] = useState('')
  const [airStatus, setAirStatus] = useState('A consultar')

  // Hotels KB
  const [hotelsKb, setHotelsKb] = useState<TravelHotelKB[]>([])
  const [searchKb, setSearchKb] = useState('')
  const [kbLoading, setKbLoading] = useState(false)

  // Derived Values
  const hotelTotal = (hotelDailyRate || 0) * (hotelQty || 0)
  const grandTotal = hotelTotal + (busValue || 0) + (airValue || 0)

  const causerClaimNo = claimInfo?.causerClaimNumber || 'N/I'
  const clientClaimNo = claimInfo?.clientClaimNumber || 'N/I'
  const clientName = claimInfo?.clientName || 'N/A'

  useEffect(() => {
    if (!claimId) return
    let isMounted = true

    const loadPlan = async () => {
      setLoading(true)
      const data = await fetchTravelPlanByClaimId(claimId)
      if (isMounted && data) {
        setPlanId(data.id)
        setDestinationCity(data.destination_city || 'Belo Horizonte')
        setResponsibleName(data.responsible_name || analystName || '')
        setStartDate(data.start_date ? data.start_date.slice(0, 10) : '')
        setEndDate(data.end_date ? data.end_date.slice(0, 10) : '')
        setReason(data.reason || 'Vistoria de Constatação')
        setRelatedCompany(data.related_company || clientName)
        setStatus(data.status || 'Pendente')

        setHotelName(data.hotel_name || '')
        setHotelDailyRate(data.hotel_daily_rate || 0)
        setHotelQty(data.hotel_qty || 0)
        setHotelStatus(data.hotel_status || 'A consultar')

        setBusCompanyLine(data.bus_company_line || '')
        setBusValue(data.bus_value || 0)
        setBusDate(data.bus_date ? data.bus_date.slice(0, 10) : '')
        setBusStatus(data.bus_status || 'A consultar')

        setAirCompany(data.air_company || '')
        setAirRoute(data.air_route || '')
        setAirValue(data.air_value || 0)
        setAirDate(data.air_date ? data.air_date.slice(0, 10) : '')
        setAirStatus(data.air_status || 'A consultar')
      } else if (isMounted) {
        setRelatedCompany(clientName)
        setResponsibleName(analystName || '')
      }
      setLoading(false)
    }

    loadPlan()
    return () => {
      isMounted = false
    }
  }, [claimId])

  useEffect(() => {
    let isMounted = true
    const loadKb = async () => {
      setKbLoading(true)
      const data = await fetchHotelKB(searchKb)
      if (isMounted) {
        setHotelsKb(data)
        setKbLoading(false)
      }
    }
    loadKb()
    return () => {
      isMounted = false
    }
  }, [searchKb])

  const handleSavePlan = async () => {
    if (!claimId) return
    setSaving(true)

    const isNew = !planId
    const payload: Partial<TravelPlan> & { claim_id: string } = {
      id: planId,
      claim_id: claimId,
      destination_city: destinationCity,
      responsible_name: responsibleName,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      reason,
      related_company: relatedCompany,
      status,

      hotel_name: hotelName,
      hotel_daily_rate: Number(hotelDailyRate) || 0,
      hotel_qty: Number(hotelQty) || 0,
      hotel_status: hotelStatus,

      bus_company_line: busCompanyLine,
      bus_value: Number(busValue) || 0,
      bus_date: busDate ? new Date(busDate).toISOString() : null,
      bus_status: busStatus,

      air_company: airCompany,
      air_route: airRoute,
      air_value: Number(airValue) || 0,
      air_date: airDate ? new Date(airDate).toISOString() : null,
      air_status: airStatus,
    }

    const saved = await upsertTravelPlan(payload)
    setSaving(false)

    if (saved) {
      setPlanId(saved.id)
      const formattedTotal = grandTotal.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
      const activityMsg = isNew
        ? `Planejamento de Viagem criado para ${destinationCity} (Status: ${status}, Total: ${formattedTotal})`
        : `Planejamento de Viagem atualizado: Destino ${destinationCity}, Status: ${status}, Total: ${formattedTotal}`

      addActivity({
        claimId,
        type: 'vistoria',
        text: activityMsg,
      })

      toast({
        title: 'Planejamento Salvo!',
        description: 'Os dados da viagem e custos foram atualizados com sucesso.',
        className: 'bg-green-50 border-green-200 text-green-900',
      })
    } else {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o planejamento de viagem.',
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string) => {
    const file = e.target.files?.[0]
    if (!file || !claimId) return

    toast({
      title: 'Enviando documento...',
      description: `Anexando ${file.name} ao processo...`,
    })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `viagem_${section}_${Date.now()}.${fileExt}`
      const filePath = `claims/${claimId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('claim-attachments')
        .upload(filePath, file)

      let publicUrl = ''
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('claim-attachments').getPublicUrl(filePath)
        publicUrl = urlData.publicUrl
      }

      await supabase.from('attachments').insert({
        claim_id: claimId,
        file_name: `[Viagem - ${section}] ${file.name}`,
        file_type: file.type,
        url: publicUrl || filePath,
      })

      addActivity({
        claimId,
        type: 'vistoria',
        text: `Comprovante de Viagem (${section}) anexado: ${file.name}`,
      })

      toast({
        title: 'Documento Anexado!',
        description: `O comprovante de ${section} foi salvo no histórico do sinistro.`,
        className: 'bg-green-50 border-green-200 text-green-900',
      })
    } catch (err: any) {
      toast({
        title: 'Falha no Anexo',
        description: err.message || 'Ocorreu um erro ao anexar o arquivo.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="bg-green-50 border border-green-600 rounded-md p-4 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-green-200">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-green-700" />
          <h3 className="font-bold text-green-900 uppercase text-sm tracking-wider">
            PLANEJAMENTO DE VIAGENS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-white border-green-300 text-green-800 text-[11px] font-semibold"
          >
            Status: {status}
          </Badge>
          <Button
            size="sm"
            onClick={handleSavePlan}
            disabled={saving || loading}
            className="h-8 bg-green-700 hover:bg-green-800 text-white text-xs font-bold gap-1 shadow-sm"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvar Viagem
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 p-2 bg-white/70 rounded border border-green-200 text-xs">
        <div>
          <span className="text-green-800 font-bold block uppercase text-[10px]">Cliente</span>
          <span className="text-gray-900 font-medium truncate block">{clientName}</span>
        </div>
        <div>
          <span className="text-green-800 font-bold block uppercase text-[10px]">
            Sinistro Causador
          </span>
          <span className="text-gray-900 font-medium truncate block">{causerClaimNo}</span>
        </div>
        <div>
          <span className="text-green-800 font-bold block uppercase text-[10px]">
            Sinistro Cliente
          </span>
          <span className="text-gray-900 font-medium truncate block">{clientClaimNo}</span>
        </div>
        <div>
          <span className="text-green-800 font-bold block uppercase text-[10px]">Cidade Alvo</span>
          <span className="text-gray-900 font-medium truncate block">{destinationCity}</span>
        </div>
      </div>

      <Tabs defaultValue="dados" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-green-100/80 p-1 h-auto grid grid-cols-3 gap-1 mb-3 border border-green-300">
          <TabsTrigger
            value="dados"
            className="data-[state=active]:bg-white data-[state=active]:text-green-900 text-green-800 font-bold text-xs uppercase"
          >
            <MapPin className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Dados da Viagem
          </TabsTrigger>
          <TabsTrigger
            value="valores"
            className="data-[state=active]:bg-white data-[state=active]:text-green-900 text-green-800 font-bold text-xs uppercase"
          >
            <DollarSign className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Valores da Viagem
          </TabsTrigger>
          <TabsTrigger
            value="hoteis"
            className="data-[state=active]:bg-white data-[state=active]:text-green-900 text-green-800 font-bold text-xs uppercase"
          >
            <Building2 className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Base de Hotéis
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DADOS DA VIAGEM */}
        <TabsContent value="dados" className="space-y-3 m-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-green-800 font-bold uppercase text-xs">
                Cidade de Destino
              </Label>
              <Select value={destinationCity} onValueChange={setDestinationCity}>
                <SelectTrigger className="h-8 bg-white border-green-300 text-sm rounded-md">
                  <SelectValue placeholder="Selecione a cidade..." />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATION_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-green-800 font-bold uppercase text-xs">Status da Viagem</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 bg-white border-green-300 text-sm rounded-md">
                  <SelectValue placeholder="Selecione o status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Agendada">Agendada</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-green-800 font-bold uppercase text-xs">
              Responsável pela viagem
            </Label>
            <Input
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              placeholder="Nome do vistoriador ou analista responsável"
              className="h-8 bg-white border-green-300 text-sm rounded-md"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-green-800 font-bold uppercase text-xs">Data de ida</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 bg-white border-green-300 text-sm rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-green-800 font-bold uppercase text-xs">Data de volta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 bg-white border-green-300 text-sm rounded-md"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-green-800 font-bold uppercase text-xs">Motivo da viagem</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Realização de vistoria de constatação na garagem"
              className="h-8 bg-white border-green-300 text-sm rounded-md"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <Label className="text-green-800 font-bold uppercase text-xs">
                Empresa de ônibus / cliente relacionado
              </Label>
              <span className="text-[10px] text-gray-500 font-normal">Opcional</span>
            </div>
            <Input
              value={relatedCompany}
              onChange={(e) => setRelatedCompany(e.target.value)}
              placeholder="Ex: Rápido D'Oeste / Viação Cidade"
              className="h-8 bg-white border-green-300 text-sm rounded-md"
            />
          </div>
        </TabsContent>

        {/* TAB 2: VALORES DA VIAGEM */}
        <TabsContent value="valores" className="space-y-4 m-0">
          {/* Hotel Section */}
          <div className="bg-white p-3 rounded-md border border-green-300 space-y-2">
            <div className="flex items-center justify-between border-b pb-1">
              <span className="text-green-800 font-bold uppercase text-xs flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> Hospedagem (Hotel)
              </span>
              <div className="relative">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileUpload(e, 'Hotel')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] bg-green-50 border-green-300 text-green-800 hover:bg-green-100 gap-1 font-semibold"
                >
                  <Upload className="w-3 h-3" /> Anexar Documento
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-700 font-semibold">Nome do Hotel</Label>
                <Input
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="Ex: Savassi Hotel / Hotel Gran Vivenzo"
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-700 font-semibold">Status Hospedagem</Label>
                <Select value={hotelStatus} onValueChange={setHotelStatus}>
                  <SelectTrigger className="h-8 text-sm bg-white border-gray-300 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A consultar">A consultar</SelectItem>
                    <SelectItem value="Reservado">Reservado</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <Label className="text-[11px] text-gray-600 font-medium">Diária (R$)</Label>
                <Input
                  type="number"
                  value={hotelDailyRate || ''}
                  onChange={(e) => setHotelDailyRate(Number(e.target.value))}
                  placeholder="0.00"
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-gray-600 font-medium">Qtd Diárias</Label>
                <Input
                  type="number"
                  value={hotelQty || ''}
                  onChange={(e) => setHotelQty(Number(e.target.value))}
                  placeholder="1"
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-green-800 font-bold">Total Hotel</Label>
                <div className="h-8 px-2 bg-green-50 border border-green-200 rounded-md flex items-center font-bold text-sm text-green-900">
                  {hotelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>
          </div>

          {/* Bus Section */}
          <div className="bg-white p-3 rounded-md border border-green-300 space-y-2">
            <div className="flex items-center justify-between border-b pb-1">
              <span className="text-green-800 font-bold uppercase text-xs flex items-center gap-1">
                <Bus className="w-3.5 h-3.5" /> Transporte Rodoviário (Ônibus)
              </span>
              <div className="relative">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileUpload(e, 'Ônibus')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] bg-green-50 border-green-300 text-green-800 hover:bg-green-100 gap-1 font-semibold"
                >
                  <Upload className="w-3 h-3" /> Anexar Documento
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-700 font-semibold">Empresa / Linha</Label>
                <Input
                  value={busCompanyLine}
                  onChange={(e) => setBusCompanyLine(e.target.value)}
                  placeholder="Ex: Viação Cometa - SP x Ribeirão"
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-700 font-semibold">Status Passagem</Label>
                <Select value={busStatus} onValueChange={setBusStatus}>
                  <SelectTrigger className="h-8 text-sm bg-white border-gray-300 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A consultar">A consultar</SelectItem>
                    <SelectItem value="Comprada">Comprada</SelectItem>
                    <SelectItem value="Paga">Paga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <Label className="text-[11px] text-gray-600 font-medium">Valor Passagem (R$)</Label>
                <Input
                  type="number"
                  value={busValue || ''}
                  onChange={(e) => setBusValue(Number(e.target.value))}
                  placeholder="0.00"
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-gray-600 font-medium">Data Passagem</Label>
                <Input
                  type="date"
                  value={busDate}
                  onChange={(e) => setBusDate(e.target.value)}
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Air Section */}
          <div className="bg-white p-3 rounded-md border border-green-300 space-y-2">
            <div className="flex items-center justify-between border-b pb-1">
              <span className="text-green-800 font-bold uppercase text-xs flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" /> Transporte Aéreo (Voo)
              </span>
              <div className="relative">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileUpload(e, 'Aéreo')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] bg-green-50 border-green-300 text-green-800 hover:bg-green-100 gap-1 font-semibold"
                >
                  <Upload className="w-3 h-3" /> Anexar Documento
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-700 font-semibold">Companhia Aérea</Label>
                <Input
                  value={airCompany}
                  onChange={(e) => setAirCompany(e.target.value)}
                  placeholder="Ex: Azul / LATAM / Gol"
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-700 font-semibold">Trecho</Label>
                <Input
                  value={airRoute}
                  onChange={(e) => setAirRoute(e.target.value)}
                  placeholder="Ex: GRU -> VIX (Ida e Volta)"
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-700 font-semibold">Status Voo</Label>
                <Select value={airStatus} onValueChange={setAirStatus}>
                  <SelectTrigger className="h-8 text-sm bg-white border-gray-300 rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A consultar">A consultar</SelectItem>
                    <SelectItem value="Comprada">Comprada</SelectItem>
                    <SelectItem value="Paga">Paga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <Label className="text-[11px] text-gray-600 font-medium">Valor Voo (R$)</Label>
                <Input
                  type="number"
                  value={airValue || ''}
                  onChange={(e) => setAirValue(Number(e.target.value))}
                  placeholder="0.00"
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
              <div>
                <Label className="text-[11px] text-gray-600 font-medium">Data do Voo</Label>
                <Input
                  type="date"
                  value={airDate}
                  onChange={(e) => setAirDate(e.target.value)}
                  className="h-8 text-sm bg-white border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-green-100 p-3 rounded-md border-2 border-green-600 flex items-center justify-between">
            <div>
              <span className="text-green-900 font-bold uppercase text-xs block">
                TOTAL DA VIAGEM
              </span>
              <span className="text-[11px] text-green-700 font-medium">
                Soma de Hospedagem + Passagem Rodoviária + Passagem Aérea
              </span>
            </div>
            <div className="text-2xl font-black text-green-950">
              {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: BASE DE HOTÉIS (READ-ONLY) */}
        <TabsContent value="hoteis" className="space-y-3 m-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
            <Input
              value={searchKb}
              onChange={(e) => setSearchKb(e.target.value)}
              placeholder="Buscar hotéis pesquisados por cidade..."
              className="pl-8 h-8 text-xs bg-white border-green-300 rounded-md"
            />
          </div>

          <div className="bg-white rounded-md border border-green-300 overflow-hidden text-xs">
            <div className="max-h-[220px] overflow-y-auto scrollbar-thin">
              {kbLoading ? (
                <div className="p-6 text-center text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-green-600" /> Carregando base de
                  hotéis...
                </div>
              ) : hotelsKb.length === 0 ? (
                <div className="p-6 text-center space-y-2 bg-green-50/40">
                  <Info className="w-6 h-6 text-green-600 mx-auto" />
                  <p className="font-bold text-gray-800 text-xs">
                    Nenhum hotel cadastrado no banco de dados.
                  </p>
                  <p className="text-[11px] text-gray-600 max-w-sm mx-auto leading-relaxed">
                    Para visualizar as opções de hospedagem pesquisadas (Ribeirão Preto, Belo
                    Horizonte, Vitória, Vila Velha), os registros devem ser importados para a tabela{' '}
                    <code className="bg-green-100 px-1 py-0.5 rounded text-green-900 font-mono text-[10px]">
                      travel_hotels_kb
                    </code>{' '}
                    no Supabase.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-green-100/70 border-b border-green-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 font-bold text-green-900 uppercase">Cidade Destino</th>
                      <th className="p-2 font-bold text-green-900 uppercase">Nome do Hotel</th>
                      <th className="p-2 font-bold text-green-900 uppercase">Preço Médio</th>
                      <th className="p-2 font-bold text-green-900 uppercase">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {hotelsKb.map((h) => (
                      <tr key={h.id} className="hover:bg-green-50/50">
                        <td className="p-2 font-semibold text-gray-900">{h.destination}</td>
                        <td className="p-2 text-gray-800 font-medium">
                          {h.hotel_name}
                          {h.link_ref && (
                            <a
                              href={
                                h.link_ref.startsWith('http') ? h.link_ref : `https://${h.link_ref}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center ml-1 text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                        <td className="p-2 text-green-800 font-bold">
                          {h.price_range || 'A consultar'}
                        </td>
                        <td className="p-2 text-gray-600 text-[11px]">{h.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
