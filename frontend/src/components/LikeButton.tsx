import { useState } from 'react'
import { ApiError } from '../api/client.ts'
import { likesApi } from '../api/likes.ts'

interface LikeButtonProps {
  profileId: string
  liked: boolean
  onChange: (liked: boolean, matched: boolean) => void
}

/** Toggles a like on a profile and reports whether it created a match. */
export function LikeButton({ profileId, liked, onChange }: LikeButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      if (liked) {
        await likesApi.unlike(profileId)
        onChange(false, false)
      } else {
        const { matched } = await likesApi.like(profileId)
        onChange(true, matched)
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        className={`button ${liked ? 'liked' : 'like'}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={liked}
      >
        {liked ? '♥ Liked' : '♡ Like'}
      </button>
      {error && <span className="errors small">{error}</span>}
    </>
  )
}
