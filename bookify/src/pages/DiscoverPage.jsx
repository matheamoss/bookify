import BookCard from '../components/BookCard'

export default function DiscoverPage({ catalog, lists, ratings, reviews, search, onBookDetails, onRate, onReview, onAdd }) {
  const { query, setQuery, results, status } = search
  const visibleBooks = query.trim().length >= 2
    ? results
    : catalog.filter(book => `${book.title} ${book.author} ${book.genre || ''}`.toLowerCase().includes(query.toLowerCase()))

  const message = status === 'loading' ? 'Searching books…'
    : status === 'error' ? 'Search is unavailable right now. Please try again.'
      : query.trim().length < 2 ? 'Enter at least two letters to search.'
        : status === 'done' ? `${results.length} books found` : ''

  return (
    <section aria-labelledby="discover-heading">
      <span className="eyebrow">EXPLORE THE SHELVES</span>
      <h1 className="page-title" id="discover-heading">Discover books</h1>
      <p className="intro">Find a story worth getting lost in.</p>
      <label className="search-label" htmlFor="book-search">Search the Open Library catalog</label>
      <input id="book-search" className="search" type="search" placeholder="Search books or authors..."
        value={query} onChange={event => setQuery(event.target.value)} />
      <p className="search-message" role="status">{message}</p>
      <div className="book-grid">
        {visibleBooks.map(book => (
          <BookCard key={book.id} book={book} lists={lists} ratings={ratings}
            reviews={reviews} onDetails={onBookDetails} onRate={onRate} onReview={onReview} onAdd={onAdd} />
        ))}
      </div>
      {status === 'done' && results.length === 0 && <p>No books found. Try another title or author.</p>}
    </section>
  )
}
