export default function AboutPage() {
  return (
    <section className="about-page" aria-labelledby="about-heading">
      <header className="about-intro">
        <span className="eyebrow">ABOUT BOOKIFY</span>
        <h1 id="about-heading">What is Bookify?</h1>
        <p>Bookify is a place for people who love books. Discover new titles, organize your reading into playlists, rate books you've read, and explore what other readers enjoy.</p>
      </header>

      <div className="about-details">
        <section aria-labelledby="about-purpose-heading">
          <span className="about-marker" aria-hidden="true">✦</span>
          <h2 id="about-purpose-heading">Why it exists</h2>
          <p>Bookify makes it easier to keep track of books you've read and want to read, and to share your taste in books with others.</p>
        </section>
        <section aria-labelledby="about-creator-heading">
          <span className="about-marker" aria-hidden="true">✦</span>
          <h2 id="about-creator-heading">Who made it?</h2>
          <p>Bookify was created by <strong>Mathea R. Moss</strong>.</p>
        </section>
      </div>
    </section>
  )
}
