export default function ReaderCard({ person, onOpen, disabled = false }) {
  return (
    <button className="reader-card" onClick={() => onOpen(person.id)} disabled={disabled}>
      <span className="reader-avatar" aria-hidden="true">{person.name.charAt(0).toUpperCase()}</span>
      <strong>{person.name}</strong>
      <small>{person.followers} followers</small>
    </button>
  )
}
