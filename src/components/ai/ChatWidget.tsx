'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage } from '@/components/ai/ChatMessage'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'model'
  text: string
}

const WELCOME: Message = {
  role: 'model',
  text: '¡Hola! Soy tu asesor de ventas del gimnasio. Cuéntame tus metas de entrenamiento y te recomendaré los productos perfectos para ti. 💪',
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: Message = { role: 'user', text }
    const next = [...messages, userMessage]
    setMessages(next)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      if (!res.ok) throw new Error('bad response')
      const { reply } = await res.json()
      setMessages((prev) => [...prev, { role: 'model', text: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex h-[420px] w-80 flex-col rounded-xl border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Asesor de Ventas IA</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar panel"
            >
              <X />
            </Button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} text={msg.text} />
            ))}
            {isLoading && (
              <p className="px-1 text-xs text-muted-foreground">Escribiendo...</p>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={isLoading}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon-sm"
              disabled={!input.trim() || isLoading}
              aria-label="Enviar"
            >
              <Send />
            </Button>
          </form>
        </div>
      )}

      <Button
        size="icon-lg"
        onClick={() => setIsOpen((v) => !v)}
        className="rounded-full shadow-lg"
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        {isOpen ? <X /> : <MessageCircle />}
      </Button>
    </div>
  )
}
