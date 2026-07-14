import { useState, useEffect, useMemo } from 'react'
import { Scale, Search, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { JudicialCaseDetail } from '@/components/JudicialCaseDetail'
import { fetchJudicialClaims, type JudicialClaim } from '@/services/judicial'

export default function JuridicoDashboard() {
  const [claims, setClaims] = useState<JudicialClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<JudicialClaim | null>(null)

  const loadClaims = async () => {
    setLoading(true)
    try {
      const data = await fetchJudicialClaims()
      setClaims(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadClaims()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return claims
    const q = search.toLowerCase()
    return claims.filter(
      (c) =>
        c.ra?.toLowerCase().includes(q) ||
        c.judicial_process_number?.toLowerCase().includes(q) ||
        c.client_name?.toLowerCase().includes(q) ||
        c.causer_name?.toLowerCase().includes(q),
    )
  }, [claims, search])

  if (selected) {
    return (
      <JudicialCaseDetail
        claim={selected}
        onBack={() => {
          setSelected(null)
          loadClaims()
        }}
        onUpdate={loadClaims}
      />
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Scale className="w-5 h-5 text-red-500" /> Ações Judiciais
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhamento de processos judiciais originados de recusas.
          </p>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Buscar RA, Processo, Cliente ou Causador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-80 bg-white border-gray-300 pl-9 shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Carregando processos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center p-8">
            <Scale className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Nenhum processo judicial</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Sinistros que evoluírem para litígio aparecerão aqui automaticamente quando receberem
              um número de processo judicial.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {['RA', 'Processo', 'Cliente', 'Causador', 'Placa', 'Status', 'Atualizado', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-solved">{c.ra}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.judicial_process_number || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.client_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.causer_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.placa_causador || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200 text-xs">
                      {c.judicial_status || 'Pendente'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
