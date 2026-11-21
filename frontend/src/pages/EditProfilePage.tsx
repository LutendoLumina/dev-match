import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { profilesApi, type Profile } from '../api/profiles.ts'
import { ProfileForm } from '../components/ProfileForm.tsx'

export function EditProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    profilesApi
      .get(id!)
      .then(setProfile)
      .catch(() => setError('Could not load profile.'))
  }, [id])

  if (error) return <p className="errors">{error}</p>
  if (!profile) return <p className="muted">Loading…</p>

  return (
    <>
      <h1>Edit {profile.name}</h1>
      <ProfileForm
        initialValues={profile}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await profilesApi.update(profile.id, values)
          navigate(`/profiles/${profile.id}`)
        }}
      />
    </>
  )
}
