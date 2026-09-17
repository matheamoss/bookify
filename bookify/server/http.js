import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const staticRoot = resolve(process.env.STATIC_ROOT || 'dist')

export const send = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  })
  res.end(JSON.stringify(body))
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' }
export async function staticFile(req, res, pathname) {
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

