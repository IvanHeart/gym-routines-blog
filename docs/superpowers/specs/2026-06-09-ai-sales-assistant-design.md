# Asistente de Ventas con IA — Diseño

**Fecha:** 2026-06-09
**Proyecto:** gym-routines-blog
**Estado:** Aprobado

---

## Objetivo

Integrar un asistente de ventas con inteligencia artificial en la plataforma, usando la API de Google Gemini, para recomendar productos de la tienda a los usuarios según sus metas y necesidades de entrenamiento. El asistente aparece como un widget flotante en todas las páginas excepto el panel de administración.

---

## Alcance

- Chat widget flotante (botón esquina inferior derecha)
- Aparece en todas las rutas **excepto** `/admin/*`
- El asistente solo responde sobre productos del catálogo de la tienda
- Preguntas fuera del tema reciben una respuesta de redireccionamiento amable
- El historial del chat persiste solo en la sesión actual del navegador (no se guarda en BD)

---

## API de IA

- **Proveedor:** Google Gemini
- **Modelo:** `gemini-1.5-flash`
- **Tier:** Gratuito (1,500 requests/día)
- **Variable de entorno:** `GEMINI_API_KEY`
- **SDK:** `@google/generative-ai`

---

## Arquitectura

```
[ChatWidget.tsx]
     ↓ POST /api/ai/chat  { messages: [...], }
[src/app/api/ai/chat/route.ts]
     ↓ Fetch productos publicados desde Supabase (nombre, descripción, precio, slug)
     ↓ Construye system prompt con catálogo + restricciones
     ↓ Llama a Gemini API (gemini-1.5-flash)
     ↓ Devuelve { reply: string }
[ChatWidget.tsx]
     ↓ Muestra respuesta en el panel de chat
```

### System prompt

```
Eres un asesor de ventas experto del gimnasio. Tu único objetivo es 
recomendar productos de nuestra tienda según las metas y necesidades 
del usuario.

REGLAS:
1. Solo puedes recomendar productos del catálogo que se te proporciona.
2. No respondas preguntas que no estén relacionadas con los productos 
   del gimnasio o el entrenamiento físico.
3. Si te preguntan algo fuera de tema, responde amablemente que solo 
   puedes ayudar con recomendaciones de productos.
4. Cuando recomiendes un producto, incluye su nombre, una razón clara 
   de por qué es adecuado para el usuario, y su link (/tienda/[slug]).
5. Responde siempre en español.
6. Sé conciso, amigable y orientado a ventas.

CATÁLOGO DE PRODUCTOS:
{products}
```

---

## Componentes

### `src/app/api/ai/chat/route.ts`
- Método: `POST`
- Body: `{ messages: { role: 'user' | 'model', text: string }[] }`
- Flujo:
  1. Valida que haya al menos un mensaje
  2. Obtiene todos los productos publicados de Supabase (id, nombre, descripción, precio, slug)
  3. Serializa el catálogo como JSON dentro del system prompt
  4. Llama a `gemini-1.5-flash` con el historial de mensajes
  5. Retorna `{ reply: string }`
- Error handling: responde `500` con mensaje genérico si falla Gemini

### `src/components/ai/ChatWidget.tsx`
- Botón flotante fijo en la esquina inferior derecha (`fixed bottom-6 right-6`)
- Al hacer clic abre/cierra un panel de chat (estado local `isOpen`)
- Estado local: `messages[]`, `input`, `isLoading`
- Envía el historial completo de la sesión en cada request a `/api/ai/chat`
- Muestra indicador de carga ("escribiendo...") mientras espera respuesta
- El panel tiene altura máxima con scroll para el historial

### `src/components/ai/ChatMessage.tsx`
- Renderiza una burbuja de mensaje
- Distingue visualmente mensajes del usuario (`user`) vs. del asistente (`model`)
- Soporta texto con links (renderiza `href` como `<a>` para navegar a productos)

---

## Modificaciones a archivos existentes

### `src/app/layout.tsx`
- Importar y renderizar `<ChatWidget />` dentro del `<body>` del layout raíz
- Al estar en el layout raíz (no en `src/app/admin/layout.tsx`), el widget aparece en todas las rutas excepto admin, que tiene su propio layout anidado

### `.env.local`
```
GEMINI_API_KEY=your_api_key_here
```

---

## Flujo de usuario

1. Usuario navega a cualquier página (ej. `/tienda`, `/rutinas/[slug]`, `/`)
2. Ve el botón flotante del asistente en la esquina inferior derecha
3. Hace clic → se abre el panel de chat con mensaje de bienvenida
4. Escribe su meta: *"quiero ganar músculo, ¿qué me recomiendas?"*
5. El asistente responde con 2-3 productos relevantes del catálogo con links
6. El usuario puede hacer click en el link y ser llevado al producto
7. Si pregunta algo off-topic → el asistente redirige amablemente al tema de productos

---

## Lo que NO incluye este diseño

- Persistencia del historial de chat en base de datos
- Autenticación requerida para usar el chat (es accesible para todos)
- Recomendaciones personalizadas basadas en historial de compras
- Análisis de conversaciones para el admin
