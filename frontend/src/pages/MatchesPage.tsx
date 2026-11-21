import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { messagesApi, type Conversation } from '../api/messages.ts'
import { useAuth } from '../auth/useAuth.ts'

/** Inbox: every match, with the latest message and unread count. */
export function MatchesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasProfile = Boolean(user?.profileId)
  useEffect(() => {
    if (!hasProfile) return
    messagesApi
      .conversations()
      .then(setConversations)
      .catch(() => setError('Could not load your matches.'))
  }, [hasProfile])

  if (!hasProfile) {
    return (
      <>
        <h1>Your matches</h1>
        <p className="muted">
          <Link to="/profiles/new">Create your profile</Link> to start matching.
        </p>
      </>
    )
  }
  if (error) return <p className="errors">{error}</p>
  if (!conversations) return <p className="muted">Loading matches…</p>

  return (
    <>
      <h1>Your matches</h1>
      {conversations.length === 0 ? (
        <p className="muted">
          No matches yet. <Link to="/profiles">Browse developers</Link> and like the ones you'd like
          to meet. When they like you back, you can message them here.
        </p>
      ) : (
        <ul className="inbox card">
          {conversations.map(({ profile, lastMessage, unreadCount }) => (
            <li key={profile.id}>
              <Link to={`/matches/${profile.id}`} className="inbox-row">
                <span className="avatar">{profile.name.charAt(0).toUpperCase()}</span>
                <span className="inbox-text">
                  <strong>{profile.name}</strong>
                  <span className={unreadCount > 0 ? 'preview unread' : 'preview muted'}>
                    {lastMessage
                      ? `${lastMessage.senderProfileId === user?.profileId ? 'You: ' : ''}${lastMessage.body}`
                      : 'New match! Say hello 👋'}
                  </span>
                </span>
                {unreadCount > 0 && (
                  <span className="unread-count" aria-label={`${unreadCount} unread`}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
