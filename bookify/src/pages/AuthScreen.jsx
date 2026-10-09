import { useState } from 'react'
import { authApi } from '../lib/api'
import AboutPage from './AboutPage'

const testCredentials = {
  email: 'test@bookify.local',
  password: 'Testbruker123!',
}
const showTestUser = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_USER === 'true'

export default function AuthScreen({ onSignedIn }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [publicProfile, setPublicProfile] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const details = { name, email, password, publicProfile }
      const { user } = mode === 'login' ? await authApi.login(details) : await authApi.register(details)
      await onSignedIn(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function switchMode() {
    setMode(current => current === 'login' ? 'register' : 'login')
    setError('')
  }

  function useTestUser() {
    setMode('login')
    setEmail(testCredentials.email)
    setPassword(testCredentials.password)
    setError('')
  }

  if (showAbout) {
    return (
      <main className="auth-page">
        <div className="auth-about">
          <button className="text-button" onClick={() => setShowAbout(false)}>← Back to sign in</button>
          <AboutPage />
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-brand">Bookify<span>✦</span></div>
      <section className="auth-card" aria-labelledby="auth-heading">
        <span className="eyebrow">YOUR LITERARY UNIVERSE</span>
        <h1 id="auth-heading">{mode === 'login' ? 'Welcome back.' : 'Start your library.'}</h1>
        <p>{mode === 'login' ? 'Sign in to your books, playlists and ratings.' : 'Create an account to keep your books in one place.'}</p>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label htmlFor="auth-name">Name</label>
              <input id="auth-name" value={name} onChange={event => setName(event.target.value)}
                autoComplete="name" required minLength={2} maxLength={80} />
            </>
          )}
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" value={email} onChange={event => setEmail(event.target.value)}
            autoComplete="email" required />
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" type="password" value={password} onChange={event => setPassword(event.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required
            minLength={mode === 'register' ? 12 : undefined} />
          {mode === 'register' && (
            <>
              <small>Use at least 12 characters.</small>
              <label className="visibility-choice">
                <input type="checkbox" checked={publicProfile} onChange={event => setPublicProfile(event.target.checked)} />
                Let other readers find my profile and see my book lists
              </label>
            </>
          )}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        {showTestUser && mode === 'login' && (
          <button className="test-login-button" type="button" onClick={useTestUser}>
            Use test user
          </button>
        )}
        <button className="auth-switch" onClick={switchMode}>
          {mode === 'login' ? 'New to Bookify? Create an account' : 'Already have an account? Sign in'}
        </button>
        <button className="auth-about-link" onClick={() => setShowAbout(true)}>What is Bookify?</button>
      </section>
    </main>
  )
}
