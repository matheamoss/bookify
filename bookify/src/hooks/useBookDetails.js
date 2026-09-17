import { useEffect, useState } from 'react'
import { getBookDescription } from '../lib/books'

export function useBookDetails() {
  const [book, setBook] = useState(null)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!book) return
    const controller = new AbortController()
    getBookDescription(book, controller.signal)
      .then(setDescription)
      .catch(error => { if (error.name !== 'AbortError') setDescription('Description could not be loaded.') })
    return () => controller.abort()
  }, [book])

  function openBook(nextBook) {
    setDescription('Loading description…')
    setBook(nextBook)
  }

  return { book, description, openBook, closeBook: () => setBook(null) }
}
