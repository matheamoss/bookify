async function request(path, options = {}) {
  const response = await fetch(path, options)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

const jsonOptions = (method, body) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

export const authApi = {
  me: () => request('/api/me'),
  register: details => request('/api/register', jsonOptions('POST', details)),
  login: details => request('/api/login', jsonOptions('POST', details)),
  logout: () => request('/api/logout', { method: 'POST' }),
}

export const libraryApi = {
  get: () => request('/api/library'),
  save: library => request('/api/library', jsonOptions('PUT', library)),
}

export const peopleApi = {
  search: (query, signal) => request(`/api/people?q=${encodeURIComponent(query)}`, { signal }),
  following: () => request('/api/following'),
  profile: id => request(`/api/people/${id}`),
  follow: (id, isFollowing) => request(`/api/people/${id}/follow`, { method: isFollowing ? 'DELETE' : 'POST' }),
  visibility: isPublic => request('/api/profile/visibility', jsonOptions('PUT', { isPublic })),
}
