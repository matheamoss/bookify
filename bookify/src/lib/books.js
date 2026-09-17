export const starterBooks = [
  { id: 1, title: 'The Secret History', author: 'Donna Tartt', color: '#65503e', genre: 'Literary fiction' },
  { id: 2, title: 'Normal People', author: 'Sally Rooney', color: '#7b8966', genre: 'Romance' },
  { id: 3, title: 'The Bell Jar', author: 'Sylvia Plath', color: '#a76c58', genre: 'Classics' },
  { id: 4, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', color: '#455d50', genre: 'Classics' },
  { id: 5, title: 'Little Women', author: 'Louisa May Alcott', color: '#9b8061', genre: 'Classics' },
]

export const emptyLists = [
  { id: 1, name: 'Currently reading', books: [] },
  { id: 2, name: 'Want to read', books: [] },
  { id: 3, name: 'My favorites', books: [] },
]

const searchFields = 'key,title,author_name,cover_i,first_publish_year'

export function fromOpenLibrary(doc) {
  const workKey = doc.key.startsWith('/works/') ? doc.key : `/works/${doc.key}`
  return {
    id: workKey,
    title: doc.title,
    author: doc.author_name?.[0] || 'Unknown author',
    coverId: doc.cover_i || null,
    year: doc.first_publish_year || null,
    color: '#455d50',
  }
}

export async function searchBooks(query, signal) {
  const params = new URLSearchParams({ q: query, fields: searchFields, limit: '24' })
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, { signal })
  if (!response.ok) throw new Error('Search failed')
  const data = await response.json()
  return (data.docs || []).filter(doc => doc.key && doc.title).map(fromOpenLibrary)
}

export async function findStarterCover(book, signal) {
  const params = new URLSearchParams({ title: book.title, author: book.author, fields: searchFields, limit: '1' })
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, { signal })
  if (!response.ok) throw new Error('Cover lookup failed')
  const data = await response.json()
  const doc = data.docs?.[0]
  if (!doc?.cover_i) return null
  const workKey = doc.key?.startsWith('/works/') ? doc.key : `/works/${doc.key}`
  return { id: book.id, coverId: doc.cover_i, workKey }
}

export async function getBookDescription(book, signal) {
  const workKey = book.workKey || (typeof book.id === 'string' ? book.id : null)
  if (!workKey?.startsWith('/works/')) return 'No description is available for this edition.'
  const response = await fetch(`https://openlibrary.org${workKey}.json`, { signal })
  if (!response.ok) throw new Error('Description failed')
  const data = await response.json()
  return typeof data.description === 'string'
    ? data.description
    : data.description?.value || 'No description is available for this book.'
}

export function savedBookIds(lists, ratings) {
  return new Set([
    ...lists.flatMap(list => list.books.map(String)),
    ...Object.keys(ratings).filter(id => ratings[id] > 0),
  ])
}
