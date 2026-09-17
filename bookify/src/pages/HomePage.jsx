import BookCard from '../components/BookCard'
import PlaylistCard from '../components/PlaylistCard'

export default function HomePage({ catalog, lists, ratings, onNavigate, onSelectList, onCreateList, onBookDetails, onRate, onAdd }) {
  return (
    <>
      <section className="hero">
        <span className="eyebrow">WELCOME TO BOOKIFY</span>
        <h1>Build your library,<br /><em>Share your taste.</em></h1>
        <p>Collect your favorite stories, create your own book playlists and discover your next great read.</p>
        <button className="primary-button" onClick={() => onNavigate('Discover')}>Explore books →</button>
        <div className="hero-flower" aria-hidden="true">𝔅</div>
      </section>

      <section aria-labelledby="home-library-heading">
        <div className="section-heading">
          <h2 id="home-library-heading">Your library</h2>
          <button onClick={() => onNavigate('Your Library')}>View all →</button>
        </div>
        <div className="playlist-grid">
          {lists.slice(0, 4).map(list => (
            <PlaylistCard key={list.id} list={list} artwork onClick={() => onSelectList(list.id)} />
          ))}
          <button className="playlist-card add-card" onClick={onCreateList}>
            <span className="playlist-icon" aria-hidden="true">＋</span>
            <strong>Create playlist</strong>
            <small>Start a new collection</small>
          </button>
        </div>
      </section>

      <section aria-labelledby="home-books-heading">
        <div className="section-heading">
          <h2 id="home-books-heading">Discover your next read</h2>
          <button onClick={() => onNavigate('Discover')}>See all →</button>
        </div>
        <div className="book-grid">
          {catalog.slice(0, 4).map(book => (
            <BookCard key={book.id} book={book} lists={lists} ratings={ratings}
              onDetails={onBookDetails} onRate={onRate} onAdd={onAdd} />
          ))}
        </div>
      </section>
    </>
  )
}
