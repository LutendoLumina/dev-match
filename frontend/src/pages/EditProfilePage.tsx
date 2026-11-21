import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { profilesApi, type Profile } from '../api/profiles.ts'
import { useAuth } from '../auth/useAuth.ts'
import { ProfileForm } from '../components/ProfileForm.tsx'

export function EditProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
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
  // The API would refuse anyway (403); this just avoids showing a useless form.
  if (profile.userId !== user?.id) return <Navigate to={`/profiles/${profile.id}`} replace />

  return (
    <>
      <h1>Edit your profile</h1>
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
