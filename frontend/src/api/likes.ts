// Client for likes and matches (all require login).
import { request } from './client.ts'
import type { Profile } from './profiles.ts'

export const likesApi = {
  /** Returns whether this like completed a match. */
  like: (profileId: string) =>
    request<{ matched: boolean }>(`/profiles/${profileId}/like`, { method: 'POST' }),
  unlike: (profileId: string) => request<void>(`/profiles/${profileId}/like`, { method: 'DELETE' }),
  /** Ids of the profiles the logged-in user has liked. */
  likedIds: () => request<string[]>('/likes'),
  matches: () => request<Profile[]>('/matches'),
}
