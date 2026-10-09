import { useEffect, useRef, useState } from 'react'
import { MobileNav, Sidebar, Topbar } from './components/AppNavigation'
import BookDialog from './components/BookDialog'
import { useBookDetails } from './hooks/useBookDetails'
import { useBookSearch } from './hooks/useBookSearch'
import { useLibrary } from './hooks/useLibrary'
import { peopleApi } from './lib/api'
import AboutPage from './pages/AboutPage'
import DiscoverPage from './pages/DiscoverPage'
import HomePage from './pages/HomePage'
import LibraryPage from './pages/LibraryPage'
import ProfilePage from './pages/ProfilePage'
import RankingsPage from './pages/RankingsPage'
import ReadersPage from './pages/ReadersPage'

export default function BookifyApp({ user, initialLibrary, onLogout }) {
  const [page, setPage] = useState('Home')
  const [selectedList, setSelectedList] = useState(null)
  const [isPublic, setIsPublic] = useState(Boolean(user.is_public))
  const [visibilityBusy, setVisibilityBusy] = useState(false)
  const historyReady = useRef(false)

  const library = useLibrary(initialLibrary)
  const search = useBookSearch()
  const details = useBookDetails()
  const { catalog, lists, ratings, reviews, ranking, saveError, setSaveError } = library

  useEffect(() => {
    const currentState = { bookify: true, page: 'Home', selectedList: null }
    window.history.replaceState(currentState, '', window.location.pathname)
    historyReady.current = true

    function handlePopState(event) {
      const state = event.state
      if (!state?.bookify) {
        setPage('Home')
        setSelectedList(null)
        return
      }
      setPage(state.page || 'Home')
      setSelectedList(state.selectedList || null)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function pushNavigation(nextPage, nextSelectedList = null) {
    if (!historyReady.current) return
    window.history.pushState(
      { bookify: true, page: nextPage, selectedList: nextSelectedList },
      '',
      window.location.pathname,
    )
  }

  function navigate(nextPage) {
    setPage(nextPage)
    setSelectedList(null)
    pushNavigation(nextPage)
  }

  function selectList(id) {
    setSelectedList(id)
    setPage('Your Library')
    pushNavigation('Your Library', id)
  }

  function selectLibraryView(id) {
    setSelectedList(id)
    pushNavigation('Your Library', id)
  }

  async function signOut() {
    try {
      await library.saveNow({ catalog, lists, ratings, reviews, ranking })
      await onLogout()
    } catch {
      setSaveError('Your library could not be saved. Please try again before signing out.')
    }
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
    onRate: library.rateBook,
    onReview: library.reviewBook,
    onAdd: library.addBook,
  }

  return (
    <div className="app">
      <Sidebar page={page} lists={lists} onNavigate={navigate}
        onSelectList={selectList} onCreateList={library.createList} />
      <main className="main">
        <Topbar user={user} onHome={() => navigate('Home')} onProfile={() => navigate('Profile')} />
        {page === 'Home' && (
          <HomePage {...bookActions} onNavigate={navigate} onSelectList={selectList}
            onCreateList={library.createList} />
        )}
        {page === 'Discover' && <DiscoverPage {...bookActions} search={search} />}
        {page === 'Your Library' && (
          <LibraryPage {...bookActions} selectedList={selectedList}
            onSelectList={selectLibraryView} onCreateList={library.createList}
            onRemove={library.removeBook} />
        )}
        {page === 'Rankings' && (
          <RankingsPage catalog={catalog} ratings={ratings} ranking={ranking}
            onMove={library.moveRankedBook} onRemove={library.removeRankedBook} />
        )}
        {page === 'Readers' && <ReadersPage onBookDetails={details.openBook} />}
        {page === 'About' && <AboutPage />}
        {page === 'Profile' && (
          <ProfilePage user={user} lists={lists} ratings={ratings} isPublic={isPublic}
            visibilityBusy={visibilityBusy} saveError={saveError}
            onToggleVisibility={toggleVisibility} onSelectList={selectList}
            onSelectLibraryView={selectList}
            onImport={library.importFromDevice} onSignOut={signOut} />
        )}
      </main>
      <BookDialog book={details.book} description={details.description} onClose={details.closeBook} />
      <MobileNav page={page} onNavigate={navigate} />
    </div>
  )
}
