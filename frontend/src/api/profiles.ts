// Client for the backend's /profiles endpoints.
import { request } from './client.ts'

export { ApiError } from './client.ts'

export interface Profile {
  id: string
  userId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface ProfileInput {
  name: string
  description: string
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
