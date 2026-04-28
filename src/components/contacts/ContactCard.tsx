import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'

interface Props {
  item: any
  type: 'clients' | 'analysts' | 'insurers' | 'internal_team'
}

export function ContactCard({ item, type }: Props) {
  const navigate = useNavigate()

  if (!item) return null

  const name = item['RAZÃO SOCIAL'] || item.NOME || item.name || 'Desconhecido'
  const displayId = item.id ? item.id.toString() : ''

  return (
    <Card
      className="p-3 mb-2 bg-white shadow-sm border border-gray-100 hover:border-solved/50 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
      onClick={() => displayId && navigate(`/contatos/${displayId}`)}
    >
      <span className="text-sm font-semibold text-gray-800 truncate">{name?.toString()}</span>
      <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-2">
        Ver detalhes
      </span>
    </Card>
  )
}
