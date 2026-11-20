import { useCallback, useEffect, useMemo, useState } from 'react'
import BookifyApp from './BookifyApp'
import AuthDialog from './components/AuthDialog'
import { authApi, libraryApi } from './lib/api'
import { AuthContext } from './lib/authContext'
import { navigateTo } from './lib/router'
import './App.css'

const guestSession = { status: 'ready', user: null, library: null, version: null }

function readActionLink() {
  const query = new URLSearchParams(window.location.search)
  const verify = query.get('verify')
  const reset = query.get('reset')
  return verify || reset ? { verify, reset } : null
}

export default function App() {
  const [session, setSession] = useState({ status: 'loading', user: null, library: null, version: null })
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [authRequest, setAuthRequest] = useState(null)

  useEffect(() => {
    authApi.config()
      .then(config => Boolean(config.emailEnabled))
      .catch(() => false)
      .then(async enabled => {
        setEmailEnabled(enabled)
        const actionLink = enabled ? readActionLink() : null
        if (actionLink) setAuthRequest({ ...actionLink, id: Date.now() })
        const { user } = await authApi.me()
        if (!user) {
          setSession(guestSession)
          return
        }
        const { library, version } = await libraryApi.get()
        setSession({ status: 'ready', user, library, version })
      })
      .catch(() => setSession({ ...guestSession, status: 'error' }))
  }, [])

  const signedIn = useCallback(async user => {
    const { library, version } = await libraryApi.get()
    setSession({ status: 'ready', user, library, version })
    setAuthRequest(null)
  }, [])

  const requireAuth = useCallback((reason, mode = 'login') => {
    setAuthRequest({ reason, mode, id: Date.now() })
  }, [])

  const closeAuth = useCallback(() => setAuthRequest(null), [])

  async function logout() {
    await authApi.logout()
    setSession(guestSession)
    navigateTo('/')
  }

  function accountDeleted() {
    setSession(guestSession)
    navigateTo('/')
  }

  const auth = useMemo(() => ({ user: session.user, requireAuth }), [session.user, requireAuth])

  if (session.status === 'loading') return <main className="auth-loading">Opening Bookify…</main>
  if (session.status === 'error') {
    return <main className="auth-loading">Bookify could not connect. Check that the server is running, then reload the page.</main>
  }
  return (
    <AuthContext.Provider value={auth}>
      <BookifyApp key={session.user?.id || 'guest'} user={session.user}
        initialLibrary={session.library} initialVersion={session.version}
        onLogout={logout} onAccountDeleted={accountDeleted} />
      {authRequest && (
        <AuthDialog key={authRequest.id} request={authRequest} emailEnabled={emailEnabled}
          onClose={closeAuth} onSignedIn={signedIn} />
      )}
    </AuthContext.Provider>
  )
}
