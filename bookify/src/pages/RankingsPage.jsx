export default function RankingsPage({ catalog, ratings, ranking, onMove, onRemove }) {
  const ratedBooks = catalog.filter(book => ratings[book.id])
  const rankedBooks = [
    ...ranking
      .map(id => ratedBooks.find(book => String(book.id) === String(id)))
      .filter(Boolean),
    ...ratedBooks.filter(book => !ranking.some(id => String(id) === String(book.id))),
  ]

  return (
    <section aria-labelledby="rankings-heading">
      <span className="eyebrow">YOUR PERSONAL TOP LIST</span>
      <h1 className="page-title" id="rankings-heading">Book Rankings</h1>
      <p className="intro">Move books up or down to set your own first, second and third place.</p>
      {rankedBooks.length === 0 && <p>Rate some books to create your ranking.</p>}
      {rankedBooks.length > 0 && (
        <ol className="rankings-list">
          {rankedBooks.map((book, index) => (
            <li className="ranking-row" key={book.id}>
              <span className="rank-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{book.title}</strong><p>{book.author}</p></div>
              <span className="rank-stars" aria-label={`${ratings[book.id]} out of 5 stars`}>{'★'.repeat(ratings[book.id])}</span>
              <div className="ranking-actions" aria-label={`Change ranking for ${book.title}`}>
                <button onClick={() => onMove(book.id, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                <button onClick={() => onMove(book.id, 1)} disabled={index === rankedBooks.length - 1} aria-label="Move down">↓</button>
                <button onClick={() => onRemove(book.id)}>Remove</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
