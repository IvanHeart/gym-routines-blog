// Tipo estándar de retorno para Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }
