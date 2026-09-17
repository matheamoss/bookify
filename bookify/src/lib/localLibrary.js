export function readLocal(key, fallback = null) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export function hasLocalLibrary() {
  try { return Boolean(localStorage.getItem('bookify-lists')) } catch { return false }
}
