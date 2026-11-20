import { useEffect, useState } from 'react'

export const pagePaths = {
  Home: '/',
  Discover: '/discover',
  'Your Library': '/library',
  Rankings: '/rankings',
  Readers: '/readers',
  Profile: '/profile',
  About: '/about',
}

const specialLists = { rated: '__rated', saved: '__saved' }

export function libraryPath(listId) {
  if (listId === null || listId === undefined) return '/library'
  if (listId === '__rated') return '/library/rated'
  if (listId === '__saved') return '/library/saved'
  return `/library/${encodeURIComponent(listId)}`
}

export const readerPath = personId => personId ? `/readers/${encodeURIComponent(personId)}` : '/readers'

// Turns a pathname into { page, param }. Unknown paths fall back to the home page.
export function parseRoute(pathname) {
  const [section = '', param = null, extra] = pathname.replace(/^\/+|\/+$/g, '').split('/').map(decodeURIComponent)
  if (extra !== undefined) return { page: 'Home', param: null }
  if (section === 'library') return { page: 'Your Library', param: param ? specialLists[param] || param : null }
  if (section === 'readers') return { page: 'Readers', param }
  if (param !== null) return { page: 'Home', param: null }
  const page = Object.keys(pagePaths).find(name => pagePaths[name] === `/${section}`)
  return { page: page || 'Home', param: null }
}

const changeEvent = 'bookify:navigate'

export function navigateTo(path, { replace = false } = {}) {
  if (path === window.location.pathname && !window.location.search) return
  window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
  window.dispatchEvent(new Event(changeEvent))
  if (!replace) window.scrollTo(0, 0)
}

export function useRoute() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const update = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', update)
    window.addEventListener(changeEvent, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(changeEvent, update)
    }
  }, [])

  return parseRoute(pathname)
}
