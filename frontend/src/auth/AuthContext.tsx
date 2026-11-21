import { useEffect, useState, type ReactNode } from 'react'
import { authApi, type User } from '../api/auth.ts'
import { AuthContext, type AuthState } from './useAuth.ts'

/** Keeps track of who is logged in and shares it with the whole app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On first load, ask the backend whether the login cookie is still valid.
  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null)) // 401 means "not logged in"
      .finally(() => setLoading(false))
  }, [])

  const value: AuthState = {
    user,
    loading,
    login: async (credentials) => {
      const loggedIn = await authApi.login(credentials)
      setUser(loggedIn)
      return loggedIn
    },
    register: async (credentials) => {
      await authApi.register(credentials)
    },
    logout: async () => {
      await authApi.logout()
      setUser(null)
    },
    refresh: async () => {
      try {
        setUser(await authApi.me())
      } catch {
        setUser(null)
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
