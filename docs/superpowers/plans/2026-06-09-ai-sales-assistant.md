# AI Sales Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating Gemini-powered chat widget to all non-admin pages that recommends products from the store based on user fitness goals.

**Architecture:** A `'use client'` `ChatWidget` component is mounted in the root layout (excluded from admin via Next.js nested layouts). It posts the full session message history to `/api/ai/chat`, which fetches published products from Supabase, builds a restricted system prompt, and calls `gemini-1.5-flash` to return a product recommendation reply.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase, `@google/generative-ai`, Vitest + React Testing Library, shadcn/ui (Button), Tailwind CSS v4, Lucide React icons.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `vitest.config.ts` | Configure Vitest with jsdom + path aliases |
| Create | `src/test/setup.ts` | Import `@testing-library/jest-dom` matchers |
| Create | `src/lib/ai/build-system-prompt.ts` | Pure function: build Gemini system prompt from product list |
| Create | `src/lib/ai/build-system-prompt.test.ts` | Unit tests for `buildSystemPrompt` |
| Create | `src/app/api/ai/chat/route.ts` | POST handler: validate → fetch products → call Gemini → return reply |
| Create | `src/components/ai/ChatMessage.tsx` | Message bubble; auto-links `/tienda/slug` patterns |
| Create | `src/components/ai/ChatMessage.test.tsx` | Unit tests for message rendering and link detection |
| Create | `src/components/ai/ChatWidget.tsx` | Floating chat widget with session-only history |
| Create | `src/components/ai/ChatWidget.test.tsx` | Unit tests for open/close and submit behavior |
| Modify | `src/app/layout.tsx` | Add `<ChatWidget />` after `<RegisterSW />` |
| Modify | `.env.local` | Add `GEMINI_API_KEY` |

---

## Task 1: Install dependencies and configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install the Gemini SDK and the React Vite plugin needed for JSX in tests**

```bash
npm install @google/generative-ai
npm install --save-dev @vitejs/plugin-react
```

Expected: both packages added to `package.json`, no errors.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add `GEMINI_API_KEY` to `.env.local`**

Open `.env.local` (create it if it doesn't exist) and add:

```
GEMINI_API_KEY=your_api_key_here
```

Get a free API key at https://aistudio.google.com/apikey — no credit card required.

- [ ] **Step 5: Verify the test runner works**

```bash
npm test
```

Expected: `No test files found` or `0 tests` — no errors, just no tests yet.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json package-lock.json
git commit -m "chore: install Gemini SDK and configure Vitest with jsdom"
```

---

## Task 2: Pure helper — `buildSystemPrompt` (TDD)

**Files:**
- Create: `src/lib/ai/build-system-prompt.ts`
- Create: `src/lib/ai/build-system-prompt.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/ai/build-system-prompt.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, type ProductForAI } from '@/lib/ai/build-system-prompt'

describe('buildSystemPrompt', () => {
  const products: ProductForAI[] = [
    {
      name: 'Proteína Whey Gold',
      slug: 'proteina-whey-gold',
      description: 'Proteína de suero de alta calidad.',
      price: 599,
      brand: 'Optimum Nutrition',
    },
    {
      name: 'Creatina Monohidrato',
      slug: 'creatina-monohidrato',
      description: 'Mejora la fuerza y recuperación muscular.',
      price: 299,
      brand: null,
    },
  ]

  it('includes each product name in the prompt', () => {
    const prompt = buildSystemPrompt(products)
    expect(prompt).toContain('Proteína Whey Gold')
    expect(prompt).toContain('Creatina Monohidrato')
  })

  it('includes each product slug as a /tienda/ link', () => {
    const prompt = buildSystemPrompt(products)
    expect(prompt).toContain('/tienda/proteina-whey-gold')
    expect(prompt).toContain('/tienda/creatina-monohidrato')
  })

  it('shows "Sin marca" when brand is null', () => {
    const prompt = buildSystemPrompt(products)
    expect(prompt).toContain('Sin marca')
  })

  it('includes product price', () => {
    const prompt = buildSystemPrompt(products)
    expect(prompt).toContain('599')
    expect(prompt).toContain('299')
  })

  it('returns the rules section restricting off-topic responses', () => {
    const prompt = buildSystemPrompt(products)
    expect(prompt).toContain('Solo puedes recomendar productos')
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '@/lib/ai/build-system-prompt'`

- [ ] **Step 3: Create `src/lib/ai/build-system-prompt.ts`**

```ts
export interface ProductForAI {
  name: string
  slug: string
  description: string
  price: number
  brand: string | null
}

export function buildSystemPrompt(products: ProductForAI[]): string {
  const catalog = products
    .map(
      (p) =>
        `- ${p.name} (${p.brand ?? 'Sin marca'}) | Precio: $${p.price} | Link: /tienda/${p.slug}\n  Descripción: ${p.description}`
    )
    .join('\n')

  return `Eres un asesor de ventas experto del gimnasio. Tu único objetivo es recomendar productos de nuestra tienda según las metas y necesidades del usuario.

REGLAS:
1. Solo puedes recomendar productos del catálogo que se te proporciona a continuación.
2. No respondas preguntas que no estén relacionadas con los productos del gimnasio o el entrenamiento físico.
3. Si te preguntan algo fuera de tema, responde amablemente que solo puedes ayudar con recomendaciones de productos del gimnasio.
4. Cuando recomiendes un producto, incluye su nombre, una razón clara de por qué es adecuado para el usuario, y su link exacto (/tienda/[slug]).
5. Responde siempre en español.
6. Sé conciso, amigable y orientado a ventas.
7. Recomienda máximo 3 productos por respuesta.

CATÁLOGO DE PRODUCTOS:
${catalog}`
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: 5 tests PASS in `build-system-prompt.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/build-system-prompt.ts src/lib/ai/build-system-prompt.test.ts
git commit -m "feat(ai): add buildSystemPrompt helper with tests"
```

---

## Task 3: API Route `/api/ai/chat`

**Files:**
- Create: `src/app/api/ai/chat/route.ts`

No unit test for the route handler itself — it requires live Supabase + Gemini connections. Manual testing is done in Task 5 when the widget is wired up.

- [ ] **Step 1: Create `src/app/api/ai/chat/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt, type ProductForAI } from '@/lib/ai/build-system-prompt'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages: ChatMessage[] = body.messages

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages requeridos' }, { status: 400 })
    }

    // Fetch published products (name, slug, description, price, brand only)
    const supabase = await createClient()
    const { data: products } = await supabase
      .from('products')
      .select('name, slug, description, price, brand')
      .eq('published', true)
      .is('deleted_at', null)
      .order('name')

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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
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
```

- [ ] **Step 2: Verify TypeScript compiles without errors**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/chat/route.ts
git commit -m "feat(ai): add Gemini chat API route"
```

---

## Task 4: `ChatMessage` component (TDD)

**Files:**
- Create: `src/components/ai/ChatMessage.tsx`
- Create: `src/components/ai/ChatMessage.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ai/ChatMessage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatMessage } from '@/components/ai/ChatMessage'

describe('ChatMessage', () => {
  it('renders the message text', () => {
    render(<ChatMessage role="user" text="Hola, quiero ganar músculo" />)
    expect(screen.getByText('Hola, quiero ganar músculo')).toBeInTheDocument()
  })

  it('renders a /tienda/ path as a clickable link', () => {
    render(
      <ChatMessage
        role="model"
        text="Te recomiendo ver /tienda/proteina-whey para tus metas."
      />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/tienda/proteina-whey')
  })

  it('renders surrounding text outside the link', () => {
    render(
      <ChatMessage
        role="model"
        text="Mira este producto /tienda/creatina aquí."
      />
    )
    expect(screen.getByText(/Mira este producto/)).toBeInTheDocument()
    expect(screen.getByText(/aquí\./)).toBeInTheDocument()
  })

  it('applies different styles for user vs model messages', () => {
    const { rerender, container } = render(
      <ChatMessage role="user" text="Mensaje de usuario" />
    )
    const userDiv = container.querySelector('[data-role="user"]')
    expect(userDiv).toBeInTheDocument()

    rerender(<ChatMessage role="model" text="Mensaje del modelo" />)
    const modelDiv = container.querySelector('[data-role="model"]')
    expect(modelDiv).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '@/components/ai/ChatMessage'`

- [ ] **Step 3: Create `src/components/ai/ChatMessage.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'user' | 'model'
  text: string
}

const PRODUCT_LINK_RE = /\/tienda\/[a-z0-9-]+/g

function parseLinks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  PRODUCT_LINK_RE.lastIndex = 0
  while ((match = PRODUCT_LINK_RE.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    parts.push(
      <Link
        key={match.index}
        href={match[0]}
        className="underline font-medium hover:opacity-80"
      >
        {match[0]}
      </Link>
    )
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(text.slice(last))
  }

  return parts.length > 0 ? parts : [text]
}

export function ChatMessage({ role, text }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      data-role={role}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {parseLinks(text)}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: 4 tests PASS in `ChatMessage.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/ChatMessage.tsx src/components/ai/ChatMessage.test.tsx
git commit -m "feat(ai): add ChatMessage component with product link parsing"
```

---

## Task 5: `ChatWidget` component (TDD)

**Files:**
- Create: `src/components/ai/ChatWidget.tsx`
- Create: `src/components/ai/ChatWidget.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ai/ChatWidget.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatWidget } from '@/components/ai/ChatWidget'

// jsdom does not implement scrollIntoView
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

describe('ChatWidget', () => {
  it('renders the open button and the panel is hidden by default', () => {
    render(<ChatWidget />)
    expect(screen.getByRole('button', { name: /abrir asistente/i })).toBeInTheDocument()
    expect(screen.queryByText('Asesor de Ventas IA')).not.toBeInTheDocument()
  })

  it('opens the panel when the toggle button is clicked', () => {
    render(<ChatWidget />)
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }))
    expect(screen.getByText('Asesor de Ventas IA')).toBeInTheDocument()
  })

  it('shows the welcome message when the panel opens', () => {
    render(<ChatWidget />)
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }))
    expect(screen.getByText(/asesor de ventas del gimnasio/i)).toBeInTheDocument()
  })

  it('closes the panel when the close button inside the panel is clicked', () => {
    render(<ChatWidget />)
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }))
    expect(screen.getByText('Asesor de Ventas IA')).toBeInTheDocument()

    // "Cerrar panel" targets the X button inside the panel header (distinct from the toggle button)
    fireEvent.click(screen.getByRole('button', { name: /cerrar panel/i }))
    expect(screen.queryByText('Asesor de Ventas IA')).not.toBeInTheDocument()
  })

  it('disables the send button when input is empty', () => {
    render(<ChatWidget />)
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }))
    const sendButton = screen.getByRole('button', { name: /enviar/i })
    expect(sendButton).toBeDisabled()
  })

  it('enables the send button when input has text', () => {
    render(<ChatWidget />)
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }))
    fireEvent.change(screen.getByPlaceholderText(/escribe tu pregunta/i), {
      target: { value: 'quiero ganar músculo' },
    })
    expect(screen.getByRole('button', { name: /enviar/i })).not.toBeDisabled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '@/components/ai/ChatWidget'`

- [ ] **Step 3: Create `src/components/ai/ChatWidget.tsx`**

```tsx
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: all tests PASS across all 3 test files.

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/ChatWidget.tsx src/components/ai/ChatWidget.test.tsx
git commit -m "feat(ai): add ChatWidget floating chat panel"
```

---

## Task 6: Wire `ChatWidget` into root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Import and add `ChatWidget` to the root layout**

Open `src/app/layout.tsx`. The current file ends with:

```tsx
                {children}
                <Toaster richColors position="top-right" />
                <RegisterSW />
              </CartProvider>
```

Change it to:

```tsx
                {children}
                <Toaster richColors position="top-right" />
                <RegisterSW />
                <ChatWidget />
              </CartProvider>
```

And add the import at the top of the file (after the existing imports):

```tsx
import { ChatWidget } from '@/components/ai/ChatWidget'
```

The widget will **not** appear on `/admin/*` routes because admin pages use their own nested layout (`src/app/admin/layout.tsx`) which does not extend the root layout's `<body>` tree — the `ChatWidget` in the root layout is rendered outside the admin layout subtree.

- [ ] **Step 2: Run type-check to confirm no errors**

```bash
npm run type-check
```

Expected: no TypeScript errors.

- [ ] **Step 3: Start the dev server and manually verify the widget**

```bash
npm run dev
```

- Open http://localhost:3000 — verify the floating chat button appears in the bottom-right corner
- Click it — verify the panel opens with the welcome message
- Type "quiero ganar músculo" — verify the AI responds with product recommendations that include `/tienda/` links
- Click a product link — verify it navigates to the product page
- Ask "¿Cuál es la capital de Francia?" — verify the AI politely redirects to products
- Navigate to http://localhost:3000/admin — verify the chat button does **not** appear

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(ai): mount ChatWidget in root layout (excluded from admin)"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Google Gemini `gemini-1.5-flash` | Task 3 |
| `GEMINI_API_KEY` env var | Task 1 |
| Only responds about products in catalog | Task 2 (system prompt rules) |
| Off-topic → polite redirect | Task 2 (system prompt rule 3) |
| Floating button, fixed bottom-right | Task 5 |
| Appears on all pages except `/admin/*` | Task 6 |
| Session-only history (no DB persistence) | Task 5 (state is local) |
| Links to `/tienda/[slug]` | Task 4 (parseLinks) |
| Fetch products from Supabase | Task 3 |
| Welcome message on open | Task 5 |
| Loading indicator while waiting | Task 5 |
