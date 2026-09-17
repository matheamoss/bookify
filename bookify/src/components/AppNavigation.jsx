const sections = [
  { name: 'Home', icon: '⌂' },
  { name: 'Discover', icon: '✧' },
  { name: 'Your Library', icon: '▤' },
  { name: 'Rankings', icon: '★' },
  { name: 'Readers', icon: '♧' },
  { name: 'Profile', icon: '♙' },
]

export function Sidebar({ page, lists, onNavigate, onSelectList, onCreateList }) {
  return (
    <aside className="sidebar">
      <div className="brand">Bookify<span>✦</span></div>
      <p className="brand-subtitle">A home for every story.</p>
      <nav aria-label="Main navigation">
        {sections.map(section => (
          <button key={section.name} className={page === section.name ? 'nav-active' : ''}
            onClick={() => onNavigate(section.name)} aria-current={page === section.name ? 'page' : undefined}>
            <span aria-hidden="true">{section.icon}</span>
            <span>{section.name}</span>
          </button>
        ))}
      </nav>
      <section className="sidebar-bottom" aria-label="Your playlists">
        <p>YOUR PLAYLISTS</p>
        {lists.map(list => <button key={list.id} onClick={() => onSelectList(list.id)}>{list.name}</button>)}
        <button className="create-link" onClick={onCreateList}>＋ Create playlist</button>
      </section>
    </aside>
  )
}

export function Topbar({ user, onProfile }) {
  return (
    <header className="topbar">
      <div className="mobile-brand">Bookify</div>
      <span className="eyebrow">YOUR LITERARY UNIVERSE</span>
      <button className="profile-button" onClick={onProfile} aria-label="Open profile">
        {user.name.charAt(0).toUpperCase()}
      </button>
    </header>
  )
}

export function MobileNav({ page, onNavigate }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {sections.map(section => (
        <button key={section.name} className={page === section.name ? 'nav-active' : ''}
          onClick={() => onNavigate(section.name)} aria-current={page === section.name ? 'page' : undefined}>
          {section.name}
        </button>
      ))}
    </nav>
  )
}
