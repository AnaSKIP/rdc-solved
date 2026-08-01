import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { MessageSquare, Send, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useKanbanStore } from '@/stores/useKanbanStore'

export function InternalChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  const { user } = useAuth()
  const { claims, setSelectedClaim } = useKanbanStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const isOpenRef = useRef(isOpen)

  useEffect(() => {
    isOpenRef.current = isOpen
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  useEffect(() => {
    const fetchMsgs = async () => {
      const { data } = await supabase
        .from('internal_messages')
        .select('*')
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }
    fetchMsgs()

    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
          if (!isOpenRef.current && payload.new.sender_id !== user?.id) {
            setUnreadCount((prev) => prev + 1)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !user) return
    const msg = input
    setInput('')
    await supabase.from('internal_messages').insert({
      sender_id: user.id,
      sender_email: user.email,
      content: msg,
    })
  }

  const renderMessageWithLinks = (content: string) => {
    const words = content.split(' ')

    return words.map((word, i) => {
      if (word.includes('/') && word.match(/\d/)) {
        const cleanRa = word.replace(/[^A-Za-z0-9/-]/g, '')
        return (
          <span
            key={i}
            className="text-blue-300 hover:text-white underline cursor-pointer font-bold mx-1 transition-colors"
            onClick={() => {
              const found = claims.find((c) => c.raNumber.includes(cleanRa))
              if (found) setSelectedClaim(found)
            }}
          >
            {word}
          </span>
        )
      }
      return <span key={i}> {word} </span>
    })
  }

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-solved hover:bg-solved-dark z-50 p-0 flex items-center justify-center transition-transform hover:scale-110"
        onClick={() => setIsOpen(!isOpen)}
        title="Chat da Equipe (Linke RAs!)"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            <MessageSquare className="h-6 w-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border-2 border-white text-[10px] font-bold text-white shadow-sm animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </Button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] h-[550px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between shadow-md z-10 shrink-0">
            <div className="flex flex-col">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-solved" /> Chat Interno Módulo 4
              </h3>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                Use formatos como 24346/2025 para auto-linkar.
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4 bg-gray-50/80">
            <div className="space-y-5">
              {messages.map((m) => {
                const isMe = m.sender_id === user?.id
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col animate-in fade-in zoom-in-95 ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-gray-400 font-medium mb-1 px-1">
                      {m.sender_email?.split('@')[0]}
                    </span>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${isMe ? 'bg-solved text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}
                    >
                      {renderMessageWithLinks(m.content)}
                    </div>
                  </div>
                )
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0 items-center">
            <Input
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="bg-gray-50 border-gray-200 focus-visible:ring-solved h-10 rounded-full px-4"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              className="bg-solved hover:bg-solved-dark shrink-0 h-10 w-10 rounded-full shadow-sm"
            >
              <Send className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
