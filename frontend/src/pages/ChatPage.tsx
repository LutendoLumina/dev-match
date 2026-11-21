import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client.ts'
import { messagesApi, type Message } from '../api/messages.ts'
import { profilesApi, type Profile } from '../api/profiles.ts'
import { useAuth } from '../auth/useAuth.ts'

/** How often to check for new messages. WebSockets would make this instant. */
const POLL_INTERVAL_MS = 4000

/** Add new messages to the list, skipping any we already have. */
function mergeMessages(current: Message[], incoming: Message[]) {
  const known = new Set(current.map((m) => m.id))
  const fresh = incoming.filter((m) => !known.has(m.id))
  return fresh.length ? [...current, ...fresh] : current
}

export function ChatPage() {
  const { profileId } = useParams<{ profileId: string }>()
  const { user } = useAuth()
  const [other, setOther] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  // The poller reads the latest messages through a ref, so it doesn't restart on every message.
  const messagesRef = useRef<Message[]>([])
  useEffect(() => {
    messagesRef.current = messages ?? []
  }, [messages])
  const loaded = messages !== null

  // Load the other person's profile and the conversation, then mark it read.
  useEffect(() => {
    profilesApi.get(profileId!).then(setOther).catch(() => {})
    messagesApi
      .list(profileId!)
      .then((initial) => {
        setMessages(initial)
        return messagesApi.markRead(profileId!)
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) setClosed(true)
        else setError('Could not load this conversation.')
      })
  }, [profileId])

  // Poll for new messages while the conversation is open and the tab is visible.
  useEffect(() => {
    if (!loaded || closed) return
    const timer = setInterval(async () => {
      if (document.hidden) return
      const last = messagesRef.current.at(-1)
      try {
        const incoming = await messagesApi.list(profileId!, last?.createdAt)
        const hasNewFromThem = incoming.some(
          (m) => m.senderProfileId === profileId && !messagesRef.current.some((k) => k.id === m.id),
        )
        setMessages((current) => mergeMessages(current ?? [], incoming))
        if (hasNewFromThem) await messagesApi.markRead(profileId!)
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) setClosed(true)
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [loaded, closed, profileId])

  // Keep the newest message in view.
  const messageCount = messages?.length ?? 0
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messageCount])

  async function handleSend(event: FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setError(null)
    try {
      const sent = await messagesApi.send(profileId!, body)
      setMessages((current) => mergeMessages(current ?? [], [sent]))
      setDraft('')
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) setClosed(true)
      else setError(e instanceof ApiError ? e.message : 'Message not sent.')
    } finally {
      setSending(false)
    }
  }

  const name = other?.name ?? '…'

  if (closed) {
    return (
      <div className="card">
        <p>You're not matched with {name} (anymore), so you can't message them.</p>
        <Link to="/matches">Back to your matches</Link>
      </div>
    )
  }

  return (
    <section className="chat card">
      <header className="chat-header">
        <Link to="/matches" className="muted small">
          ← Matches
        </Link>
        <Link to={`/profiles/${profileId}`} className="chat-title">
          <span className="avatar">{name.charAt(0).toUpperCase()}</span>
          <strong>{name}</strong>
        </Link>
      </header>

      <div className="chat-messages">
        {messages === null && !error && <p className="muted">Loading…</p>}
        {messages?.length === 0 && (
          <p className="muted chat-empty">You matched with {name}. Say hello! 👋</p>
        )}
        {messages?.map((message) => {
          const mine = message.senderProfileId === user?.profileId
          return (
            <div key={message.id} className={`bubble ${mine ? 'mine' : 'theirs'}`}>
              <p>{message.body}</p>
              <time className="small" dateTime={message.createdAt}>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="errors small">{error}</p>}

      <form className="chat-form" onSubmit={handleSend}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${name}`}
          maxLength={2000}
          aria-label="Message"
          autoFocus
        />
        <button type="submit" className="button" disabled={sending || !draft.trim()}>
          Send
        </button>
      </form>
    </section>
  )
}
