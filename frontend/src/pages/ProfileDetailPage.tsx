import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, profilesApi, type Profile } from '../api/profiles.ts'
import { useAuth } from '../auth/useAuth.ts'

export function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profilesApi
      .get(id!)
      .then(setProfile)
      .catch((e) =>
        setError(e instanceof ApiError && e.status === 404 ? 'Profile not found.' : 'Could not load profile.'),
      )
  }, [id])

  async function handleDelete() {
    if (!profile || !confirm('Delete your profile? This cannot be undone.')) return
    try {
      await profilesApi.remove(profile.id)
      await refresh()
      navigate('/profiles')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete profile.')
    }
  }

  if (error) return <p className="errors">{error}</p>
  if (!profile) return <p className="muted">Loading…</p>

  const isOwner = user?.id === profile.userId

  return (
    <article className="card detail">
      <span className="avatar large">{profile.name.charAt(0).toUpperCase()}</span>
      <h1>{profile.name}</h1>
      <p>{profile.description}</p>
      <p className="muted small">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>

      <div className="actions">
        <Link to="/profiles" className="button secondary">
          Back
        </Link>
        {isOwner && (
          <>
            <Link to={`/profiles/${profile.id}/edit`} className="button">
              Edit
            </Link>
            <button className="button danger" onClick={handleDelete}>
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  )
}
