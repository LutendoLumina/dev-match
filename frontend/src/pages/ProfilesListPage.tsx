import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { profilesApi, type Profile } from '../api/profiles.ts'

export function ProfilesListPage() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profilesApi
      .list()
      .then(setProfiles)
      .catch(() => setError('Could not load profiles. Is the backend running?'))
  }, [])

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
              <Link to={`/profiles/${profile.id}`} className="card profile-card">
                <span className="avatar">{profile.name.charAt(0).toUpperCase()}</span>
                <h2>{profile.name}</h2>
                <p>{profile.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
