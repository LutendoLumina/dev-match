import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/useAuth.ts'

/** Login and register share one form; `mode` decides which it is. */
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const isLogin = mode === 'login'
  if (auth.user) return <Navigate to="/profiles" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      if (isLogin) {
        await auth.login({ email, password })
        // Go back to the page that sent us here, if any.
        navigate((location.state as { from?: string } | null)?.from ?? '/profiles', { replace: true })
      } else {
        await auth.register({ email, password })
        navigate('/profiles/new', { replace: true }) // new users set up their profile next
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
