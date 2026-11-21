import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, profilesApi, type Profile } from '../api/profiles.ts'

export function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
    if (!profile || !confirm(`Delete ${profile.name}'s profile?`)) return
    try {
      await profilesApi.remove(profile.id)
      navigate('/profiles')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete profile.')
    }
  }

  if (error) return <p className="errors">{error}</p>
  if (!profile) return <p className="muted">Loading…</p>

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
        <Link to={`/profiles/${profile.id}/edit`} className="button">
          Edit
        </Link>
        <button className="button danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </article>
  )
}
