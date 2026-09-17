import { useEffect } from 'react'
import BookCover from './BookCover'

export default function BookDialog({ book, description, onClose }) {
  useEffect(() => {
    if (!book) return
    const onKeyDown = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [book, onClose])

  if (!book) return null
  const workKey = book.workKey || (typeof book.id === 'string' && book.id.startsWith('/works/') ? book.id : null)

  return (
    <div className="book-dialog-backdrop" onClick={onClose}>
      <section
        className="book-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-dialog-title"
        onClick={event => event.stopPropagation()}
      >
        <button className="dialog-close" onClick={onClose} aria-label="Close book details">×</button>
        <div className="dialog-cover"><BookCover book={book} /></div>
        <div>
          <h2 id="book-dialog-title">{book.title}</h2>
          <p className="dialog-author">{book.author}{book.year ? ` · ${book.year}` : ''}</p>
          <p className="dialog-description">{description}</p>
          {workKey && <a href={`https://openlibrary.org${workKey}`} target="_blank" rel="noreferrer">View on Open Library ↗</a>}
        </div>
      </section>
    </div>
  )
}
