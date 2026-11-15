import { coachReply } from '../../server/coach.ts'

interface Env {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
}

/** Cloudflare Pages function: POST /api/coach */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  // The key is paid for by this project, so only answer pages served from this site.
  const origin = request.headers.get('origin')
  if (!origin || new URL(origin).host !== new URL(request.url).host) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }
  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    // Falls through to a 400 from the handler.
  }
  const out = await coachReply(body, env.GEMINI_API_KEY, env.GEMINI_MODEL || undefined)
  return Response.json(out.json, { status: out.status })
}
