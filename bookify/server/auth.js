import { randomBytes, createHash, scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'
import { db } from './db.js'
import { send } from './http.js'

const scrypt = promisify(scryptCallback)
export const cookieName = 'bookify_session'
const sessionAge = 30 * 24 * 60 * 60 * 1000
const secureCookie = process.env.COOKIE_SECURE === 'true'
const attempts = new Map()

export const tokenHash = token => createHash('sha256').update(token).digest('hex')
export const cookie = (value, maxAge) =>
  `${cookieName}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secureCookie ? '; Secure' : ''}`

export async function readJson(req) {
  let text = ''
  for await (const chunk of req) {
    text += chunk
    if (text.length > 1024 * 1024) throw new Error('Request is too large.')
  }
  try { return JSON.parse(text || '{}') } catch { throw new Error('Invalid JSON.') }
}

export function currentUser(req) {
  const raw = (req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null
  return db.prepare(`
    SELECT users.id, users.name, users.email, users.is_public FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash(raw), Date.now()) || null
}

export function sameOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true
  const allowedOrigins = (process.env.BOOKIFY_ALLOWED_ORIGIN || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  if (allowedOrigins.includes(origin)) return true
  try { return new URL(origin).host === req.headers.host } catch { return false }
}

export function limited(req, email) {
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

export async function passwordHash(password, salt) {
  return (await scrypt(password, salt, 64)).toString('hex')
}

export function makeSession(res, user) {
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(tokenHash(token), user.id, Date.now() + sessionAge)
  send(res, 200, { user: { id: user.id, name: user.name, email: user.email, is_public: user.is_public } }, { 'set-cookie': cookie(token, sessionAge / 1000) })
}
