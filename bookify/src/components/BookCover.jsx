import { useState } from 'react'

export default function BookCover({ book }) {
  const [failedCoverId, setFailedCoverId] = useState(null)
  const failed = failedCoverId === book.coverId

  return (
    <figure className="book-cover" style={{ background: book.color || '#455d50' }}>
      {book.coverId && !failed ? (
        <img
          src={`https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg?default=false`}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          onError={() => setFailedCoverId(book.coverId)}
        />
      ) : (
        <div className="cover-fallback" aria-label={`Cover unavailable for ${book.title}`}>
          <span className="cover-decoration" aria-hidden="true">✦</span>
          <strong className="cover-title">{book.title}</strong>
          <small>{book.author}</small>
        </div>
      )}
    </figure>
  )
}
