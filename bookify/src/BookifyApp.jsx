import { useState } from 'react'
import { MobileNav, Sidebar, Topbar } from './components/AppNavigation'
import BookDialog from './components/BookDialog'
import SignInPrompt from './components/SignInPrompt'
import { useBookDetails } from './hooks/useBookDetails'
import { useBookSearch } from './hooks/useBookSearch'
import { useLibrary } from './hooks/useLibrary'
import { peopleApi } from './lib/api'
import { useAuth } from './lib/authContext'
import { libraryPath, navigateTo, pagePaths, readerPath, useRoute } from './lib/router'
import AboutPage from './pages/AboutPage'
import DiscoverPage from './pages/DiscoverPage'
import HomePage from './pages/HomePage'
import LibraryPage from './pages/LibraryPage'
import ProfilePage from './pages/ProfilePage'
import RankingsPage from './pages/RankingsPage'
import ReadersPage from './pages/ReadersPage'

const memberPages = {
  'Your Library': { title: 'Your Library', message: 'Sign in or create an account to collect books in your own playlists.' },
  Rankings: { title: 'Book Rankings', message: 'Sign in or create an account to build your personal book ranking.' },
  Profile: { title: 'Your profile', message: 'Sign in or create an account to get your own reader profile.' },
}

export default function BookifyApp({ user, initialLibrary, initialVersion, onLogout, onAccountDeleted }) {
  const { page, param } = useRoute()
  const selectedList = page === 'Your Library' ? param : null
  const { requireAuth } = useAuth()
  const [isPublic, setIsPublic] = useState(Boolean(user?.is_public))
  const [visibilityBusy, setVisibilityBusy] = useState(false)

  const library = useLibrary(initialLibrary, initialVersion, { persist: Boolean(user) })
  const search = useBookSearch()
  const details = useBookDetails()
  const { catalog, lists, ratings, reviews, ranking, saveError, setSaveError } = library

  // Guests can browse; anything that changes a library asks them to sign in first.
  const guard = (action, reason) => (...args) => user ? action(...args) : requireAuth(reason)
  const navigate = nextPage => {
    if (!user && memberPages[nextPage]) return requireAuth(memberPages[nextPage].message)
    navigateTo(pagePaths[nextPage] || '/')
  }
  const selectList = guard(id => navigateTo(libraryPath(id)), 'Sign in or create an account to open your playlists.')
  const createList = guard(library.createList, 'Sign in or create an account to create playlists.')

  async function signOut() {
    try {
      await library.saveNow({ catalog, lists, ratings, reviews, ranking })
    } catch (error) {
      // On a conflict the server already holds a newer library, so signing out loses nothing that was saved.
      if (error.status !== 409) {
        setSaveError('Your library could not be saved. Please try again before signing out.')
        return
      }
    }
    await onLogout()
  }

  async function toggleVisibility() {
    setVisibilityBusy(true)
    setSaveError('')
    try {
      await peopleApi.visibility(!isPublic)
      setIsPublic(current => !current)
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setVisibilityBusy(false)
    }
  }

  const bookActions = {
    catalog, lists, ratings, reviews,
    onBookDetails: details.openBook,
    onRate: guard(library.rateBook, 'Sign in or create an account to rate books.'),
    onReview: guard(library.reviewBook, 'Sign in or create an account to write notes about books.'),
    onAdd: guard(library.addBook, 'Sign in or create an account to add books to your playlists.'),
  }

  return (
    <div className="app">
      <Sidebar page={page} lists={lists} onNavigate={navigate}
        onSelectList={selectList} onCreateList={createList} />
      <main className="main">
        <Topbar user={user} onHome={() => navigate('Home')} onProfile={() => navigate('Profile')} />
        {saveError && page !== 'Profile' && (
          <div className="save-banner" role="alert">
            <span>{saveError}</span>
            <button onClick={() => window.location.reload()}>Reload</button>
          </div>
        )}
        {!user && memberPages[page] && <SignInPrompt {...memberPages[page]} />}
        {page === 'Home' && (
          <HomePage {...bookActions} onNavigate={navigate} onSelectList={selectList}
            onCreateList={createList} />
        )}
        {page === 'Discover' && <DiscoverPage {...bookActions} search={search} />}
        {user && page === 'Your Library' && (
          <LibraryPage {...bookActions} selectedList={selectedList}
            onSelectList={selectList} onCreateList={createList}
            onRemove={library.removeBook} />
        )}
        {user && page === 'Rankings' && (
          <RankingsPage catalog={catalog} ratings={ratings} ranking={ranking}
            onMove={library.moveRankedBook} onRemove={library.removeRankedBook}
            onAddToRanking={library.addRankedBook} />
        )}
        {page === 'Readers' && (
          <ReadersPage personId={param} onOpenPerson={id => navigateTo(readerPath(id))}
            onBack={() => navigateTo(readerPath(null))} onBookDetails={details.openBook} />
        )}
        {page === 'About' && <AboutPage />}
        {user && page === 'Profile' && (
          <ProfilePage user={user} lists={lists} ratings={ratings} isPublic={isPublic}
            visibilityBusy={visibilityBusy} saveError={saveError}
            onToggleVisibility={toggleVisibility} onSelectList={selectList}
            onSelectLibraryView={selectList}
            onImport={library.importFromDevice} onSignOut={signOut} onAccountDeleted={onAccountDeleted} />
        )}
      </main>
      <BookDialog book={details.book} description={details.description} onClose={details.closeBook} />
      <MobileNav page={page} onNavigate={navigate} />
    </div>
  )
}
