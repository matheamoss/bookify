import { useEffect, useRef, useState } from 'react'
import './App.css'
import bookIcon from "./assets/book.png";

const starterBooks = [
  { id: 1, title: 'The Secret History', author: 'Donna Tartt', color: '#65503e', genre: 'Literary fiction' },
  { id: 2, title: 'Normal People', author: 'Sally Rooney', color: '#7b8966', genre: 'Romance' },
  { id: 3, title: 'The Bell Jar', author: 'Sylvia Plath', color: '#a76c58', genre: 'Classics' },
  { id: 4, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', color: '#455d50', genre: 'Classics' },
  { id: 5, title: 'Little Women', author: 'Louisa May Alcott', color: '#9b8061', genre: 'Classics' },
]

const searchFields = 'key,title,author_name,cover_i,first_publish_year'

function fromOpenLibrary(doc) {
  const workKey = doc.key.startsWith('/works/') ? doc.key : `/works/${doc.key}`
  return {
    id: workKey,
    title: doc.title,
    author: doc.author_name?.[0] || 'Unknown author',
    coverId: doc.cover_i || null,
    year: doc.first_publish_year || null,
    color: '#455d50',
  }
}

function Cover({ book }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [book.coverId])
  return (
    <div className="book-cover" style={{ background: book.color || '#455d50' }}>
      {book.coverId && !failed ? (
        <img
          src={`https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg?default=false`}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="cover-fallback">
          <span className="cover-decoration">✦</span>
          <h3>{book.title}</h3>
          <small>{book.author}</small>
        </div>
      )}
    </div>
  )
}

const initialLists = [
  { id: 1, name: 'Currently reading', books: [1] },
  { id: 2, name: 'Want to read', books: [2, 3] },
  { id: 3, name: 'My favorites', books: [4, 5] },
]

function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const [session, setSession] = useState({ status: 'loading', user: null, library: null })

  useEffect(() => {
    fetch('/api/me').then(response => response.json()).then(async ({ user }) => {
      if (!user) return setSession({ status: 'guest', user: null, library: null })
      const response = await fetch('/api/library')
      if (!response.ok) throw new Error('Could not load your library.')
      const { library } = await response.json()
      setSession({ status: 'ready', user, library })
    }).catch(() => setSession({ status: 'error', user: null, library: null }))
  }, [])

  async function signedIn(user) {
    const response = await fetch('/api/library')
    if (!response.ok) throw new Error('Could not load your library.')
    const { library } = await response.json()
    setSession({ status: 'ready', user, library })
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' })
    setSession({ status: 'guest', user: null, library: null })
  }

  if (session.status === 'loading') return <div className="auth-loading">Opening Bookify…</div>
  if (session.status === 'error') return <div className="auth-loading">Bookify could not connect. Check that the server is running, then reload the page.</div>
  if (session.status === 'guest') return <AuthScreen onSignedIn={signedIn} />
  return <Bookify key={session.user.id} user={session.user} initialLibrary={session.library} onLogout={logout} />
}

function AuthScreen({ onSignedIn }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const response = await fetch(`/api/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Something went wrong.')
      await onSignedIn(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand">Bookify<span>✦</span></div>
      <section className="auth-card">
        <span className="eyebrow">YOUR LITERARY UNIVERSE</span>
        <h1>{mode === 'login' ? 'Welcome back.' : 'Start your library.'}</h1>
        <p>{mode === 'login' ? 'Sign in to your books, playlists and ratings.' : 'Create an account to keep your books in one place.'}</p>
        <form onSubmit={submit}>
          {mode === 'register' && <>
            <label htmlFor="auth-name">Name</label>
            <input id="auth-name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" required minLength={2} maxLength={80} />
          </>}
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required />
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" type="password" value={password} onChange={event => setPassword(event.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 12 : undefined} />
          {mode === 'register' && <small>Use at least 12 characters.</small>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
          {mode === 'login' ? 'New to Bookify? Create an account' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  )
}

function Bookify({ user, initialLibrary, onLogout }) {
  const [catalog, setCatalog] = useState(initialLibrary?.catalog || starterBooks)
  const [page, setPage] = useState('Home')
  const [lists, setLists] = useState(initialLibrary?.lists || initialLists.map(list => ({ ...list, books: [] })))
  const [ratings, setRatings] = useState(initialLibrary?.ratings || {})
  const [search, setSearch] = useState('')
  const [selectedList, setSelectedList] = useState(null)
  const [results, setResults] = useState([])
  const [searchStatus, setSearchStatus] = useState('idle')
  const [selectedBook, setSelectedBook] = useState(null)
  const [description, setDescription] = useState('')
  const [saveError, setSaveError] = useState('')
  const saveQueue = useRef(Promise.resolve())

  useEffect(() => {
    const timer = setTimeout(() => { saveLibrary({ catalog, lists, ratings }).catch(() => {}) }, 300)
    return () => clearTimeout(timer)
  }, [catalog, lists, ratings])

  function saveLibrary(library) {
    saveQueue.current = saveQueue.current.catch(() => {}).then(async () => {
      const response = await fetch('/api/library', {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(library),
      })
      if (!response.ok) throw new Error('Your library could not be saved.')
      setSaveError('')
    }).catch(error => { setSaveError(error.message); throw error })
    return saveQueue.current
  }

  async function signOut() {
    try {
      await saveLibrary({ catalog, lists, ratings })
      await onLogout()
    } catch { setSaveError('Your library could not be saved. Please try again before signing out.') }
  }

  function importFromDevice() {
    const oldLists = load('bookify-lists', null)
    const oldRatings = load('bookify-ratings', null)
    const oldCatalog = load('bookify-catalog', null)
    if (oldLists && Array.isArray(oldLists)) setLists(oldLists)
    if (oldRatings && typeof oldRatings === 'object') setRatings(oldRatings)
    if (oldCatalog && Array.isArray(oldCatalog)) setCatalog(oldCatalog)
  }

  useEffect(() => {
    const missing = starterBooks.filter(book => !catalog.find(item => item.id === book.id)?.coverId)
    if (!missing.length) return
    const controller = new AbortController()
    Promise.all(missing.map(async book => {
      const params = new URLSearchParams({ title: book.title, author: book.author, fields: searchFields, limit: '1' })
      const response = await fetch(`https://openlibrary.org/search.json?${params}`, { signal: controller.signal })
      if (!response.ok) throw new Error('Cover lookup failed')
      const data = await response.json()
      const key = data.docs?.[0]?.key
      return { id: book.id, coverId: data.docs?.[0]?.cover_i || null, workKey: key ? (key.startsWith('/works/') ? key : `/works/${key}`) : null }
    })).then(covers => setCatalog(current => current.map(book => {
      const found = covers.find(item => item.id === book.id)
      return found?.coverId ? { ...book, coverId: found.coverId, workKey: found.workKey } : book
    }))).catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const query = search.trim()
    if (query.length < 2) {
      setResults([])
      setSearchStatus('idle')
      return
    }
    const controller = new AbortController()
    setSearchStatus('loading')
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, fields: searchFields, limit: '24' })
        const response = await fetch(`https://openlibrary.org/search.json?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        setResults((data.docs || []).filter(doc => doc.key && doc.title).map(fromOpenLibrary))
        setSearchStatus('done')
      } catch (error) {
        if (error.name !== 'AbortError') setSearchStatus('error')
      }
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [search])

  useEffect(() => {
    if (!selectedBook) return
    const workKey = selectedBook.workKey || (typeof selectedBook.id === 'string' ? selectedBook.id : null)
    if (!workKey?.startsWith('/works/')) {
      setDescription('No description is available for this edition.')
      return
    }
    const controller = new AbortController()
    setDescription('Loading description…')
    fetch(`https://openlibrary.org${workKey}.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Description failed'); return response.json() })
      .then(data => setDescription(typeof data.description === 'string' ? data.description : data.description?.value || 'No description is available for this book.'))
      .catch(error => { if (error.name !== 'AbortError') setDescription('Description could not be loaded.') })
    return () => controller.abort()
  }, [selectedBook])

  function saveLists(updated) {
    setLists(updated)
  }

  function createList() {
    const name = window.prompt('Name your new book playlist:')
    if (!name?.trim()) return
    saveLists([...lists, { id: Date.now(), name: name.trim(), books: [] }])
  }

  function addBook(bookId, listId) {
    const book = [...results, ...catalog].find(item => item.id === bookId)
    if (book) setCatalog(current => current.some(item => item.id === bookId) ? current : [...current, book])
    saveLists(lists.map(list =>
      String(list.id) === String(listId) && !list.books.includes(bookId)
        ? { ...list, books: [...list.books, bookId] }
        : list
    ))
  }

  function rateBook(id, rating) {
    const updated = { ...ratings, [id]: rating }
    setRatings(updated)
  }

  function saveBook(book) {
    setCatalog(current => current.some(item => item.id === book.id) ? current : [...current, book])
  }

  function BookCard({ book }) {
    return (
      <div className="book-card">
        <Cover book={book} />
        <h4>{book.title}</h4>
        <p>{book.author}</p>
        <button className="book-details-link" onClick={() => setSelectedBook(book)}>About book</button>
        <div className="stars">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => { saveBook(book); rateBook(book.id, n) }}
              aria-label={`Rate ${n} stars`}
              className={n <= (ratings[book.id] || 0) ? 'active' : ''}
            >★</button>
          ))}
        </div>
        <select
          value=""
          onChange={e => addBook(book.id, e.target.value)}
          aria-label={`Add ${book.title} to playlist`}
        >
          <option value="">+ Add to playlist</option>
          {lists.map(list => (
            <option key={list.id} value={list.id}>{list.name}</option>
          ))}
        </select>
      </div>
    )
  }

  const filteredBooks = catalog.filter(book =>
    `${book.title} ${book.author} ${book.genre}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const rankedBooks = catalog
    .filter(book => ratings[book.id])
    .sort((a, b) => ratings[b.id] - ratings[a.id])

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Bookify<span>✦</span></div>
        <p className="brand-subtitle">A home for every story.</p>

        <nav>
          {['Home', 'Discover', 'Your Library', 'Rankings', 'Profile'].map(item => (
            <button
              key={item}
              className={page === item ? 'nav-active' : ''}
              onClick={() => { setPage(item); setSelectedList(null) }}
            >
              {item === 'Home' ? '⌂' : item === 'Discover' ? '✧' : item === 'Your Library' ? '▤' : item === 'Rankings' ? '★' : '♙'}
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <p>YOUR PLAYLISTS</p>
          {lists.map(list => (
            <button key={list.id} onClick={() => {
              setSelectedList(list.id)
              setPage('Your Library')
            }}> {list.name}</button>
          ))}
          <button className="create-link" onClick={createList}>＋ Create playlist</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand">Bookify </div>
          <span className="eyebrow">YOUR LITERARY UNIVERSE</span>
          <button className="profile-button" onClick={() => setPage('Profile')} aria-label="Open profile">{user.name.charAt(0).toUpperCase()}</button>
        </header>

        {page === 'Home' && (
          <>
            <section className="hero">
              <span className="eyebrow">WELCOME TO BOOKIFY</span>
              <h1>Build your library,<br /><em>Share your taste.</em></h1>
              <p>Collect your favorite stories, create your own book playlists and discover your next great read.</p>
              <button className="primary-button" onClick={() => setPage('Discover')}>Explore books →</button>
              <div className="hero-flower">𝔅</div>
            </section>

            <div className="section-heading">
              <h2>Your library</h2>
              <button onClick={() => setPage('Your Library')}>View all →</button>
            </div>
            <div className="playlist-grid">
              {lists.slice(0, 4).map(list => (
                <button className="playlist-card" key={list.id} onClick={() => {
                  setSelectedList(list.id)
                  setPage('Your Library')
                }}>
                  <span className="playlist-icon">
                    <img src={bookIcon} alt="Book icon" />
                  </span>
                  <strong>{list.name}</strong>
                  <small>{list.books.length} books</small>
                </button>
              ))}
              <button className="playlist-card add-card" onClick={createList}>
                <span className="playlist-icon">＋</span>
                <strong>Create playlist</strong>
                <small>Start a new collection</small>
              </button>
            </div>

            <div className="section-heading">
              <h2>Discover your next read</h2>
              <button onClick={() => setPage('Discover')}>See all →</button>
            </div>
            <div className="book-grid">{catalog.slice(0, 4).map(book => <BookCard key={book.id} book={book} />)}</div>
          </>
        )}

        {page === 'Discover' && (
          <section>
            <span className="eyebrow">EXPLORE THE SHELVES</span>
            <h1 className="page-title">Discover books</h1>
            <p className="intro">Find a story worth getting lost in.</p>
            <label className="search-label" htmlFor="book-search">Search the Open Library catalog</label>
            <input id="book-search" className="search" type="search" placeholder="Search books or authors..." value={search} onChange={e => setSearch(e.target.value)} />
            <p className="search-message" role="status">
              {searchStatus === 'loading' ? 'Searching books…' : searchStatus === 'error' ? 'Search is unavailable right now. Please try again.' : search.trim().length < 2 ? 'Enter at least two letters to search.' : searchStatus === 'done' ? `${results.length} books found` : ''}
            </p>
            <div className="book-grid">
              {(search.trim().length >= 2 ? results : filteredBooks).map(book => <BookCard key={book.id} book={book} />)}
            </div>
            {searchStatus === 'done' && results.length === 0 && <p>No books found. Try another title or author.</p>}
          </section>
        )}

        {page === 'Your Library' && (
          <section>
            <span className="eyebrow">YOUR COLLECTION</span>
            <h1 className="page-title">Your Library</h1>
            <button className="primary-button" onClick={createList}>＋ Create playlist</button>
            <div className="playlist-grid library-lists">
              {lists.map(list => (
                <button className="playlist-card" key={list.id} onClick={() => setSelectedList(list.id)}>
                  <span className="playlist-icon">✧</span>
                  <strong>{list.name}</strong>
                  <small>{list.books.length} books</small>
                </button>
              ))}
            </div>
            {selectedList && (
              <div className="selected-list">
                <h2>{lists.find(l => l.id === selectedList)?.name}</h2>
                <div className="book-grid">
                  {catalog.filter(book => lists.find(l => l.id === selectedList)?.books.includes(book.id))
                    .map(book => <BookCard key={book.id} book={book} />)}
                </div>
                <p className="hint">Add more books from the Discover page.</p>
              </div>
            )}
          </section>
        )}

        {page === 'Rankings' && (
          <section>
            <span className="eyebrow">YOUR PERSONAL TOP LIST</span>
            <h1 className="page-title">Book Rankings</h1>
            <p className="intro">Your highest-rated stories, all in one place.</p>
            {rankedBooks.length === 0 && <p>Rate some books to create your ranking.</p>}
            {rankedBooks.map((book, index) => (
              <div className="ranking-row" key={book.id}>
                <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{book.title}</strong><p>{book.author}</p></div>
                <span className="rank-stars">{'★'.repeat(ratings[book.id])}</span>
              </div>
            ))}
          </section>
        )}

        {page === 'Profile' && (
          <section>
            <span className="eyebrow">YOUR READING IDENTITY</span>
            <div className="profile-header">
              <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div><h1 className="page-title">{user.name}</h1><p>{user.email}</p></div>
            </div>
            <p className="intro">A little corner of the internet for all your favorite stories.</p>
            <div className="profile-stats">
              <div><strong>{lists.length}</strong><span>Playlists</span></div>
              <div><strong>{Object.keys(ratings).length}</strong><span>Rated books</span></div>
              <div><strong>{lists.reduce((sum, list) => sum + list.books.length, 0)}</strong><span>Books saved</span></div>
            </div>
            <h2>My playlists</h2>
            <div className="playlist-grid">
              {lists.map(list => (
                <button className="playlist-card" key={list.id} onClick={() => {
                  setSelectedList(list.id)
                  setPage('Your Library')
                }}>
                  <span className="playlist-icon">✧</span>
                  <strong>{list.name}</strong>
                  <small>{list.books.length} books</small>
                </button>
              ))}
            </div>
            <div className="account-actions">
              {localStorage.getItem('bookify-lists') && <button onClick={importFromDevice}>Import books saved on this device</button>}
              <button onClick={signOut}>Sign out</button>
            </div>
            {saveError && <p className="auth-error" role="alert">{saveError}</p>}
          </section>
        )}
      </main>

      {selectedBook && (
        <div className="book-dialog-backdrop" onClick={() => setSelectedBook(null)}>
          <section className="book-dialog" role="dialog" aria-modal="true" aria-label={selectedBook.title} onClick={event => event.stopPropagation()}>
            <button className="dialog-close" onClick={() => setSelectedBook(null)} aria-label="Close book details">×</button>
            <div className="dialog-cover"><Cover book={selectedBook} /></div>
            <div>
              <h2>{selectedBook.title}</h2>
              <p className="dialog-author">{selectedBook.author}{selectedBook.year ? ` · ${selectedBook.year}` : ''}</p>
              <p className="dialog-description">{description}</p>
              {(selectedBook.workKey || (typeof selectedBook.id === 'string' && selectedBook.id.startsWith('/works/'))) && (
                <a href={`https://openlibrary.org${selectedBook.workKey || selectedBook.id}`} target="_blank" rel="noreferrer">View on Open Library ↗</a>
              )}
            </div>
          </section>
        </div>
      )}

      <nav className="mobile-nav">
        {['Home', 'Discover', 'Your Library', 'Rankings', 'Profile'].map(item => (
          <button key={item} className={page === item ? 'nav-active' : ''} onClick={() => {
            setPage(item)
            setSelectedList(null)
          }}>{item}</button>
        ))}
      </nav>
    </div>
  )
}
