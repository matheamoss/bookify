import BookCard from '../components/BookCard'
import PlaylistCard from '../components/PlaylistCard'

const specialViews = {
  __rated: {
    title: 'Rated books',
    empty: 'Rate some books to collect them here.',
    hint: 'Click the stars again any time to change a rating.',
  },
  __saved: {
    title: 'Saved books',
    empty: 'Add books to playlists to collect them here.',
    hint: 'Open a playlist to remove a book from that playlist.',
  },
}

export default function LibraryPage({
  catalog, lists, ratings, reviews, selectedList, onSelectList, onCreateList, onBookDetails, onRate, onReview, onAdd, onRemove,
}) {
  const list = lists.find(item => String(item.id) === String(selectedList))
  const specialView = specialViews[selectedList]
  const savedIds = new Set(lists.flatMap(item => item.books.map(String)))
  const books = list
    ? catalog.filter(book => list.books.some(id => String(id) === String(book.id)))
    : selectedList === '__rated'
      ? catalog.filter(book => ratings[book.id])
      : selectedList === '__saved'
        ? catalog.filter(book => savedIds.has(String(book.id)))
        : []
  const heading = list?.name || specialView?.title

  return (
    <section aria-labelledby="library-heading">
      <span className="eyebrow">YOUR COLLECTION</span>
      <h1 className="page-title" id="library-heading">Your Library</h1>
      <button className="primary-button" onClick={onCreateList}>＋ Create playlist</button>
      <div className="playlist-grid library-lists">
        <button className={`playlist-card ${selectedList === '__rated' ? 'active' : ''}`} onClick={() => onSelectList('__rated')}>
          <span className="playlist-icon" aria-hidden="true">★</span>
          <strong>Rated books</strong>
          <small>{Object.keys(ratings).length} books</small>
        </button>
        <button className={`playlist-card ${selectedList === '__saved' ? 'active' : ''}`} onClick={() => onSelectList('__saved')}>
          <span className="playlist-icon" aria-hidden="true">▤</span>
          <strong>Saved books</strong>
          <small>{savedIds.size} books</small>
        </button>
        {lists.map(item => <PlaylistCard key={item.id} list={item} onClick={() => onSelectList(item.id)}
          active={String(selectedList) === String(item.id)} />)}
      </div>
      {heading && (
        <section className="selected-list" aria-labelledby="selected-list-heading">
          <h2 id="selected-list-heading">{heading}</h2>
          <div className="book-grid">
            {books.map(book => <BookCard key={book.id} book={book} lists={lists} ratings={ratings}
              reviews={reviews} onDetails={onBookDetails} onRate={onRate} onReview={onReview} onAdd={onAdd}>
              {list && (
                <button className="remove-book-button" onClick={() => onRemove(list.id, book.id)}>
                  Remove from playlist
                </button>
              )}
            </BookCard>)}
          </div>
          {books.length === 0 && <p className="hint">{specialView?.empty || 'This playlist is empty. Add books from Discover.'}</p>}
          {books.length > 0 && <p className="hint">{specialView?.hint || 'Add more books from the Discover page.'}</p>}
        </section>
      )}
    </section>
  )
}
