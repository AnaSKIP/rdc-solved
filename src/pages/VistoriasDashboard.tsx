import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { TravelPlanningPanel } from '@/components/TravelPlanningPanel'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plane, Loader2, Calendar, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VistoriaClaim {
  id: string
  ra: string
  causer_name: string | null
  placa_onibus: string | null
  placa_causador: string | null
  causer_claim_number: string | null
  client_claim_number: string | null
  vistoria_date: string | null
}

export default function VistoriasDashboard() {
  const [claims, setClaims] = useState<VistoriaClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchClaims = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('claims')
      .select(
        'id, ra, causer_name, placa_onibus, placa_causador, causer_claim_number, client_claim_number, vistoria_date',
      )
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error && data) setClaims(data as VistoriaClaim[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  const filtered = claims.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.ra?.toLowerCase().includes(q) ||
      c.placa_onibus?.toLowerCase().includes(q) ||
      c.placa_causador?.toLowerCase().includes(q) ||
      c.causer_name?.toLowerCase().includes(q)
    )
  })

  const selectedClaim = claims.find((c) => c.id === selectedId)

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Plane className="w-5 h-5 text-green-600" /> Planejamento de Viagens
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestão de viagens e hospedagens para vistorias.
          </p>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar RA ou Placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64 bg-white border-gray-300 pl-9 shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-full sm:w-80 lg:w-96 border-r bg-white overflow-y-auto shrink-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando sinistros...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              Nenhum sinistro encontrado.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((claim) => (
                <button
                  key={claim.id}
                  onClick={() => setSelectedId(claim.id)}
                  className={cn(
                    'w-full text-left p-4 hover:bg-green-50/50 transition-colors',
                    selectedId === claim.id && 'bg-green-50 border-l-4 border-green-600',
                  )}
                >
                  <div className="font-bold text-gray-900 text-sm">{claim.ra}</div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                    {claim.placa_onibus && (
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                        Bus: {claim.placa_onibus}
                      </span>
                    )}
                    {claim.placa_causador && (
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                        Causador: {claim.placa_causador}
                      </span>
                    )}
                  </div>
                  {claim.causer_name && (
                    <div className="text-xs text-gray-600 mt-1">{claim.causer_name}</div>
                  )}
                  {claim.vistoria_date && (
                    <Badge
                      variant="outline"
                      className="mt-1 text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Calendar className="w-3 h-3 mr-1" />{' '}
                      {new Date(claim.vistoria_date).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {selectedId && selectedClaim ? (
            <TravelPlanningPanel
              claimId={selectedClaim.id}
              claimInfo={{
                causerClaimNumber: selectedClaim.causer_claim_number,
                clientClaimNumber: selectedClaim.client_claim_number,
                clientName: '',
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <Plane className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-80" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">Selecione um Sinistro</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Escolha um sinistro na lista ao lado para visualizar ou criar o planejamento de
                  viagem associado.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
