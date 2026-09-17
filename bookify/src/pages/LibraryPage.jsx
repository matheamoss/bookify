import BookCard from '../components/BookCard'
import PlaylistCard from '../components/PlaylistCard'

export default function LibraryPage({ catalog, lists, ratings, selectedList, onSelectList, onCreateList, onBookDetails, onRate, onAdd }) {
  const list = lists.find(item => String(item.id) === String(selectedList))
  const books = list ? catalog.filter(book => list.books.some(id => String(id) === String(book.id))) : []

  return (
    <section aria-labelledby="library-heading">
      <span className="eyebrow">YOUR COLLECTION</span>
      <h1 className="page-title" id="library-heading">Your Library</h1>
      <button className="primary-button" onClick={onCreateList}>＋ Create playlist</button>
      <div className="playlist-grid library-lists">
        {lists.map(item => <PlaylistCard key={item.id} list={item} onClick={() => onSelectList(item.id)}
          active={String(selectedList) === String(item.id)} />)}
      </div>
      {list && (
        <section className="selected-list" aria-labelledby="selected-list-heading">
          <h2 id="selected-list-heading">{list.name}</h2>
          <div className="book-grid">
            {books.map(book => <BookCard key={book.id} book={book} lists={lists} ratings={ratings}
              onDetails={onBookDetails} onRate={onRate} onAdd={onAdd} />)}
          </div>
          {books.length === 0 && <p className="hint">This playlist is empty. Add books from Discover.</p>}
          {books.length > 0 && <p className="hint">Add more books from the Discover page.</p>}
        </section>
      )}
    </section>
  )
}
