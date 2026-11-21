import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/useAuth.ts'
import { RequireAuth } from './auth/RequireAuth.tsx'
import { AuthPage } from './pages/AuthPage.tsx'
import { CreateProfilePage } from './pages/CreateProfilePage.tsx'
import { EditProfilePage } from './pages/EditProfilePage.tsx'
import { ProfileDetailPage } from './pages/ProfileDetailPage.tsx'
import { ProfilesListPage } from './pages/ProfilesListPage.tsx'

function Header() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/profiles')
  }

  return (
    <header className="site-header">
      <Link to="/profiles" className="logo">
        dev<span>match</span>
      </Link>

      {!loading && (
        <nav className="nav">
          {user ? (
            <>
              {user.profileId ? (
                <Link to={`/profiles/${user.profileId}`}>My profile</Link>
              ) : (
                <Link to="/profiles/new" className="button">
                  Create your profile
                </Link>
              )}
              <span className="muted small nav-email">{user.email}</span>
              <button className="button secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="button">
                Sign up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/profiles" replace />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/profiles" element={<ProfilesListPage />} />
          <Route
            path="/profiles/new"
            element={
              <RequireAuth>
                <CreateProfilePage />
              </RequireAuth>
            }
          />
          <Route path="/profiles/:id" element={<ProfileDetailPage />} />
          <Route
            path="/profiles/:id/edit"
            element={
              <RequireAuth>
                <EditProfilePage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<p className="muted">Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}
