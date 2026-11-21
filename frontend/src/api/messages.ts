// Client for conversations and messages (all require login and a match).
import { request } from './client.ts'
import type { Profile } from './profiles.ts'

export interface Message {
  id: string
  senderProfileId: string
  recipientProfileId: string
  body: string
  createdAt: string
  readAt: string | null
}

export interface Conversation {
  profile: Profile
  lastMessage: Message | null
  unreadCount: number
}

/** Conversations are identified by the other person's profile id. */
export const messagesApi = {
  conversations: () => request<Conversation[]>('/conversations'),
  list: (profileId: string, since?: string) =>
    request<Message[]>(
      `/conversations/${profileId}/messages${since ? `?since=${encodeURIComponent(since)}` : ''}`,
    ),
  send: (profileId: string, body: string) =>
    request<Message>(`/conversations/${profileId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  markRead: (profileId: string) =>
    request<void>(`/conversations/${profileId}/read`, { method: 'POST' }),
}
