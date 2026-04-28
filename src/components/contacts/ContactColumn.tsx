import { useState } from 'react'
import { ContactCard } from './ContactCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Shield, Briefcase, Building, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateContactModal } from './CreateContactModal'

interface Props {
  title: string
  data: any[]
  type: 'clients' | 'analysts' | 'insurers' | 'internal_team'
}

export function ContactColumn({ title, data, type }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const safeData = Array.isArray(data) ? data : []

  const getIcon = () => {
    switch (type) {
      case 'clients':
        return <Building className="w-4 h-4 text-blue-500" />
      case 'analysts':
        return <Briefcase className="w-4 h-4 text-orange-500" />
      case 'insurers':
        return <Shield className="w-4 h-4 text-purple-500" />
      case 'internal_team':
        return <Users className="w-4 h-4 text-green-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getBadgeColor = () => {
    switch (type) {
      case 'clients':
        return 'bg-blue-100 text-blue-800'
      case 'analysts':
        return 'bg-orange-100 text-orange-800'
      case 'insurers':
        return 'bg-purple-100 text-purple-800'
      case 'internal_team':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="font-semibold text-gray-800 tracking-tight">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getBadgeColor()}`}>
            {safeData.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 shadow-sm transition-all gap-1.5"
            onClick={() => setIsModalOpen(true)}
            title={`Novo ${title}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Novo
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-3">
        {safeData.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Nenhum registro encontrado nesta categoria.
          </div>
        ) : (
          safeData.map((item, idx) =>
            item?.id ? (
              <ContactCard key={item.id.toString() || idx} item={item} type={type} />
            ) : null,
          )
        )}
      </ScrollArea>

      <CreateContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={type} />
    </div>
  )
}
