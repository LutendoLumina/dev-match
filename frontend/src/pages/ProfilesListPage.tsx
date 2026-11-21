import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { likesApi } from '../api/likes.ts'
import { profilesApi, type Profile } from '../api/profiles.ts'
import { useAuth } from '../auth/useAuth.ts'
import { ProfileCard } from '../components/ProfileCard.tsx'

export function ProfilesListPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profilesApi
      .list()
      .then(setProfiles)
      .catch(() => setError('Could not load profiles. Is the backend running?'))
  }, [])

  // Mark the profiles the logged-in user has liked.
  const canLike = Boolean(user?.profileId)
  useEffect(() => {
    if (!canLike) return
    likesApi
      .likedIds()
      .then((ids) => setLikedIds(new Set(ids)))
      .catch(() => {})
  }, [canLike])

  if (error) return <p className="errors">{error}</p>
  if (!profiles) return <p className="muted">Loading profiles…</p>

  return (
    <>
      <h1>Developers</h1>
      {profiles.length === 0 ? (
        <p className="muted">
          No profiles yet. <Link to="/profiles/new">Create the first one.</Link>
        </p>
      ) : (
        <ul className="grid">
          {profiles.map((profile) => (
            <li key={profile.id}>
              <ProfileCard
                profile={profile}
                badge={
                  profile.userId === user?.id
                    ? 'You'
                    : canLike && likedIds.has(profile.id)
                      ? '♥ Liked'
                      : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
