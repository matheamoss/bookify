export default function PlaylistCard({ list, onClick, artwork = false, active = false }) {
  return (
    <button className={`playlist-card${active ? ' reader-list-active' : ''}`} onClick={onClick}>
      <span className="playlist-icon" aria-hidden="true">
        ✧
      </span>
      <strong>{list.name}</strong>
      <small>{list.books.length} books</small>
    </button>
  )
}
