import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { ProfilesListPage } from './pages/ProfilesListPage.tsx'
import { ProfileDetailPage } from './pages/ProfileDetailPage.tsx'
import { CreateProfilePage } from './pages/CreateProfilePage.tsx'
import { EditProfilePage } from './pages/EditProfilePage.tsx'

export default function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/profiles" className="logo">
          dev<span>match</span>
        </Link>
        <Link to="/profiles/new" className="button">
          + New profile
        </Link>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/profiles" replace />} />
          <Route path="/profiles" element={<ProfilesListPage />} />
          <Route path="/profiles/new" element={<CreateProfilePage />} />
          <Route path="/profiles/:id" element={<ProfileDetailPage />} />
          <Route path="/profiles/:id/edit" element={<EditProfilePage />} />
          <Route path="*" element={<p className="muted">Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}
