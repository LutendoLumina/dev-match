// Thin client for the backend's /profiles endpoints.

export interface Profile {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface ProfileInput {
  name: string
  description: string
}

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
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

export const profilesApi = {
  list: () => request<Profile[]>('/profiles'),
  get: (id: string) => request<Profile>(`/profiles/${id}`),
  create: (input: ProfileInput) =>
    request<Profile>('/profiles', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: ProfileInput) =>
    request<Profile>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/profiles/${id}`, { method: 'DELETE' }),
}
