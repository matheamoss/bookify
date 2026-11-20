import { randomBytes, timingSafeEqual } from 'node:crypto'
import { db } from './db.js'
import { send } from './http.js'
import { emailEnabled, sendPasswordResetEmail, sendVerificationEmail } from './email.js'
import { readJson, currentUser, sameOrigin, limited, clearLimit, passwordHash, makeSession, makeEmailToken, consumeEmailToken, tokenHash, cookie, cookieName } from './auth.js'

const emailRoutes = ['/api/verify-email', '/api/resend-verification', '/api/forgot-password', '/api/reset-password']
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

async function deliver(res, action) {
  try {
    await action()
    return true
  } catch (error) {
    console.error('Email delivery failed:', error.message)
    send(res, 503, { error: 'We could not send the email. Please try again shortly.' })
    return false
  }
}

const testUser = {
  name: 'Bookify Tester',
  email: 'test@bookify.local',
  password: 'Testbruker123!',
}
const testUserEnabled = process.env.NODE_ENV !== 'production' &&
  (process.env.BOOKIFY_ENABLE_TEST_USER === 'true' || process.env.BOOKIFY_ALLOWED_ORIGIN?.includes('127.0.0.1') ||
    process.env.BOOKIFY_ALLOWED_ORIGIN?.includes('localhost'))

function validateLibrary(value) {
  if (!value || !Array.isArray(value.lists) || !Array.isArray(value.catalog) || !value.ratings || typeof value.ratings !== 'object') return false
  if (value.lists.length > 200 || value.catalog.length > 3000 || Object.keys(value.ratings).length > 3000 ||
    (value.reviews && (typeof value.reviews !== 'object' || Object.keys(value.reviews).length > 3000 ||
      Object.values(value.reviews).some(review => typeof review !== 'string' || review.length > 500))) ||
    (value.ranking && (!Array.isArray(value.ranking) || value.ranking.length > 3000))) return false
  return value.lists.every(list => (typeof list.id === 'number' || typeof list.id === 'string') &&
    typeof list.name === 'string' && list.name.length <= 120 && Array.isArray(list.books) && list.books.length <= 3000) &&
    value.catalog.every(book => book && (typeof book.id === 'string' || typeof book.id === 'number') &&
      typeof book.title === 'string' && book.title.length <= 300 && typeof book.author === 'string' && book.author.length <= 300)
}

const hexColor = /^#[0-9a-f]{3,8}$/i
const workKeyPattern = /^\/works\/OL\d+W$/

// Strip fields that are rendered for other readers (links, styles, star counts) unless they have the expected shape.
function sanitizeLibrary(library) {
  const catalog = (library.catalog || []).map(book => {
    const clean = { id: book.id, title: book.title, author: book.author }
    if (typeof book.genre === 'string' && book.genre.length <= 80) clean.genre = book.genre
    if (typeof book.color === 'string' && hexColor.test(book.color)) clean.color = book.color
    if (Number.isSafeInteger(book.coverId) && book.coverId > 0) clean.coverId = book.coverId
    if (Number.isSafeInteger(book.year)) clean.year = book.year
    if (typeof book.workKey === 'string' && workKeyPattern.test(book.workKey)) clean.workKey = book.workKey
    if (book.coverChecked === true) clean.coverChecked = true
    return clean
  })
  const ratings = Object.fromEntries(Object.entries(library.ratings || {})
    .filter(([, rating]) => Number.isInteger(rating) && rating >= 1 && rating <= 5))
  const reviews = Object.fromEntries(Object.entries(library.reviews || {})
    .filter(([, review]) => typeof review === 'string' && review.length <= 500))
  const ranking = (library.ranking || []).filter(id => typeof id === 'string' || typeof id === 'number')
  const lists = (library.lists || []).map(list => ({
    id: list.id,
    name: list.name,
    books: list.books.filter(id => typeof id === 'string' || typeof id === 'number'),
  }))
  return { lists, ratings, reviews, catalog, ranking }
}

export async function api(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { ok: true })
  if (!['GET', 'HEAD'].includes(req.method) && !sameOrigin(req)) return send(res, 403, { error: 'Request origin is not allowed.' })
  if (req.method === 'GET' && pathname === '/api/config') return send(res, 200, { emailEnabled })
  if (!emailEnabled && emailRoutes.includes(pathname)) return send(res, 404, { error: 'Not found.' })

  if (req.method === 'POST' && pathname === '/api/register') {
    const { name, email, password, publicProfile } = await readJson(req)
    const cleanName = String(name || '').trim()
    const cleanEmail = String(email || '').trim().toLowerCase()
    if (cleanName.length < 2 || cleanName.length > 80 || !validEmail(cleanEmail) ||
      typeof password !== 'string' || password.length < 12 || password.length > 200 ||
      (publicProfile !== undefined && typeof publicProfile !== 'boolean')) {
      return send(res, 400, { error: 'Enter a name, valid email and password of at least 12 characters.' })
    }
    if (limited(req, cleanEmail)) return send(res, 429, { error: 'Too many attempts. Try again later.' })
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)) return send(res, 409, { error: 'An account with this email already exists.' })
    const user = { id: randomBytes(16).toString('hex'), name: cleanName, email: cleanEmail, is_public: publicProfile === false ? 0 : 1 }
    const salt = randomBytes(16).toString('hex')
    const hash = await passwordHash(password, salt)
    db.prepare('INSERT INTO users (id, name, email, password_hash, salt, created_at, is_public, email_verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(user.id, user.name, user.email, hash, salt, Date.now(), user.is_public, emailEnabled ? null : Date.now())
    if (!emailEnabled) return makeSession(res, user)
    const token = makeEmailToken(user.id, 'verify')
    if (!await deliver(res, () => sendVerificationEmail({ to: user.email, name: user.name, token }))) {
      db.prepare('DELETE FROM users WHERE id = ?').run(user.id)
      return
    }
    return send(res, 201, { requiresVerification: true, email: user.email })
  }

  if (req.method === 'POST' && pathname === '/api/verify-email') {
    const { token } = await readJson(req)
    const user = consumeEmailToken(token, 'verify')
    if (!user) return send(res, 400, { error: 'This confirmation link is invalid or has expired.' })
    db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ?').run(Date.now(), user.user_id)
    return makeSession(res, { id: user.user_id, name: user.name, email: user.email, is_public: user.is_public })
  }

  if (req.method === 'POST' && pathname === '/api/resend-verification') {
    const { email } = await readJson(req)
    const cleanEmail = String(email || '').trim().toLowerCase()
    if (!validEmail(cleanEmail)) return send(res, 400, { error: 'Enter a valid email address.' })
    if (limited(req, `verify:${cleanEmail}`)) return send(res, 429, { error: 'Too many attempts. Try again later.' })
    const user = db.prepare('SELECT id, name, email, email_verified_at FROM users WHERE email = ?').get(cleanEmail)
    if (user && !user.email_verified_at) {
      const token = makeEmailToken(user.id, 'verify')
      if (!await deliver(res, () => sendVerificationEmail({ to: user.email, name: user.name, token }))) return
    }
    return send(res, 200, { ok: true })
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    const { email, password } = await readJson(req)
    const cleanEmail = String(email || '').trim().toLowerCase()
    if (limited(req, cleanEmail)) return send(res, 429, { error: 'Too many attempts. Try again later.' })
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail)
    if (testUserEnabled && !user && cleanEmail === testUser.email && password === testUser.password) {
      const salt = randomBytes(16).toString('hex')
      const hash = await passwordHash(testUser.password, salt)
      user = { id: randomBytes(16).toString('hex'), name: testUser.name, email: testUser.email, password_hash: hash, salt, is_public: 1 }
      user.email_verified_at = Date.now()
      db.prepare('INSERT INTO users (id, name, email, password_hash, salt, created_at, is_public, email_verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(user.id, user.name, user.email, user.password_hash, user.salt, Date.now(), user.is_public, user.email_verified_at)
    }
    const hash = await passwordHash(String(password || ''), user?.salt || 'invalid-user')
    if (!user || !timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.password_hash, 'hex')))
      return send(res, 401, { error: 'Incorrect email or password.' })
    if (emailEnabled && !user.email_verified_at) return send(res, 403, { error: 'Confirm your email before signing in.', needsVerification: true })
    clearLimit(req, cleanEmail)
    return makeSession(res, user)
  }

  if (req.method === 'POST' && pathname === '/api/forgot-password') {
    const { email } = await readJson(req)
    const cleanEmail = String(email || '').trim().toLowerCase()
    if (!validEmail(cleanEmail)) return send(res, 400, { error: 'Enter a valid email address.' })
    if (limited(req, `reset:${cleanEmail}`)) return send(res, 429, { error: 'Too many attempts. Try again later.' })
    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(cleanEmail)
    if (user) {
      const token = makeEmailToken(user.id, 'reset')
      if (!await deliver(res, () => sendPasswordResetEmail({ to: user.email, name: user.name, token }))) return
    }
    return send(res, 200, { ok: true })
  }

  if (req.method === 'POST' && pathname === '/api/reset-password') {
    const { token, password } = await readJson(req)
    if (typeof password !== 'string' || password.length < 12 || password.length > 200)
      return send(res, 400, { error: 'Use a password of at least 12 characters.' })
    const user = consumeEmailToken(token, 'reset')
    if (!user) return send(res, 400, { error: 'This reset link is invalid or has expired.' })
    const salt = randomBytes(16).toString('hex')
    const hash = await passwordHash(password, salt)
    db.prepare('UPDATE users SET password_hash = ?, salt = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?')
      .run(hash, salt, Date.now(), user.user_id)
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.user_id)
    return makeSession(res, { id: user.user_id, name: user.name, email: user.email, is_public: user.is_public })
  }

  if (req.method === 'POST' && pathname === '/api/logout') {
    const raw = (req.headers.cookie || '').split(';').map(part => part.trim())
      .find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
    if (raw && /^[a-f0-9]{64}$/.test(raw)) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(raw))
    return send(res, 200, { ok: true }, { 'set-cookie': cookie('', 0) })
  }

  const user = currentUser(req)
  if (req.method === 'GET' && pathname === '/api/me') return send(res, 200, { user })
  if (!user) return send(res, 401, { error: 'Please sign in.' })

  if (req.method === 'PUT' && pathname === '/api/profile/visibility') {
    const { isPublic } = await readJson(req)
    if (typeof isPublic !== 'boolean') return send(res, 400, { error: 'Choose public or private.' })
    db.prepare('UPDATE users SET is_public = ? WHERE id = ?').run(isPublic ? 1 : 0, user.id)
    return send(res, 200, { is_public: isPublic ? 1 : 0 })
  }

  if (req.method === 'GET' && pathname === '/api/people') {
    const query = new URL(req.url, 'http://localhost').searchParams.get('q')?.trim() || ''
    if (query.length > 80) return send(res, 400, { error: 'Search is too long.' })
    const escaped = query.replace(/[\\%_]/g, character => `\\${character}`)
    const people = db.prepare(`
      SELECT users.id, users.name,
        (SELECT COUNT(*) FROM follows WHERE followed_id = users.id) AS followers
      FROM users
      WHERE users.is_public = 1 AND users.id <> ? AND users.name LIKE ? ESCAPE '\\'
      ORDER BY users.name COLLATE NOCASE, users.id
      LIMIT 30
    `).all(user.id, `%${escaped}%`)
    return send(res, 200, { people })
  }

  if (req.method === 'GET' && pathname === '/api/following') {
    const people = db.prepare(`
      SELECT users.id, users.name,
        (SELECT COUNT(*) FROM follows WHERE followed_id = users.id) AS followers
      FROM follows JOIN users ON users.id = follows.followed_id
      WHERE follows.follower_id = ? AND users.is_public = 1
      ORDER BY follows.created_at DESC
    `).all(user.id)
    return send(res, 200, { people })
  }

  const profileMatch = /^\/api\/people\/([a-f0-9]{32})$/.exec(pathname)
  if (profileMatch && req.method === 'GET') {
    const person = db.prepare('SELECT id, name FROM users WHERE id = ? AND is_public = 1').get(profileMatch[1])
    if (!person) return send(res, 404, { error: 'Profile not found.' })
    const row = db.prepare('SELECT payload FROM libraries WHERE user_id = ?').get(person.id)
    const followers = db.prepare('SELECT COUNT(*) AS count FROM follows WHERE followed_id = ?').get(person.id).count
    const following = db.prepare('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?').get(person.id).count
    const isFollowing = !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followed_id = ?').get(user.id, person.id)
    return send(res, 200, { person: { ...person, followers, following, isFollowing }, library: sanitizeLibrary(row ? JSON.parse(row.payload) : {}) })
  }

  const followMatch = /^\/api\/people\/([a-f0-9]{32})\/follow$/.exec(pathname)
  if (followMatch && ['POST', 'DELETE'].includes(req.method)) {
    if (followMatch[1] === user.id) return send(res, 400, { error: 'You cannot follow yourself.' })
    const person = db.prepare('SELECT id FROM users WHERE id = ? AND is_public = 1').get(followMatch[1])
    if (!person) return send(res, 404, { error: 'Profile not found.' })
    if (req.method === 'POST') db.prepare('INSERT OR IGNORE INTO follows (follower_id, followed_id, created_at) VALUES (?, ?, ?)').run(user.id, person.id, Date.now())
    else db.prepare('DELETE FROM follows WHERE follower_id = ? AND followed_id = ?').run(user.id, person.id)
    const followers = db.prepare('SELECT COUNT(*) AS count FROM follows WHERE followed_id = ?').get(person.id).count
    return send(res, 200, { isFollowing: req.method === 'POST', followers })
  }

  if (req.method === 'GET' && pathname === '/api/library') {
    const row = db.prepare('SELECT payload, updated_at FROM libraries WHERE user_id = ?').get(user.id)
    return send(res, 200, { library: row ? JSON.parse(row.payload) : null, version: row?.updated_at ?? null })
  }
  if (req.method === 'PUT' && pathname === '/api/library') {
    const library = await readJson(req)
    if (!validateLibrary(library)) return send(res, 400, { error: 'Invalid library data.' })
    if (library.baseVersion !== undefined && library.baseVersion !== null && typeof library.baseVersion !== 'number')
      return send(res, 400, { error: 'Invalid library data.' })
    const current = db.prepare('SELECT updated_at FROM libraries WHERE user_id = ?').get(user.id)?.updated_at ?? null
    // Clients send the version they last loaded or saved; a mismatch means another tab or device saved in between.
    if (library.baseVersion !== undefined && library.baseVersion !== current) {
      return send(res, 409, { error: 'Your library was changed in another tab or on another device. Reload the page to get the latest version.', version: current })
    }
    const version = Math.max(Date.now(), (current ?? 0) + 1)
    db.prepare(`
      INSERT INTO libraries (user_id, payload, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
    `).run(user.id, JSON.stringify(sanitizeLibrary(library)), version)
    return send(res, 200, { ok: true, version })
  }
  return send(res, 404, { error: 'Not found.' })
}
