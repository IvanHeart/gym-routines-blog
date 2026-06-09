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
