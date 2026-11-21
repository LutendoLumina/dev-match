import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { likesApi } from '../api/likes.ts'
import type { Profile } from '../api/profiles.ts'
import { useAuth } from '../auth/useAuth.ts'
import { ProfileCard } from '../components/ProfileCard.tsx'

export function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Profile[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    likesApi
      .matches()
      .then(setMatches)
      .catch(() => setError('Could not load your matches.'))
  }, [])

  if (error) return <p className="errors">{error}</p>
  if (!matches) return <p className="muted">Loading matches…</p>

  return (
    <>
      <h1>Your matches</h1>
      {!user?.profileId ? (
        <p className="muted">
          <Link to="/profiles/new">Create your profile</Link> to start matching.
        </p>
      ) : matches.length === 0 ? (
        <p className="muted">
          No matches yet. <Link to="/profiles">Browse developers</Link> and like the ones you'd like
          to meet. When they like you back, they'll show up here.
        </p>
      ) : (
        <ul className="grid">
          {matches.map((profile) => (
            <li key={profile.id}>
              <ProfileCard profile={profile} badge="Match" />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
