import { useNavigate } from 'react-router-dom'
import { profilesApi } from '../api/profiles.ts'
import { ProfileForm } from '../components/ProfileForm.tsx'

export function CreateProfilePage() {
  const navigate = useNavigate()

  return (
    <>
      <h1>New profile</h1>
      <ProfileForm
        submitLabel="Create profile"
        onSubmit={async (values) => {
          const created = await profilesApi.create(values)
          navigate(`/profiles/${created.id}`)
        }}
      />
    </>
  )
}
