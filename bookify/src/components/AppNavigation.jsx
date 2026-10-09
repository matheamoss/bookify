const sections = [
  { name: 'Home', icon: '⌂', mobileLabel: 'Home' },
  { name: 'Discover', icon: '✧', mobileLabel: 'Books' },
  { name: 'Your Library', icon: '▤', mobileLabel: 'Library' },
  { name: 'Rankings', icon: '★', mobileLabel: 'Top' },
  { name: 'Readers', icon: '♧', mobileLabel: 'Readers' },
  { name: 'Profile', icon: '♙', mobileLabel: 'Me' },
  { name: 'About', label: 'About Bookify', icon: 'ⓘ', mobileLabel: 'About' },
]

export function Sidebar({ page, lists, onNavigate, onSelectList, onCreateList }) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate('Home')} aria-label="Go to Bookify home">
        Bookify<span>✦</span>
      </button>
      <p className="brand-subtitle">A home for every story.</p>
      <nav aria-label="Main navigation">
        {sections.map(section => (
          <button key={section.name} className={page === section.name ? 'nav-active' : ''}
            onClick={() => onNavigate(section.name)} aria-current={page === section.name ? 'page' : undefined}>
            <span aria-hidden="true">{section.icon}</span>
            <span>{section.label || section.name}</span>
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

export function Topbar({ user, onHome, onProfile }) {
  return (
    <header className="topbar">
      <button className="mobile-brand" onClick={onHome}>Bookify</button>
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
          onClick={() => onNavigate(section.name)} aria-current={page === section.name ? 'page' : undefined}
          aria-label={section.label || section.name}>
          {section.mobileLabel}
        </button>
      ))}
    </nav>
  )
}
