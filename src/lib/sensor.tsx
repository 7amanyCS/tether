import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type SensorState = 'idle' | 'connecting' | 'live' | 'error'

interface Sensor {
  supported: boolean
  state: SensorState
  name: string | null
  simulated: boolean
  bpm: number | null
  error: string | null
  connect: () => Promise<void>
  simulate: (name?: string) => void
  disconnect: () => void
}

const Ctx = createContext<Sensor | null>(null)

/**
 * Heart-rate sensor link. Any wearable that broadcasts the standard
 * Bluetooth heart-rate service works: chest straps, most sport watches,
 * and bands with a heart-rate broadcast mode.
 */
export function SensorProvider({ children }: { children: ReactNode }) {
  const supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator
  const [state, setState] = useState<SensorState>('idle')
  const [name, setName] = useState<string | null>(null)
  const [simulated, setSimulated] = useState(false)
  const [bpm, setBpm] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const device = useRef<BluetoothDevice | null>(null)
  const timer = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
    device.current?.gatt?.disconnect()
    device.current = null
  }, [])

  const disconnect = useCallback(() => {
    stop()
    setState('idle')
    setName(null)
    setSimulated(false)
    setBpm(null)
    setError(null)
  }, [stop])

  const connect = useCallback(async () => {
    stop()
    setError(null)
    setSimulated(false)
    setState('connecting')
    try {
      const d = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      device.current = d
      d.addEventListener('gattserverdisconnected', () => {
        setState('error')
        setBpm(null)
        setError('The sensor disconnected. Bring it closer and connect again.')
      })
      const server = await d.gatt!.connect()
      const service = await server.getPrimaryService('heart_rate')
      const ch = await service.getCharacteristic('heart_rate_measurement')
      ch.addEventListener('characteristicvaluechanged', (e: Event) => {
        const dv = (e.target as BluetoothRemoteGATTCharacteristic).value
        if (!dv) return
        // Bit 0 of the flags byte says whether the rate is 8 or 16 bits wide.
        setBpm(dv.getUint8(0) & 1 ? dv.getUint16(1, true) : dv.getUint8(1))
      })
      await ch.startNotifications()
      setName(d.name || 'Heart-rate sensor')
      setState('live')
    } catch (err) {
      stop()
      const cancelled = err instanceof DOMException && err.name === 'NotFoundError'
      setState(cancelled ? 'idle' : 'error')
      setError(cancelled ? null : 'Could not connect. Check the sensor is on, worn, and broadcasting heart rate.')
    }
  }, [stop])

  const simulate = useCallback((label = 'Simulated sensor') => {
    stop()
    setError(null)
    setSimulated(true)
    setName(label)
    setState('live')
    let v = 63
    setBpm(v)
    timer.current = window.setInterval(() => {
      v = Math.min(67, Math.max(60, v + Math.round(Math.random() * 2 - 1)))
      setBpm(v)
    }, 1000)
  }, [stop])

  useEffect(() => stop, [stop])

  return (
    <Ctx.Provider value={{ supported, state, name, simulated, bpm, error, connect, simulate, disconnect }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSensor(): Sensor {
  const s = useContext(Ctx)
  if (!s) throw new Error('useSensor must be used inside SensorProvider')
  return s
}
