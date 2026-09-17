import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { dirname, extname, resolve, sep } from 'node:path'
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { DatabaseSync } from 'node:sqlite'

const scrypt = promisify(scryptCallback)
const port = Number(process.env.PORT || 3001)
const dbPath = process.env.DB_PATH || resolve('data/bookify.sqlite')
const staticRoot = resolve(process.env.STATIC_ROOT || 'dist')
const cookieName = 'bookify_session'
const sessionAge = 30 * 24 * 60 * 60 * 1000
const secureCookie = process.env.COOKIE_SECURE === 'true'
const attempts = new Map()

mkdirSync(dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS libraries (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`)

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  })
  res.end(JSON.stringify(body))
}

const tokenHash = token => createHash('sha256').update(token).digest('hex')
const cookie = (value, maxAge) =>
  `${cookieName}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secureCookie ? '; Secure' : ''}`

async function readJson(req) {
  let text = ''
  for await (const chunk of req) {
    text += chunk
    if (text.length > 1024 * 1024) throw new Error('Request is too large.')
  }
  try { return JSON.parse(text || '{}') } catch { throw new Error('Invalid JSON.') }
}

function currentUser(req) {
  const raw = (req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null
  return db.prepare(`
    SELECT users.id, users.name, users.email FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash(raw), Date.now()) || null
}

function sameOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true
  if (process.env.BOOKIFY_ALLOWED_ORIGIN && origin === process.env.BOOKIFY_ALLOWED_ORIGIN) return true
  try { return new URL(origin).host === req.headers.host } catch { return false }
}

function limited(req, email) {
  const key = `${req.socket.remoteAddress}:${email}`
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.until < now) {
    attempts.set(key, { count: 1, until: now + 15 * 60_000 })
    return false
  }
  entry.count += 1
  return entry.count > 8
}

async function passwordHash(password, salt) {
  return (await scrypt(password, salt, 64)).toString('hex')
}

function makeSession(res, user) {
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(tokenHash(token), user.id, Date.now() + sessionAge)
  send(res, 200, { user: { id: user.id, name: user.name, email: user.email } }, { 'set-cookie': cookie(token, sessionAge / 1000) })
}

function validateLibrary(value) {
  if (!value || !Array.isArray(value.lists) || !Array.isArray(value.catalog) || !value.ratings || typeof value.ratings !== 'object') return false
  if (value.lists.length > 200 || value.catalog.length > 3000 || Object.keys(value.ratings).length > 3000) return false
  return value.lists.every(list => (typeof list.id === 'number' || typeof list.id === 'string') &&
    typeof list.name === 'string' && list.name.length <= 120 && Array.isArray(list.books) && list.books.length <= 3000) &&
    value.catalog.every(book => book && (typeof book.id === 'string' || typeof book.id === 'number') &&
      typeof book.title === 'string' && book.title.length <= 300 && typeof book.author === 'string' && book.author.length <= 300)
}

async function api(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { ok: true })
  if (!['GET', 'HEAD'].includes(req.method) && !sameOrigin(req)) return send(res, 403, { error: 'Request origin is not allowed.' })

  if (req.method === 'POST' && pathname === '/api/register') {
    const { name, email, password } = await readJson(req)
    const cleanName = String(name || '').trim()
    const cleanEmail = String(email || '').trim().toLowerCase()
    if (cleanName.length < 2 || cleanName.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      typeof password !== 'string' || password.length < 12 || password.length > 200) {
      return send(res, 400, { error: 'Enter a name, valid email and password of at least 12 characters.' })
    }
    if (limited(req, cleanEmail)) return send(res, 429, { error: 'Too many attempts. Try again later.' })
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)) return send(res, 409, { error: 'An account with this email already exists.' })
    const user = { id: randomBytes(16).toString('hex'), name: cleanName, email: cleanEmail }
    const salt = randomBytes(16).toString('hex')
    const hash = await passwordHash(password, salt)
    db.prepare('INSERT INTO users (id, name, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(user.id, user.name, user.email, hash, salt, Date.now())
    return makeSession(res, user)
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    const { email, password } = await readJson(req)
    const cleanEmail = String(email || '').trim().toLowerCase()
    if (limited(req, cleanEmail)) return send(res, 429, { error: 'Too many attempts. Try again later.' })
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail)
    const hash = await passwordHash(String(password || ''), user?.salt || 'invalid-user')
    if (!user || !timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.password_hash, 'hex')))
      return send(res, 401, { error: 'Incorrect email or password.' })
    return makeSession(res, user)
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

  if (req.method === 'GET' && pathname === '/api/library') {
    const row = db.prepare('SELECT payload FROM libraries WHERE user_id = ?').get(user.id)
    return send(res, 200, { library: row ? JSON.parse(row.payload) : null })
  }
  if (req.method === 'PUT' && pathname === '/api/library') {
    const library = await readJson(req)
    if (!validateLibrary(library)) return send(res, 400, { error: 'Invalid library data.' })
    db.prepare(`
      INSERT INTO libraries (user_id, payload, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
    `).run(user.id, JSON.stringify({ lists: library.lists, ratings: library.ratings, catalog: library.catalog }), Date.now())
    return send(res, 200, { ok: true })
  }
  return send(res, 404, { error: 'Not found.' })
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' }
async function staticFile(req, res, pathname) {
  const file = resolve(staticRoot, `.${pathname}`)
  if (file !== staticRoot && !file.startsWith(staticRoot + sep)) return send(res, 403, { error: 'Forbidden.' })
  let target = file
  try {
    if (!(await stat(file)).isFile()) target = resolve(staticRoot, 'index.html')
  } catch { target = resolve(staticRoot, 'index.html') }
  try {
    const body = await readFile(target)
    res.writeHead(200, { 'content-type': mime[extname(target)] || 'application/octet-stream', 'x-content-type-options': 'nosniff' })
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch { send(res, 404, { error: 'Not found.' }) }
}

http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname
    if (pathname.startsWith('/api/')) return await api(req, res, pathname)
    if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { error: 'Method not allowed.' })
    return await staticFile(req, res, pathname)
  } catch (error) {
    send(res, error.message === 'Request is too large.' ? 413 : 400, { error: error.message === 'Request is too large.' ? error.message : 'Invalid request.' })
  }
}).listen(port, '0.0.0.0', () => console.log(`Bookify is listening on port ${port}`))
