import { Navigate, useNavigate } from 'react-router-dom'
import { profilesApi } from '../api/profiles.ts'
import { useAuth } from '../auth/useAuth.ts'
import { ProfileForm } from '../components/ProfileForm.tsx'

export function CreateProfilePage() {
  const navigate = useNavigate()
  const { user, refresh } = useAuth()

  // Each account has one profile; if it exists already, show it instead.
  if (user?.profileId) return <Navigate to={`/profiles/${user.profileId}`} replace />

  return (
    <>
      <h1>Create your profile</h1>
      <ProfileForm
        submitLabel="Create profile"
        onSubmit={async (values) => {
          const created = await profilesApi.create(values)
          await refresh()
          navigate(`/profiles/${created.id}`)
        }}
      />
    </>
  )
}
