import { ArrowUp, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { askGround, buildContext, greeting, localAnswer, suggestions, type Msg } from '../lib/coach'
import { useStore } from '../lib/store'
import { LogoMark } from './bits'

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The assistant: a bar docked at the bottom that opens into a conversation. */
export function Coach() {
  const { assessment: a, plan, mission, day, today } = useStore()
  const state = useMemo(() => ({ a, plan, mission, day, checkedIn: today !== null }), [a, plan, mission, day, today])
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  // Once a call to the ground fails, stay on board until the panel is reopened.
  const [onboard, setOnboard] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const dock = useRef<HTMLButtonElement>(null)

  const tips = suggestions(state)
  const asked = new Set(msgs.filter((m) => m.role === 'user').map((m) => m.text))
  const left = tips.filter((t) => !asked.has(t))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    // On a phone, focusing would raise the keyboard over the suggestions.
    if (window.matchMedia('(min-width: 960px)').matches) input.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, busy])

  function close() {
    setOpen(false)
    dock.current?.focus()
  }

  async function send(raw: string) {
    const q = raw.trim()
    if (!q || busy) return
    const next: Msg[] = [...msgs, { role: 'user', text: q }]
    setMsgs(next)
    setText('')
    setBusy(true)
    const started = Date.now()
    let reply: Msg
    try {
      if (onboard) throw new Error('on board')
      reply = { role: 'coach', text: await askGround(next, buildContext(state)) }
    } catch {
      setOnboard(true)
      reply = { role: 'coach', text: localAnswer(q, state), onboard: true }
    }
    // Hold the typing dots long enough to register as a reply being written.
    await pause(Math.max(0, 650 - (Date.now() - started)))
    setMsgs((m) => [...m, reply])
    setBusy(false)
  }

  return (
    <>
      <button
        ref={dock}
        type="button"
        className="coach-dock"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOnboard(false)
          setOpen(true)
        }}
      >
        <LogoMark size={20} />
        <span className="coach-dock-text">
          <span>Ask Tether</span>
          <span className="coach-dock-tip">{tips[0]}</span>
        </span>
      </button>

      {open && (
        <div className="coach-layer">
          <div className="coach-scrim" onClick={close} />
          <div className="coach" role="dialog" aria-modal="true" aria-label="Ask Tether">
            <header className="coach-head">
              <LogoMark size={22} />
              <div>
                <h2>Tether</h2>
                <p>{onboard ? 'Answering from on-board rules' : `Reads your ${mission.dayLabel.toLowerCase()} ${a.day} data`}</p>
              </div>
              <button type="button" className="icon-btn" onClick={close} aria-label="Close">
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <div className="coach-body" ref={scroller} aria-live="polite">
              <p className="msg msg-coach">{greeting(state)}</p>
              {msgs.map((m, i) => (
                <p key={i} className={`msg msg-${m.role}`}>
                  {m.text}
                </p>
              ))}
              {busy && (
                <p className="msg msg-coach typing" aria-label="Tether is writing">
                  <span />
                  <span />
                  <span />
                </p>
              )}
              {!busy && left.length > 0 && (
                <ul className="chips" key={msgs.length}>
                  {left.map((t) => (
                    <li key={t}>
                      <button type="button" onClick={() => send(t)}>
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              className="coach-form"
              onSubmit={(e) => {
                e.preventDefault()
                send(text)
              }}
            >
              <label htmlFor="coach-input" className="sr-only">
                Your question
              </label>
              <input
                id="coach-input"
                ref={input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask about a reading"
                autoComplete="off"
                maxLength={400}
              />
              <button type="submit" className="send" disabled={!text.trim() || busy} aria-label="Send">
                <ArrowUp size={20} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
