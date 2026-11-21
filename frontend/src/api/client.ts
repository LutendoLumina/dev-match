// Shared fetch wrapper for talking to the backend.

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

/** Error carrying the backend's message(s), e.g. validation failures. */
export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]

  constructor(status: number, messages: string[]) {
    super(messages.join(', '))
    this.status = status
    this.messages = messages
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    // Send the httpOnly login cookie with every request.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (!response.ok) {
    // NestJS errors look like { statusCode, message: string | string[], error }
    const body = await response.json().catch(() => null)
    const message = body?.message ?? response.statusText
    throw new ApiError(response.status, Array.isArray(message) ? message : [message])
  }

  return response.status === 204 ? (undefined as T) : response.json()
}
