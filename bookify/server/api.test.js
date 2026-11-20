import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'

// Starts the real server on a free port with a throwaway database.
async function startServer(env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'bookify-test-'))
  const port = 20000 + Math.floor(Math.random() * 20000)
  const child = spawn(process.execPath, ['server/index.js'], {
    env: {
      PATH: process.env.PATH,
      NODE_ENV: 'test',
      DB_PATH: join(dir, 'test.sqlite'),
      BOOKIFY_PORT: String(port),
      BOOKIFY_LISTEN_HOST: '127.0.0.1',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  await new Promise((resolve, reject) => {
    child.stdout.on('data', chunk => { if (String(chunk).includes('listening')) resolve() })
    child.on('exit', code => reject(new Error(`Server exited with code ${code}`)))
  })
  return {
    base: `http://127.0.0.1:${port}/api`,
    stop() {
      child.kill()
      rmSync(dir, { recursive: true, force: true })
    },
  }
}

// A tiny client that keeps its own session cookie, like one browser.
function client(base) {
  let cookie = ''
  return async (method, path, body, headers = {}) => {
    const response = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', cookie, ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) cookie = setCookie.split(';')[0]
    return { status: response.status, body: await response.json().catch(() => null) }
  }
}

let counter = 0
async function registeredUser(base, extra = {}) {
  const call = client(base)
  const email = `reader${++counter}@example.com`
  const password = 'correct horse battery'
  const { status, body } = await call('POST', '/register', { name: `Reader ${counter}`, email, password, ...extra })
  assert.equal(status, 200)
  return { call, user: body.user, email, password }
}

const emptyLibrary = { lists: [], catalog: [], ratings: {} }

describe('with email features turned off (default)', () => {
  let server
  before(async () => { server = await startServer() })
  after(() => server.stop())

  test('reports email as disabled and hides email routes', async () => {
    const call = client(server.base)
    assert.deepEqual((await call('GET', '/config')).body, { emailEnabled: false })
    assert.equal((await call('POST', '/forgot-password', { email: 'a@example.com' })).status, 404)
    assert.equal((await call('POST', '/verify-email', { token: 'x' })).status, 404)
  })

  test('registering signs the reader in immediately', async () => {
    const { call, user } = await registeredUser(server.base)
    assert.equal((await call('GET', '/me')).body.user.id, user.id)
  })

  test('rejects duplicate accounts and wrong passwords', async () => {
    const { email, password } = await registeredUser(server.base)
    const call = client(server.base)
    assert.equal((await call('POST', '/register', { name: 'Again', email, password })).status, 409)
    assert.equal((await call('POST', '/login', { email, password: 'wrong password!' })).status, 401)
    assert.equal((await call('POST', '/login', { email, password })).status, 200)
  })

  test('successful sign-ins do not use up the rate limit', async () => {
    const { email, password } = await registeredUser(server.base)
    for (let attempt = 0; attempt < 12; attempt++) {
      assert.equal((await client(server.base)('POST', '/login', { email, password })).status, 200)
    }
  })

  test('guests can browse public profiles but not private ones or member routes', async () => {
    const visible = await registeredUser(server.base)
    const hidden = await registeredUser(server.base, { publicProfile: false })
    const guest = client(server.base)
    const people = (await guest('GET', '/people')).body.people.map(person => person.id)
    assert.ok(people.includes(visible.user.id))
    assert.ok(!people.includes(hidden.user.id))
    const profile = await guest('GET', `/people/${visible.user.id}`)
    assert.equal(profile.status, 200)
    assert.equal(profile.body.person.isFollowing, false)
    assert.equal((await guest('GET', `/people/${hidden.user.id}`)).status, 404)
    assert.equal((await guest('GET', '/library')).status, 401)
    assert.equal((await guest('POST', `/people/${visible.user.id}/follow`)).status, 401)
  })

  test('rejects writes from other origins', async () => {
    const { call } = await registeredUser(server.base)
    const result = await call('PUT', '/profile/visibility', { isPublic: false }, { origin: 'https://evil.example' })
    assert.equal(result.status, 403)
  })

  test('library saves are versioned so a stale tab cannot overwrite newer data', async () => {
    const { call } = await registeredUser(server.base)
    const { version } = (await call('GET', '/library')).body
    const first = await call('PUT', '/library', { ...emptyLibrary, baseVersion: version })
    assert.equal(first.status, 200)
    assert.equal((await call('PUT', '/library', { ...emptyLibrary, baseVersion: version })).status, 409)
    assert.equal((await call('PUT', '/library', { ...emptyLibrary, baseVersion: first.body.version })).status, 200)
  })

  test('library data shown to other readers is sanitized', async () => {
    const author = await registeredUser(server.base)
    await author.call('PUT', '/library', {
      lists: [{ id: 1, name: 'Mine', books: ['/works/OL1W', { bad: true }] }],
      ratings: { '/works/OL1W': 1e9, '/works/OL2W': 4 },
      catalog: [
        { id: '/works/OL1W', title: 'One', author: 'A', color: 'url(https://tracker.example/p)', workKey: '@evil.example/x', coverId: 'x' },
        { id: '/works/OL2W', title: 'Two', author: 'B', color: '#123456', workKey: '/works/OL2W', coverId: 42 },
      ],
    })
    const { library } = (await client(server.base)('GET', `/people/${author.user.id}`)).body
    assert.deepEqual(library.ratings, { '/works/OL2W': 4 })
    assert.deepEqual(library.lists[0].books, ['/works/OL1W'])
    assert.deepEqual(library.catalog[0], { id: '/works/OL1W', title: 'One', author: 'A' })
    assert.equal(library.catalog[1].workKey, '/works/OL2W')
  })

  test('changing the password signs out other devices', async () => {
    const reader = await registeredUser(server.base)
    const otherDevice = client(server.base)
    await otherDevice('POST', '/login', { email: reader.email, password: reader.password })
    assert.equal((await reader.call('PUT', '/password', { currentPassword: 'nope', newPassword: 'a brand new password' })).status, 401)
    assert.equal((await reader.call('PUT', '/password', { currentPassword: reader.password, newPassword: 'a brand new password' })).status, 200)
    assert.equal((await otherDevice('GET', '/me')).body.user, null)
    assert.ok((await reader.call('GET', '/me')).body.user)
  })

  test('deleting an account removes it and its follows', async () => {
    const reader = await registeredUser(server.base)
    const followed = await registeredUser(server.base)
    await reader.call('POST', `/people/${followed.user.id}/follow`)
    assert.equal((await reader.call('DELETE', '/account', { password: 'nope' })).status, 401)
    assert.equal((await reader.call('DELETE', '/account', { password: reader.password })).status, 200)
    assert.equal((await reader.call('GET', '/me')).body.user, null)
    assert.equal((await client(server.base)('POST', '/login', { email: reader.email, password: reader.password })).status, 401)
    assert.equal((await client(server.base)('GET', `/people/${followed.user.id}`)).body.person.followers, 0)
  })
})

describe('with email features turned on but no SMTP server', () => {
  let server
  before(async () => { server = await startServer({ BOOKIFY_EMAIL_ENABLED: 'true' }) })
  after(() => server.stop())

  test('a failed confirmation email does not leave a half-created account', async () => {
    const call = client(server.base)
    const details = { name: 'Mail Reader', email: 'mail@example.com', password: 'correct horse battery' }
    assert.equal((await call('POST', '/register', details)).status, 503)
    assert.equal((await call('POST', '/register', details)).status, 503)
    assert.equal((await call('POST', '/login', details)).status, 401)
  })
})
