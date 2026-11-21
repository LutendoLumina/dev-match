import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { likesApi } from '../api/likes.ts'
import { ApiError, profilesApi, type Profile } from '../api/profiles.ts'
import { useAuth } from '../auth/useAuth.ts'
import { LikeButton } from '../components/LikeButton.tsx'

export function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [liked, setLiked] = useState(false)
  const [justMatched, setJustMatched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profilesApi
      .get(id!)
      .then(setProfile)
      .catch((e) =>
        setError(e instanceof ApiError && e.status === 404 ? 'Profile not found.' : 'Could not load profile.'),
      )
  }, [id])

  // Only users with a profile can like, so only they need to know what they've liked.
  const canLike = Boolean(user?.profileId)
  useEffect(() => {
    if (!canLike) return
    likesApi
      .likedIds()
      .then((ids) => setLiked(ids.includes(id!)))
      .catch(() => {})
  }, [canLike, id])

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
      {justMatched && (
        <div className="match-banner" role="status">
          🎉 It's a match! You and {profile.name} like each other.{' '}
          <Link to="/matches">See your matches</Link>
        </div>
      )}

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

        {!isOwner && canLike && (
          <LikeButton
            profileId={profile.id}
            liked={liked}
            onChange={(nowLiked, matched) => {
              setLiked(nowLiked)
              setJustMatched(matched)
            }}
          />
        )}

        {!isOwner && user && !canLike && (
          <Link to="/profiles/new" className="muted small">
            Create your profile to like people
          </Link>
        )}
        {!user && (
          <Link to="/login" className="muted small">
            Log in to like {profile.name}
          </Link>
        )}
      </div>
    </article>
  )
}
