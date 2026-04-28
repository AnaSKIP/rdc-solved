import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, UserSquare, ExternalLink } from 'lucide-react'

export interface ContactPreviewPopoverProps {
  contactId: string
  name: string
  category?: string
  email?: string
  phone?: string
}

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'Cliente':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Seguradora':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'Associação':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'Colaborador Analista':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Outros':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function ContactPreviewPopover({
  contactId,
  name,
  category,
  email,
  phone,
}: ContactPreviewPopoverProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent) => {
    if (open) {
      e.preventDefault()
      navigate(`/contatos/${contactId}`)
      setOpen(false)
    }
  }

  const handleViewProfile = () => {
    navigate(`/contatos/${contactId}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={handleClick}
          className="text-odoo font-medium underline decoration-dotted underline-offset-4 hover:text-odoo-dark hover:decoration-solid transition-all text-left truncate max-w-full inline-block"
          title="Clique para pré-visualizar, clique duas vezes para abrir o perfil"
        >
          {name}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 shadow-lg border-gray-200" align="start">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
              <UserSquare className="w-5 h-5 text-odoo" />
            </div>
            <div className="flex flex-col overflow-hidden w-full">
              <h4 className="font-semibold text-gray-900 truncate" title={name}>
                {name}
              </h4>
              {category && (
                <Badge
                  variant="outline"
                  className={`w-fit mt-1 text-[10px] px-1.5 py-0 shadow-none ${getCategoryColor(
                    category,
                  )}`}
                >
                  {category}
                </Badge>
              )}
            </div>
          </div>

          {(email || phone) && (
            <div className="flex flex-col gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100">
              {email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{phone}</span>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full bg-odoo hover:bg-odoo-dark text-white shadow-sm gap-2"
            onClick={handleViewProfile}
          >
            <ExternalLink className="w-4 h-4" />
            Ver Perfil Completo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
