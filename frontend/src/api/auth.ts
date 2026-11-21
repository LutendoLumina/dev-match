// Client for the backend's /auth endpoints.
import { request } from './client.ts'

export interface User {
  id: string
  email: string
  profileId: string | null
}

export interface Credentials {
  email: string
  password: string
}

export const authApi = {
  register: (credentials: Credentials) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify(credentials) }),
  login: (credentials: Credentials) =>
    request<User>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/auth/me'),
}
