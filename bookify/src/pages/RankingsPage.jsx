import { starCount } from '../lib/books'

function RankingRow({ book, rating, number, children }) {
  return (
    <li className="ranking-row">
      <span className="rank-number" aria-hidden="true">{number}</span>
      <div><strong>{book.title}</strong><p>{book.author}</p></div>
      <span className="rank-stars" aria-label={`${rating} out of 5 stars`}>{'★'.repeat(rating)}</span>
      <div className="ranking-actions">{children}</div>
    </li>
  )
}

export default function RankingsPage({ catalog, ratings, ranking, onMove, onRemove, onAddToRanking }) {
  const ratedBooks = catalog.filter(book => starCount(ratings[book.id]) > 0)
  const isRanked = book => ranking.some(id => String(id) === String(book.id))
  const rankedBooks = ranking
    .map(id => ratedBooks.find(book => String(book.id) === String(id)))
    .filter(Boolean)
  const unrankedBooks = ratedBooks.filter(book => !isRanked(book))

  return (
    <section aria-labelledby="rankings-heading">
      <span className="eyebrow">YOUR PERSONAL TOP LIST</span>
      <h1 className="page-title" id="rankings-heading">Book Rankings</h1>
      <p className="intro">Move books up or down to set your own first, second and third place.</p>
      {ratedBooks.length === 0 && <p>Rate some books to create your ranking.</p>}
      {ratedBooks.length > 0 && rankedBooks.length === 0 && <p>Your ranking is empty. Add rated books from the list below.</p>}
      {rankedBooks.length > 0 && (
        <ol className="rankings-list">
          {rankedBooks.map((book, index) => (
            <RankingRow key={book.id} book={book} rating={starCount(ratings[book.id])}
              number={String(index + 1).padStart(2, '0')}>
              <button onClick={() => onMove(book.id, -1)} disabled={index === 0} aria-label={`Move ${book.title} up`}>↑</button>
              <button onClick={() => onMove(book.id, 1)} disabled={index === rankedBooks.length - 1} aria-label={`Move ${book.title} down`}>↓</button>
              <button onClick={() => onRemove(book.id)}>Remove</button>
            </RankingRow>
          ))}
        </ol>
      )}
      {unrankedBooks.length > 0 && (
        <section aria-labelledby="unranked-heading">
          <h2 id="unranked-heading">Not in your ranking</h2>
          <ul className="rankings-list">
            {unrankedBooks.map(book => (
              <RankingRow key={book.id} book={book} rating={starCount(ratings[book.id])} number="–">
                <button onClick={() => onAddToRanking(book.id)}>Add to ranking</button>
              </RankingRow>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
