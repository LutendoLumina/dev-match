import { Link } from 'react-router-dom'
import type { Profile } from '../api/profiles.ts'

/** Clickable summary of a profile, used in the browse and matches grids. */
export function ProfileCard({ profile, badge }: { profile: Profile; badge?: string }) {
  return (
    <Link to={`/profiles/${profile.id}`} className="card profile-card">
      <div className="profile-card-top">
        <span className="avatar">{profile.name.charAt(0).toUpperCase()}</span>
        {badge && <span className="badge">{badge}</span>}
      </div>
      <h2>{profile.name}</h2>
      <p>{profile.description}</p>
    </Link>
  )
}
