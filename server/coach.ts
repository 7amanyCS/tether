/**
 * The assistant's link to Gemini. Runs on the server so the API key never
 * reaches the browser: in dev through the Vite middleware, in production
 * through the Cloudflare Pages function in functions/api/coach.ts.
 */

const SYSTEM = `You are Tether, the on-board health guide for one astronaut on a long space mission.
You are given CREW STATE: their readings, their personal baselines, the status of each reading, and the plan the on-board rules have already decided.

Rules:
- Use only the numbers, statuses and guidance in CREW STATE. Never invent a reading or a limit.
- You do not diagnose and you do not suggest medication. If asked for either, say what to measure next and who to ask.
- The plan in CREW STATE decides who must be told. Never soften it. If it says to contact the flight surgeon or tell the crew medical officer, say so.
- If the question is not about the astronaut's health, readings, or mission routine, say briefly that you only cover those.
- Plain text only. No markdown, no asterisks, no headings. At most 90 words.
- Lead with the answer. When giving steps, put each on its own line starting with its number.
- Speak calmly and directly, in the second person.`

interface Turn {
  role: 'user' | 'coach'
  text: string
}

export interface CoachResult {
  status: number
  json: { text?: string; error?: string }
}

function parse(body: unknown): { context: string; messages: Turn[] } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as { context?: unknown; messages?: unknown }
  if (typeof b.context !== 'string' || b.context.length > 6000) return null
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > 20) return null
  const messages: Turn[] = []
  for (const m of b.messages) {
    if (!m || typeof m !== 'object') return null
    const { role, text } = m as { role?: unknown; text?: unknown }
    if ((role !== 'user' && role !== 'coach') || typeof text !== 'string' || text.length > 1200) return null
    messages.push({ role, text })
  }
  if (messages[messages.length - 1].role !== 'user') return null
  return { context: b.context, messages }
}

export async function coachReply(body: unknown, key: string | undefined, model = 'gemini-3.5-flash-lite'): Promise<CoachResult> {
  if (!key) return { status: 503, json: { error: 'no_key' } }
  const input = parse(body)
  if (!input) return { status: 400, json: { error: 'bad_request' } }

  let res: Response
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${SYSTEM}\n\nCREW STATE\n${input.context}` }] },
        contents: input.messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
        generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
      }),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    return { status: 502, json: { error: 'unreachable' } }
  }
  if (!res.ok) return { status: 502, json: { error: `upstream_${res.status}` } }

  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .replace(/\*\*/g, '')
    .trim()
  if (!text) return { status: 502, json: { error: 'empty' } }
  return { status: 200, json: { text } }
}
