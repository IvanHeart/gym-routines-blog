import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt, type ProductForAI } from '@/lib/ai/build-system-prompt'

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string().min(1).max(2000),
})

const RequestBodySchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RequestBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'messages requeridos' }, { status: 400 })
    }

    const { messages } = parsed.data

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('[AI Chat] GEMINI_API_KEY is not set')
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Fetch published products (name, slug, description, price, brand only)
    const supabase = await createClient()
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('name, slug, description, price, brand')
      .eq('published', true)
      .is('deleted_at', null)
      .order('name')

    if (dbError) throw dbError

    const systemPrompt = buildSystemPrompt((products ?? []) as ProductForAI[])

    // Strip the initial model welcome message — Gemini history must start with 'user'
    const conversation = messages.filter((m, i) => !(i === 0 && m.role === 'model'))

    if (conversation.length === 0) {
      return NextResponse.json({ error: 'No hay mensajes del usuario' }, { status: 400 })
    }

    // All messages except the last go into history; last message is sent via sendMessage
    const history = conversation.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }))

    const lastMessage = conversation[conversation.length - 1]

    if (!lastMessage) {
      return NextResponse.json({ error: 'No hay mensajes del usuario' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(lastMessage.text)
    const reply = result.response.text()

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[AI Chat]', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
