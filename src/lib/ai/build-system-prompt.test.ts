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

  it('includes product price formatted with formatPrice', () => {
    const prompt = buildSystemPrompt(products)
    expect(prompt).toContain('$599.00')
    expect(prompt).toContain('$299.00')
  })

  it('returns a valid prompt with a note when the product list is empty', () => {
    const prompt = buildSystemPrompt([])
    expect(prompt).toContain('No hay productos disponibles actualmente.')
  })

  it('returns the rules section restricting off-topic responses', () => {
    const prompt = buildSystemPrompt(products)
    expect(prompt).toContain('Solo puedes recomendar productos')
  })
})
