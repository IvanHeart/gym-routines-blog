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
