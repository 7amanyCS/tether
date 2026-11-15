import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { coachReply } from './server/coach.ts'

/** Serves POST /api/coach locally, the same handler Cloudflare runs in production. */
function coachApi(env: Record<string, string>): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end()
      return
    }
    let raw = ''
    for await (const chunk of req) raw += chunk
    let body: unknown = null
    try {
      body = JSON.parse(raw)
    } catch {
      // Falls through to a 400 from the handler.
    }
    const out = await coachReply(body, env.GEMINI_API_KEY, env.GEMINI_MODEL || undefined)
    res.statusCode = out.status
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(out.json))
  }
  return {
    name: 'tether-coach-api',
    configureServer: (server) => void server.middlewares.use('/api/coach', handle),
    configurePreviewServer: (server) => void server.middlewares.use('/api/coach', handle),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), coachApi(loadEnv(mode, process.cwd(), ''))],
}))
