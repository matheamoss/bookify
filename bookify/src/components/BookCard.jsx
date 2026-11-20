import { useState } from 'react'
import { starCount } from '../lib/books'
import BookCover from './BookCover'

export default function BookCard({
  book, ratings, reviews, lists, onDetails, onRate, onReview, onAdd, readOnly = false, children,
}) {
  const rating = starCount(ratings?.[book.id])
  const review = reviews?.[book.id] || ''
  // Keep the note local while typing and store it when the field loses focus.
  const [draft, setDraft] = useState(null)

  function commitReview() {
    if (draft !== null && draft !== review) onReview(book, draft)
    setDraft(null)
  }

  return (
    <article className="book-card">
      <BookCover book={book} />
      <h3>{book.title}</h3>
      <p>{book.author}</p>
      <button className="book-details-link" onClick={() => onDetails(book)}>About book</button>
      {readOnly ? (
        <>
          {rating > 0 && <p className="rank-stars" aria-label={`${rating} out of 5 stars`}>{'★'.repeat(rating)}</p>}
          {review && <p className="book-review-text">{review}</p>}
        </>
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
          <label className="book-review-label">
            <span>Your note</span>
            <textarea
              value={draft ?? review}
              onChange={event => setDraft(event.target.value)}
              onBlur={commitReview}
              placeholder="Write what you thought..."
              maxLength={500}
              rows={3}
            />
          </label>
          {children}
        </>
      )}
    </article>
  )
}
