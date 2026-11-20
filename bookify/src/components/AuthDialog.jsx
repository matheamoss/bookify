import { useEffect, useRef, useState } from 'react'
import { authApi } from '../lib/api'

const testCredentials = {
  email: 'test@bookify.local',
  password: 'Testbruker123!',
}
const showTestUser = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_USER === 'true'

function clearActionLink() {
  window.history.replaceState({}, '', window.location.pathname)
}

// Sign-in and registration dialog. `request` says why it opened ({ reason, mode, verify, reset }).
export default function AuthDialog({ request, emailEnabled, onClose, onSignedIn }) {
  const { reason, verify: verificationToken, reset: resetToken } = request
  const verificationStarted = useRef(false)
  const [mode, setMode] = useState(resetToken ? 'reset' : verificationToken ? 'verifying' : request.mode || 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [publicProfile, setPublicProfile] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!verificationToken || verificationStarted.current) return
    verificationStarted.current = true
    authApi.verifyEmail(verificationToken)
      .then(({ user }) => {
        clearActionLink()
        return onSignedIn(user)
      })
      .catch(err => {
        clearActionLink()
        setError(err.message)
        setMode('login')
      })
  }, [onSignedIn, verificationToken])

  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    try {
      if (mode === 'register') {
        const result = await authApi.register({ name, email, password, publicProfile })
        if (result.requiresVerification) setMode('verify-pending')
        else await onSignedIn(result.user)
      } else if (mode === 'forgot') {
        await authApi.forgotPassword(email)
        setMessage('If an account exists for that address, a reset link is on its way.')
      } else if (mode === 'reset') {
        const { user } = await authApi.resetPassword(resetToken, password)
        clearActionLink()
        await onSignedIn(user)
      } else {
        const { user } = await authApi.login({ email, password })
        await onSignedIn(user)
      }
    } catch (err) {
      setError(err.message)
      if (mode === 'login' && err.data?.needsVerification) setMode('verify-pending')
    } finally {
      setBusy(false)
    }
  }

  async function resendVerification() {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      await authApi.resendVerification(email)
      setMessage('A fresh confirmation link has been sent if the account still needs verification.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  function useTestUser() {
    setMode('login')
    setEmail(testCredentials.email)
    setPassword(testCredentials.password)
    setError('')
  }

  const headings = {
    verifying: ['Confirming your email…', ''],
    login: ['Welcome back.', 'Sign in to your books, playlists and ratings.'],
    register: ['Start your library.', 'Create an account to keep your books in one place.'],
    forgot: ['Reset your password.', 'Enter your email and we’ll send you a secure reset link.'],
    reset: ['Choose a new password.', 'Use at least 12 characters for your new password.'],
    'verify-pending': ['Check your inbox.', `We sent a confirmation link to ${email || 'your email address'}.`],
  }
  const [heading, description] = headings[mode]
  const showReason = reason && ['login', 'register'].includes(mode)

  return (
    <div className="auth-dialog-backdrop" onClick={onClose}>
      <section className="auth-card auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-heading"
        onClick={event => event.stopPropagation()}>
        <button className="dialog-close" onClick={onClose} aria-label="Close">×</button>
        {showReason && <p className="auth-reason">{reason}</p>}
        <h1 id="auth-heading">{heading}</h1>
        {description && <p>{description}</p>}

        {mode === 'verifying' ? null : mode === 'verify-pending' ? (
          <div className="auth-actions">
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-message" role="status">{message}</p>}
            <button className="primary-button" disabled={busy || !email} onClick={resendVerification}>
              {busy ? 'Sending…' : 'Send a new confirmation link'}
            </button>
            <button className="auth-switch" onClick={() => switchMode('login')}>Back to sign in</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <label htmlFor="auth-name">Name</label>
                <input id="auth-name" value={name} onChange={event => setName(event.target.value)}
                  autoComplete="name" required minLength={2} maxLength={80} />
              </>
            )}
            {mode !== 'reset' && (
              <>
                <label htmlFor="auth-email">Email</label>
                <input id="auth-email" type="email" value={email} onChange={event => setEmail(event.target.value)}
                  autoComplete="email" required autoFocus />
              </>
            )}
            {mode !== 'forgot' && (
              <>
                <label htmlFor="auth-password">Password</label>
                <input id="auth-password" type="password" value={password} onChange={event => setPassword(event.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required
                  minLength={mode === 'login' ? undefined : 12} />
              </>
            )}
            {mode === 'register' && (
              <>
                <small>Use at least 12 characters.</small>
                <label className="visibility-choice">
                  <input type="checkbox" checked={publicProfile} onChange={event => setPublicProfile(event.target.checked)} />
                  Make my profile public, so anyone can find me and see my book lists
                </label>
              </>
            )}
            {mode === 'reset' && <small>Use at least 12 characters.</small>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-message" role="status">{message}</p>}
            <button className="primary-button" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Save new password'}
            </button>
          </form>
        )}

        {emailEnabled && mode === 'login' && <button className="auth-secondary" onClick={() => switchMode('forgot')}>Forgot your password?</button>}
        {showTestUser && mode === 'login' && (
          <button className="test-login-button" type="button" onClick={useTestUser}>
            Use test user
          </button>
        )}
        {['login', 'register'].includes(mode) && (
          <button className="auth-switch" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'New to Bookify? Create an account' : 'Already have an account? Sign in'}
          </button>
        )}
        {['forgot', 'reset'].includes(mode) && <button className="auth-switch" onClick={() => switchMode('login')}>Back to sign in</button>}
      </section>
    </div>
  )
}
