import { useEffect, useState } from 'react'
import BookifyApp from './BookifyApp'
import { authApi, libraryApi } from './lib/api'
import { navigateTo } from './lib/router'
import AuthScreen from './pages/AuthScreen'
import './App.css'

export default function App() {
  const [session, setSession] = useState({ status: 'loading', user: null, library: null })
  const [emailEnabled, setEmailEnabled] = useState(false)

  useEffect(() => {
    authApi.config()
      .then(config => setEmailEnabled(Boolean(config.emailEnabled)))
      .catch(() => {})
      .then(() => authApi.me())
      .then(async ({ user }) => {
        if (!user) {
          setSession({ status: 'guest', user: null, library: null })
          return
        }
        const { library, version } = await libraryApi.get()
        setSession({ status: 'ready', user, library, version })
      })
      .catch(() => setSession({ status: 'error', user: null, library: null }))
  }, [])

  async function signedIn(user) {
    const { library, version } = await libraryApi.get()
    setSession({ status: 'ready', user, library, version })
  }

  async function logout() {
    await authApi.logout()
    setSession({ status: 'guest', user: null, library: null })
    navigateTo('/')
  }

  if (session.status === 'loading') return <main className="auth-loading">Opening Bookify…</main>
  if (session.status === 'error') {
    return <main className="auth-loading">Bookify could not connect. Check that the server is running, then reload the page.</main>
  }
  if (session.status === 'guest') return <AuthScreen onSignedIn={signedIn} emailEnabled={emailEnabled} />
  return <BookifyApp key={session.user.id} user={session.user}
    initialLibrary={session.library} initialVersion={session.version} onLogout={logout}
    onAccountDeleted={() => { setSession({ status: 'guest', user: null, library: null }); navigateTo('/') }} />
}
