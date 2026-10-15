import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE, useAuthStore } from '../store/useAuthStore'

type Mode = 'login' | 'register'

const inputClass =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'

const OAUTH_ERRORS: Record<string, string> = {
  invalid_state: 'GitHub login expired or was tampered with. Please try again.',
  no_verified_email: 'Your GitHub account has no verified primary email.',
}

function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, login, register, refresh } = useAuthStore()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Bonus 1: after GitHub redirects back, the backend has already set the
  // refresh cookie. Exchange it for an access token, then continue.
  useEffect(() => {
    const oauth = searchParams.get('oauth')
    if (oauth === 'success') {
      refresh().then((ok) => {
        if (ok) navigate('/projects', { replace: true })
        else setError('GitHub login failed. Please try again.')
      })
    } else if (oauth === 'error') {
      const reason = searchParams.get('reason') ?? ''
      setError(OAUTH_ERRORS[reason] ?? 'GitHub login failed. Please try again.')
    }
  }, [searchParams, refresh, navigate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
      navigate('/projects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (user) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-sm px-6 text-center">
          <p className="text-sm text-muted">
            You&apos;re logged in as <span className="font-mono text-primary">{user.email}</span>.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-sm px-6">
        <h2 className="mb-2 font-display text-2xl">
          {mode === 'login' ? 'Log in' : 'Create an account'}
        </h2>
        <p className="mb-6 text-sm text-muted">
          Log in to add, edit, and delete your own projects.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-surface p-6"
          noValidate
        >
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
              <input
                id="name"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 8 : undefined}
              required
            />
            {mode === 'register' && (
              <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primaryStrong px-4 py-2 font-mono text-sm text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
          </button>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          {/* Full-page navigation: the backend redirects to GitHub, then back to /login?oauth=success */}
          <a
            href={`${API_BASE}/auth/github`}
            className="block w-full rounded-full border border-border px-4 py-2 text-center font-mono text-sm hover:text-primary"
          >
            Login with GitHub
          </a>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError(null)
            }}
            className="text-primary hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Log in'}
          </button>
        </p>
      </div>
    </section>
  )
}

export default LoginPage
