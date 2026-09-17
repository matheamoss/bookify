import http from 'node:http'
import { api } from './api.js'
import { send, staticFile } from './http.js'

const port = Number(process.env.PORT || 3001)

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
