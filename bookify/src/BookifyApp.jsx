import { useState } from 'react'
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

  const library = useLibrary(initialLibrary)
  const search = useBookSearch()
  const details = useBookDetails()
  const { catalog, lists, ratings, saveError, setSaveError } = library

  function navigate(nextPage) {
    setPage(nextPage)
    setSelectedList(null)
  }

  function selectList(id) {
    setSelectedList(id)
    setPage('Your Library')
  }

  async function signOut() {
    try {
      await library.saveNow({ catalog, lists, ratings })
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
    catalog, lists, ratings,
    onBookDetails: details.openBook,
    onRate: library.rateBook,
    onAdd: library.addBook,
  }

  return (
    <div className="app">
      <Sidebar page={page} lists={lists} onNavigate={navigate}
        onSelectList={selectList} onCreateList={library.createList} />
      <main className="main">
        <Topbar user={user} onProfile={() => navigate('Profile')} />
        {page === 'Home' && (
          <HomePage {...bookActions} onNavigate={navigate} onSelectList={selectList}
            onCreateList={library.createList} />
        )}
        {page === 'Discover' && <DiscoverPage {...bookActions} search={search} />}
        {page === 'Your Library' && (
          <LibraryPage {...bookActions} selectedList={selectedList}
            onSelectList={setSelectedList} onCreateList={library.createList} />
        )}
        {page === 'Rankings' && <RankingsPage catalog={catalog} ratings={ratings} />}
        {page === 'Readers' && <ReadersPage onBookDetails={details.openBook} />}
        {page === 'About' && <AboutPage />}
        {page === 'Profile' && (
          <ProfilePage user={user} lists={lists} ratings={ratings} isPublic={isPublic}
            visibilityBusy={visibilityBusy} saveError={saveError}
            onToggleVisibility={toggleVisibility} onSelectList={selectList}
            onImport={library.importFromDevice} onSignOut={signOut} />
        )}
      </main>
      <BookDialog book={details.book} description={details.description} onClose={details.closeBook} />
      <MobileNav page={page} onNavigate={navigate} />
    </div>
  )
}
