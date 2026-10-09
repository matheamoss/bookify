import { useCallback, useEffect, useState } from 'react'
import BookCard from '../components/BookCard'
import PlaylistCard from '../components/PlaylistCard'
import ReaderCard from '../components/ReaderCard'
import { peopleApi } from '../lib/api'
import { savedBookIds } from '../lib/books'

function ReaderProfile({ selected, selectedList, onSelectList, onBack, onFollow, busy, error, onBookDetails }) {
  const { person, library } = selected
  const lists = library.lists || []
  const catalog = library.catalog || []
  const ratings = library.ratings || {}
  const reviews = library.reviews || {}
  const savedIds = savedBookIds(lists, ratings)
  const list = lists.find(item => String(item.id) === String(selectedList))
  const visibleBooks = catalog.filter(book => list
    ? list.books.some(id => String(id) === String(book.id))
    : savedIds.has(String(book.id)))

  return (
    <section aria-labelledby="reader-profile-heading">
      <button className="text-button" onClick={onBack}>← Back to readers</button>
      <header className="reader-profile-header">
        <div className="profile-avatar" aria-hidden="true">{person.name.charAt(0).toUpperCase()}</div>
        <div>
          <span className="eyebrow">READER PROFILE</span>
          <h1 className="page-title" id="reader-profile-heading">{person.name}</h1>
          <p>{person.followers} followers · {person.following} following</p>
        </div>
        <button className="follow-button" onClick={onFollow} disabled={busy}>
          {person.isFollowing ? 'Following ✓' : '＋ Follow'}
        </button>
      </header>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="profile-stats" aria-label="Reading statistics">
        <div><strong>{lists.length}</strong><span>Playlists</span></div>
        <div><strong>{savedIds.size}</strong><span>Books saved</span></div>
        <div><strong>{Object.keys(ratings).length}</strong><span>Rated books</span></div>
      </div>
      <section aria-labelledby="reader-playlists-heading">
        <h2 id="reader-playlists-heading">Book playlists</h2>
        {lists.length ? (
          <div className="playlist-grid reader-lists">
            {lists.map(item => (
              <PlaylistCard key={item.id} list={item}
                active={String(selectedList) === String(item.id)}
                onClick={() => onSelectList(String(selectedList) === String(item.id) ? null : item.id)} />
            ))}
          </div>
        ) : <p className="intro">No playlists yet.</p>}
      </section>
      <section aria-labelledby="reader-library-heading">
        <div className="section-heading">
          <h2 id="reader-library-heading">{list ? list.name : 'Library'}</h2>
          {list && <button onClick={() => onSelectList(null)}>Show all books</button>}
        </div>
        {visibleBooks.length ? (
          <div className="book-grid">
            {visibleBooks.map(book => (
              <BookCard key={book.id} book={book} ratings={ratings} reviews={reviews} readOnly onDetails={onBookDetails} />
            ))}
          </div>
        ) : <p className="intro">No books here yet.</p>}
      </section>
    </section>
  )
}

export default function ReadersPage({ onBookDetails }) {
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState([])
  const [following, setFollowing] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedList, setSelectedList] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const refreshFollowing = useCallback(async () => {
    const { people: followedPeople } = await peopleApi.following()
    setFollowing(followedPeople)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setStatus('loading')
      peopleApi.search(query.trim(), controller.signal)
        .then(data => { setPeople(data.people); setStatus('ready') })
        .catch(err => { if (err.name !== 'AbortError') { setError(err.message); setStatus('error') } })
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query])

  useEffect(() => {
    peopleApi.following()
      .then(data => setFollowing(data.people))
      .catch(err => setError(err.message))
  }, [])

  async function openProfile(id) {
    setError('')
    setBusy(true)
    try {
      setSelected(await peopleApi.profile(id))
      setSelectedList(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleFollow() {
    if (!selected) return
    setError('')
    setBusy(true)
    try {
      const result = await peopleApi.follow(selected.person.id, selected.person.isFollowing)
      setSelected(current => ({ ...current, person: { ...current.person, ...result } }))
      setPeople(current => current.map(person => person.id === selected.person.id
        ? { ...person, followers: result.followers } : person))
      await refreshFollowing()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (selected) {
    return <ReaderProfile selected={selected} selectedList={selectedList} onSelectList={setSelectedList}
      onBack={() => { setSelected(null); setSelectedList(null) }} onFollow={toggleFollow}
      busy={busy} error={error} onBookDetails={onBookDetails} />
  }

  return (
    <section aria-labelledby="readers-heading">
      <span className="eyebrow">READ TOGETHER</span>
      <h1 className="page-title" id="readers-heading">Find readers</h1>
      <p className="intro">Explore other readers' libraries and follow the ones you like.</p>
      <label className="search-label" htmlFor="reader-search">Search profiles by name</label>
      <input id="reader-search" className="search" type="search" placeholder="Enter a reader's name…"
        value={query} onChange={event => setQuery(event.target.value)} />
      {error && <p className="auth-error" role="alert">{error}</p>}
      {following.length > 0 && (
        <section aria-labelledby="following-heading">
          <h2 id="following-heading">Following</h2>
          <div className="reader-grid">
            {following.map(person => <ReaderCard key={person.id} person={person} onOpen={openProfile} disabled={busy} />)}
          </div>
        </section>
      )}
      <section aria-labelledby="reader-results-heading">
        <h2 id="reader-results-heading">{query.trim() ? 'Search results' : 'Readers to discover'}</h2>
        {status === 'loading' && <p role="status">Finding readers…</p>}
        {status === 'ready' && people.length === 0 && <p>No public profiles found.</p>}
        <div className="reader-grid">
          {people.map(person => <ReaderCard key={person.id} person={person} onOpen={openProfile} disabled={busy} />)}
        </div>
      </section>
    </section>
  )
}
