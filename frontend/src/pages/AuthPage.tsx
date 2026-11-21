import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/useAuth.ts'

/** Login and register share one form; `mode` decides which it is. */
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: string; registeredEmail?: string } | null
  // Coming from sign-up: pre-fill the email they just registered.
  const [email, setEmail] = useState(state?.registeredEmail ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const isLogin = mode === 'login'
  const justRegistered = isLogin && Boolean(state?.registeredEmail)
  // Already logged in? Nothing to do here (skipped mid-submit so our own redirect wins).
  if (auth.user && !submitting) return <Navigate to="/profiles" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      if (isLogin) {
        const user = await auth.login({ email, password })
        // New users set up their profile first; others go back where they came from.
        const destination = user.profileId ? (state?.from ?? '/profiles') : '/profiles/new'
        navigate(destination, { replace: true })
      } else {
        await auth.register({ email, password })
        navigate('/login', { replace: true, state: { registeredEmail: email.trim().toLowerCase() } })
      }
    } catch (error) {
      setErrors(error instanceof ApiError ? error.messages : ['Something went wrong.'])
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>{isLogin ? 'Log in' : 'Create an account'}</h1>
      <form className="card form" onSubmit={handleSubmit}>
        {justRegistered && errors.length === 0 && (
          <p className="success" role="status">
            Account created! Log in with your new password to continue.
          </p>
        )}
        {errors.length > 0 && (
          <ul className="errors" role="alert">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoFocus={justRegistered}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={72}
            required
          />
        </label>

        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}
        </button>

        <p className="muted small">
          {isLogin ? (
            <>
              New here? <Link to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Log in</Link>
            </>
          )}
        </p>
      </form>
    </>
  )
}
