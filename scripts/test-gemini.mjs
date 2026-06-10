// Diagnóstico: lista los modelos disponibles con tu API key
// Uso: node scripts/test-gemini.mjs TU_API_KEY

const apiKey = process.argv[2]

if (!apiKey) {
  console.error('Uso: node scripts/test-gemini.mjs TU_API_KEY')
  process.exit(1)
}

console.log('Listando modelos disponibles...\n')

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
)
const data = await res.json()

if (!res.ok) {
  console.error('Error:', JSON.stringify(data, null, 2))
  process.exit(1)
}

const names = data.models
  .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
  .map((m) => m.name)

console.log('Modelos con soporte generateContent:')
names.forEach((n) => console.log(' -', n))
