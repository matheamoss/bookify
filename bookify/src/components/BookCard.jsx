import BookCover from './BookCover'

export default function BookCard({ book, ratings, lists, onDetails, onRate, onAdd, readOnly = false }) {
  const rating = ratings?.[book.id] || 0
  return (
    <article className="book-card">
      <BookCover book={book} />
      <h3>{book.title}</h3>
      <p>{book.author}</p>
      <button className="book-details-link" onClick={() => onDetails(book)}>About book</button>
      {readOnly ? (
        rating > 0 && <p className="rank-stars" aria-label={`${rating} out of 5 stars`}>{'★'.repeat(rating)}</p>
      ) : (
        <>
          <div className="stars" aria-label={`Rate ${book.title}`}>
            {[1, 2, 3, 4, 5].map(number => (
              <button
                key={number}
                onClick={() => onRate(book, number)}
                aria-label={`Rate ${number} stars`}
                className={number <= rating ? 'active' : ''}
              >★</button>
            ))}
          </div>
          <select
            value=""
            onChange={event => onAdd(book, event.target.value)}
            aria-label={`Add ${book.title} to playlist`}
          >
            <option value="">+ Add to playlist</option>
            {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
          </select>
        </>
      )}
    </article>
  )
}
