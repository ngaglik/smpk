import { defineConfig, loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { mkdir, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Menukar client credentials OAuth2 di sisi server (dev/preview) agar
 * `SATUSEHAT_CLIENT_SECRET` tidak pernah ikut ke bundle browser.
 */
function satusehatAuthPlugin(env: Record<string, string>): Plugin {
  const authUrl = env.VITE_SATUSEHAT_AUTH_URL ?? 'https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1'
  const clientId = env.VITE_SATUSEHAT_CLIENT_ID ?? ''
  const clientSecret = env.SATUSEHAT_CLIENT_SECRET ?? ''

  async function handler(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')

    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end(JSON.stringify({ error: 'method_not_allowed' }))
      return
    }

    if (!clientId || !clientSecret) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'missing_credentials', error_description: 'VITE_SATUSEHAT_CLIENT_ID dan SATUSEHAT_CLIENT_SECRET belum diisi di .env.local.' }))
      return
    }

    try {
      const response = await fetch(`${authUrl}/accesstoken?grant_type=client_credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret })
      })

      const payload = await response.text()
      res.statusCode = response.status
      res.end(payload)
    } catch (error) {
      res.statusCode = 502
      res.end(
        JSON.stringify({
          error: 'token_request_failed',
          error_description: error instanceof Error ? error.message : 'Tidak dapat menghubungi server SATUSEHAT.'
        })
      )
    }
  }

  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use('/api/satusehat/token', handler)
  }

  return {
    name: 'satusehat-auth',
    configureServer: attach,
    configurePreviewServer: attach
  }
}

/**
 * Proxy pengiriman resource FHIR ke SATUSEHAT. Token dikirim dari browser
 * lewat header Authorization dan diteruskan apa adanya; client secret tetap
 * hanya ada di sisi server.
 */
function satusehatFhirPlugin(env: Record<string, string>): Plugin {
  const baseUrl = (env.VITE_SATUSEHAT_BASE_URL ?? 'https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1').replace(/\/$/, '')
  const organizationId = env.VITE_SATUSEHAT_ORG_ID ?? ''

  async function handler(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')

    if (req.method !== 'POST' && req.method !== 'GET') {
      res.statusCode = 405
      res.end(JSON.stringify({ error: 'method_not_allowed' }))
      return
    }

    const authorization = req.headers.authorization
    if (!authorization || !authorization.startsWith('Bearer ')) {
      res.statusCode = 401
      res.end(JSON.stringify({ error: 'missing_token', error_description: 'Access token SATUSEHAT belum tersedia.' }))
      return
    }

    // Middleware dipasang di /api/satusehat/fhir, jadi req.url berisi sisa path
    // (mis. "/Patient" atau "/Encounter?identifier=..."). Tolak path yang
    // mencoba keluar dari base URL, tetapi pertahankan query string.
    const rawUrl = req.url ?? '/'
    const [subPath, query] = rawUrl.split('?')
    if (subPath.includes('..')) {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'invalid_path' }))
      return
    }

    let body: Buffer | undefined
    if (req.method === 'POST') {
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      body = Buffer.concat(chunks)
    }

    const target = `${baseUrl}${subPath === '/' || subPath === '' ? '' : subPath}${query ? `?${query}` : ''}`

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        Authorization: authorization,
        ...(organizationId ? { 'X-Organization-ID': organizationId } : {})
      }
      if (req.method === 'POST') headers['Content-Type'] = 'application/json'

      const response = await fetch(target, {
        method: req.method,
        headers,
        body,
        signal: AbortSignal.timeout(30000)
      })

      const text = await response.text()
      res.statusCode = response.status
      res.setHeader('Content-Type', response.headers.get('content-type') ?? 'application/json')
      res.end(text)
    } catch (error) {
      res.statusCode = 502
      res.end(
        JSON.stringify({
          resourceType: 'OperationOutcome',
          issue: [
            {
              severity: 'error',
              code: 'exception',
              diagnostics: error instanceof Error ? error.message : 'Gagal menghubungi SATUSEHAT.'
            }
          ]
        })
      )
    }
  }

  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use('/api/satusehat/fhir', handler)
  }

  return {
    name: 'satusehat-fhir',
    configureServer: attach,
    configurePreviewServer: attach
  }
}

/**
 * Menyimpan payload request & response ke folder `logs/` di root proyek.
 * Hanya endpoint lokal dev/preview; tidak tersedia pada build produksi statis.
 */
function satusehatLogPlugin(): Plugin {
  async function handler(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')

    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end(JSON.stringify({ error: 'method_not_allowed' }))
      return
    }

    try {
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }

      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as Record<string, unknown>
      const rawLabel = typeof payload.label === 'string' ? payload.label : ''
      const label = rawLabel.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40)
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `smpk-${stamp}${label ? `-${label}` : ''}.json`
      const directory = path.join(process.cwd(), 'logs')

      await mkdir(directory, { recursive: true })
      await writeFile(
        path.join(directory, filename),
        JSON.stringify(
          {
            savedAt: new Date().toISOString(),
            request: payload.request ?? null,
            response: payload.response ?? null
          },
          null,
          2
        ),
        'utf8'
      )

      res.statusCode = 201
      res.end(JSON.stringify({ file: `logs/${filename}` }))
    } catch (error) {
      res.statusCode = 500
      res.end(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Gagal menyimpan log.' })
      )
    }
  }

  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use('/api/satusehat/logs', handler)
  }

  return {
    name: 'satusehat-logs',
    configureServer: attach,
    configurePreviewServer: attach
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), satusehatAuthPlugin(env), satusehatFhirPlugin(env), satusehatLogPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})
