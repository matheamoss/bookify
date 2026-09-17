export default function RankingsPage({ catalog, ratings }) {
  const rankedBooks = catalog.filter(book => ratings[book.id]).sort((a, b) => ratings[b.id] - ratings[a.id])
  return (
    <section aria-labelledby="rankings-heading">
      <span className="eyebrow">YOUR PERSONAL TOP LIST</span>
      <h1 className="page-title" id="rankings-heading">Book Rankings</h1>
      <p className="intro">Your highest-rated stories, all in one place.</p>
      {rankedBooks.length === 0 && <p>Rate some books to create your ranking.</p>}
      {rankedBooks.length > 0 && (
        <ol className="rankings-list">
          {rankedBooks.map((book, index) => (
            <li className="ranking-row" key={book.id}>
              <span className="rank-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{book.title}</strong><p>{book.author}</p></div>
              <span className="rank-stars" aria-label={`${ratings[book.id]} out of 5 stars`}>{'★'.repeat(ratings[book.id])}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
