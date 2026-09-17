import { useEffect, useState } from 'react'
import { searchBooks } from '../lib/books'

export function useBookSearch() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState({ query: '', results: [], status: 'idle' })
  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchBooks(trimmed, controller.signal)
        .then(results => setResponse({ query: trimmed, results, status: 'done' }))
        .catch(error => {
          if (error.name !== 'AbortError') {
            setResponse({ query: trimmed, results: [], status: 'error' })
          }
        })
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [trimmed])

  const current = response.query === trimmed && trimmed.length >= 2
  return {
    query, setQuery,
    results: current ? response.results : [],
    status: trimmed.length < 2 ? 'idle' : current ? response.status : 'loading',
  }
}
