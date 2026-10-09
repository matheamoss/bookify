import PlaylistCard from '../components/PlaylistCard'
import { hasLocalLibrary } from '../lib/localLibrary'

export default function ProfilePage({
  user, lists, ratings, isPublic, visibilityBusy, saveError,
  onToggleVisibility, onSelectList, onSelectLibraryView, onImport, onSignOut,
}) {
  const savedBookCount = new Set(lists.flatMap(list => list.books.map(String))).size

  return (
    <section aria-labelledby="profile-heading">
      <span className="eyebrow">YOUR READING IDENTITY</span>
      <header className="profile-header">
        <div className="profile-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <h1 className="page-title" id="profile-heading">{user.name}</h1>
          <p>{user.email}</p>
          <span className="verification-note">Email saved for this account. Mail verification can be enabled when an email provider is connected.</span>
        </div>
      </header>
      <p className="intro">A little corner of the internet for all your favorite stories.</p>
      <section className="visibility-panel" aria-label="Profile visibility">
        <div>
          <strong>{isPublic ? 'Public profile' : 'Private profile'}</strong>
          <p>{isPublic
            ? 'Other readers can find you and see your playlists, saved books and ratings. Your email stays private.'
            : 'Only you can see your playlists and library.'}</p>
        </div>
        <button onClick={onToggleVisibility} disabled={visibilityBusy}>
          {isPublic ? 'Make private' : 'Make public'}
        </button>
      </section>
      <div className="profile-stats" aria-label="Reading statistics">
        <button onClick={() => onSelectLibraryView(null)}>
          <strong>{lists.length}</strong><span>Playlists</span>
        </button>
        <button onClick={() => onSelectLibraryView('__rated')}>
          <strong>{Object.keys(ratings).length}</strong><span>Rated books</span>
        </button>
        <button onClick={() => onSelectLibraryView('__saved')}>
          <strong>{savedBookCount}</strong><span>Books saved</span>
        </button>
      </div>
      <section aria-labelledby="my-playlists-heading">
        <h2 id="my-playlists-heading">My playlists</h2>
        <div className="playlist-grid">
          {lists.map(list => <PlaylistCard key={list.id} list={list} onClick={() => onSelectList(list.id)} />)}
        </div>
      </section>
      <div className="account-actions">
        {hasLocalLibrary() && <button onClick={onImport}>Import books saved on this device</button>}
        <button onClick={onSignOut}>Sign out</button>
      </div>
      {saveError && <p className="auth-error" role="alert">{saveError}</p>}
    </section>
  )
}
