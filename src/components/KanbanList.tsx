import { KanbanClaim } from '@/stores/useKanbanStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatRaDisplay } from '@/lib/utils'
import { CalendarDays, AlertTriangle, Sparkles, User, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTagStyle } from './CaseTags'

interface KanbanListProps {
  claims: KanbanClaim[]
  onCardClick: (claim: KanbanClaim) => void
}

export function KanbanList({ claims, onCardClick }: KanbanListProps) {
  return (
    <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <TableRow className="hover:bg-gray-50 border-gray-200">
              <TableHead className="w-[180px] font-bold text-gray-700 uppercase text-xs">
                RA Original
              </TableHead>
              <TableHead className="font-bold text-gray-700 uppercase text-xs min-w-[200px]">
                Cliente
              </TableHead>
              <TableHead className="font-bold text-gray-700 uppercase text-xs">Estágio</TableHead>
              <TableHead className="font-bold text-gray-700 uppercase text-xs">
                Responsável
              </TableHead>
              <TableHead className="font-bold text-gray-700 uppercase text-xs">Abertura</TableHead>
              <TableHead className="font-bold text-gray-700 uppercase text-xs text-right">
                Idade
              </TableHead>
              <TableHead className="font-bold text-gray-700 uppercase text-xs text-right">
                Valor
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => {
              const { ra } = formatRaDisplay(claim.raNumber, claim.companyCnpj)
              const createdDate = claim.createdAt
                ? new Date(claim.createdAt)
                : new Date(claim.date || new Date())
              const daysOpen = Math.floor(
                (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24),
              )

              return (
                <TableRow
                  key={claim.id}
                  onClick={() => onCardClick(claim)}
                  className="cursor-pointer hover:bg-indigo-50/50 transition-colors group"
                >
                  <TableCell className="align-top py-4">
                    <div className="flex flex-col gap-2 items-start">
                      <span className="font-bold text-gray-900 group-hover:text-solved transition-colors whitespace-nowrap">
                        {ra}
                      </span>
                      {claim.hasPositiveInteraction && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 border-none px-1.5 h-5 text-[10px] gap-1 shadow-sm font-semibold"
                        >
                          <Sparkles className="w-3 h-3 text-green-600" /> Positivo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-semibold text-gray-800 line-clamp-2">
                        {claim.companyName || 'Desconhecido'}
                      </span>
                      {(!claim.placaCausador || !claim.dinamicaAcidente) && (
                        <div className="flex items-center gap-1.5 text-[10px] text-orange-600 font-medium bg-orange-50 w-fit px-1.5 py-0.5 rounded border border-orange-100">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> Dados Pendentes
                        </div>
                      )}
                      {claim.tags && claim.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {claim.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={cn(
                                'text-[9px] px-1.5 h-4 border-none shadow-sm font-semibold',
                                getTagStyle(tag),
                              )}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {claim.tags.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 h-4 bg-gray-100 text-gray-500 border-none"
                            >
                              +{claim.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-4">
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-300 font-semibold text-[11px] whitespace-nowrap shadow-sm"
                    >
                      {claim.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top py-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium bg-gray-50 w-fit px-2 py-1 rounded border border-gray-100">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {claim.analyst || 'Não Atribuído'}
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-4">
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                      {createdDate.toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell className="align-top py-4 text-right">
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-1 rounded-md border shadow-sm inline-block',
                        daysOpen > 30
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : daysOpen > 15
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-green-50 text-green-700 border-green-200',
                      )}
                    >
                      {daysOpen}d
                    </span>
                  </TableCell>
                  <TableCell className="align-top py-4 text-right">
                    <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-100 shadow-sm inline-block">
                      {(claim.financialTotalValue || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
            {claims.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-gray-500 font-medium">
                  Nenhum sinistro encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center shrink-0">
        <span>Mostrando {claims.length} registros</span>
        <span>A visualização em lista exporta o RA em seu formato original.</span>
      </div>
    </div>
  )
}
