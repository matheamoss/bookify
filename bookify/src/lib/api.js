async function request(path, options = {}) {
  const response = await fetch(path, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong.')
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

const jsonOptions = (method, body) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

export const authApi = {
  me: () => request('/api/me'),
  config: () => request('/api/config'),
  register: details => request('/api/register', jsonOptions('POST', details)),
  login: details => request('/api/login', jsonOptions('POST', details)),
  logout: () => request('/api/logout', { method: 'POST' }),
  verifyEmail: token => request('/api/verify-email', jsonOptions('POST', { token })),
  resendVerification: email => request('/api/resend-verification', jsonOptions('POST', { email })),
  forgotPassword: email => request('/api/forgot-password', jsonOptions('POST', { email })),
  resetPassword: (token, password) => request('/api/reset-password', jsonOptions('POST', { token, password })),
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
