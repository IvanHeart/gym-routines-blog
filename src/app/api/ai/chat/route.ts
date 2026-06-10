import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
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

    const contents = conversation.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }))

    const ai = new GoogleGenAI({ apiKey })

    // Retry up to 3 times on 503 (model overloaded), with 1s delay between attempts
    let lastError: unknown
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt))
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: { systemInstruction: systemPrompt },
        })
        return NextResponse.json({ reply: result.text ?? '' })
      } catch (err) {
        lastError = err
        const status = (err as { status?: number }).status
        if (status !== 503) throw err
      }
    }
    throw lastError
  } catch (error) {
    console.error('[AI Chat]', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
