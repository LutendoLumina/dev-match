import { createContext, useContext } from 'react'
import type { Credentials, User } from '../api/auth.ts'

export interface AuthState {
  /** The logged-in user, or null when logged out. */
  user: User | null
  /** True until we know whether someone is logged in. */
  loading: boolean
  /** Logs in and returns the user. */
  login: (credentials: Credentials) => Promise<User>
  /** Creates an account. Does not log in: call `login` afterwards. */
  register: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
  /** Re-fetch the user, e.g. after creating or deleting their profile. */
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

/** Access the logged-in user and auth actions from any component. */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
