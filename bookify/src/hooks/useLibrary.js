import { useCallback, useEffect, useRef, useState } from 'react'
import { libraryApi } from '../lib/api'
import { emptyLists, findStarterCover, starterBooks } from '../lib/books'
import { readLocal } from '../lib/localLibrary'

export function useLibrary(initialLibrary) {
  const [catalog, setCatalog] = useState(initialLibrary?.catalog || starterBooks)
  const [lists, setLists] = useState(initialLibrary?.lists || emptyLists)
  const [ratings, setRatings] = useState(initialLibrary?.ratings || {})
  const [reviews, setReviews] = useState(initialLibrary?.reviews || {})
  const [ranking, setRanking] = useState(initialLibrary?.ranking || [])
  const [saveError, setSaveError] = useState('')
  const saveQueue = useRef(Promise.resolve())

  const saveNow = useCallback(library => {
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => libraryApi.save(library))
      .then(() => setSaveError(''))
      .catch(error => { setSaveError(error.message); throw error })
    return saveQueue.current
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      saveNow({ catalog, lists, ratings, reviews, ranking }).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [catalog, lists, ratings, reviews, ranking, saveNow])

  useEffect(() => {
    const missing = starterBooks.filter(book => !initialLibrary?.catalog?.find(item => item.id === book.id)?.coverId)
    if (!missing.length) return
    const controller = new AbortController()
    Promise.all(missing.map(book => findStarterCover(book, controller.signal)))
      .then(covers => setCatalog(current => current.map(book => {
        const cover = covers.find(item => item?.id === book.id)
        return cover ? { ...book, coverId: cover.coverId, workKey: cover.workKey } : book
      })))
      .catch(() => {})
    return () => controller.abort()
  }, [initialLibrary])

  function createList() {
    const name = window.prompt('Name your new book playlist:')
    if (!name?.trim()) return
    setLists(current => [...current, { id: Date.now(), name: name.trim(), books: [] }])
  }

  function addBook(book, listId) {
    setCatalog(current => current.some(item => item.id === book.id) ? current : [...current, book])
    setLists(current => current.map(list =>
      String(list.id) === String(listId) && !list.books.includes(book.id)
        ? { ...list, books: [...list.books, book.id] }
        : list
    ))
  }

  function removeBook(listId, bookId) {
    setLists(current => current.map(list =>
      String(list.id) === String(listId)
        ? { ...list, books: list.books.filter(id => String(id) !== String(bookId)) }
        : list
    ))
  }

  function rateBook(book, rating) {
    setCatalog(current => current.some(item => item.id === book.id) ? current : [...current, book])
    setRatings(current => ({ ...current, [book.id]: rating }))
    setRanking(current => current.some(id => String(id) === String(book.id)) ? current : [...current, book.id])
  }

  function reviewBook(book, review) {
    setCatalog(current => current.some(item => item.id === book.id) ? current : [...current, book])
    setReviews(current => ({ ...current, [book.id]: review }))
  }

  function moveRankedBook(bookId, direction) {
    setRanking(current => {
      const index = current.findIndex(id => String(id) === String(bookId))
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  function removeRankedBook(bookId) {
    setRanking(current => current.filter(id => String(id) !== String(bookId)))
  }

  function importFromDevice() {
    const oldLists = readLocal('bookify-lists')
    const oldRatings = readLocal('bookify-ratings')
    const oldReviews = readLocal('bookify-reviews')
    const oldCatalog = readLocal('bookify-catalog')
    if (Array.isArray(oldLists)) setLists(oldLists)
    if (oldRatings && typeof oldRatings === 'object') setRatings(oldRatings)
    if (oldReviews && typeof oldReviews === 'object') setReviews(oldReviews)
    if (Array.isArray(oldCatalog)) setCatalog(oldCatalog)
  }

  return {
    catalog, lists, ratings, reviews, ranking, saveError, setSaveError,
    createList, addBook, removeBook, rateBook, reviewBook, moveRankedBook, removeRankedBook,
    importFromDevice, saveNow,
  }
}
