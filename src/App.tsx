import { Activity, Orbit, PersonStanding, TrendingUp } from 'lucide-react'
import { Coach } from './components/Coach'
import { Logo } from './components/bits'
import { getIndicator, INDICATORS } from './lib/indicators'
import { useRoute } from './lib/router'
import { useStore } from './lib/store'
import { Body } from './screens/Body'
import { CheckIn } from './screens/CheckIn'
import { Detail } from './screens/Detail'
import { Mission } from './screens/Mission'
import { Today } from './screens/Today'
import { Trends } from './screens/Trends'
import type { IndicatorId } from './lib/types'

const NAV = [
  { id: 'today', label: 'Today', icon: Activity },
  { id: 'body', label: 'Body', icon: PersonStanding },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'mission', label: 'Mission', icon: Orbit },
]

export default function App() {
  const route = useRoute()
  const { mission, day } = useStore()
  const page = route[0] ?? 'today'
  const indicator = page === 'i' && INDICATORS.some((d) => d.id === route[1]) ? getIndicator(route[1] as IndicatorId) : null
  const active = page === 'i' || page === 'checkin' ? 'today' : page

  let screen = <Today />
  if (page === 'checkin') screen = <CheckIn />
  else if (page === 'body') screen = <Body />
  else if (page === 'trends') screen = <Trends />
  else if (page === 'mission') screen = <Mission />
  else if (indicator) screen = <Detail id={indicator.id} key={indicator.id} />

  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <a href="#/today" aria-label="Tether, today">
          <Logo />
        </a>
        <a className="mission-chip" href="#/mission">
          {mission.name} · {mission.dayLabel} {day}
        </a>
      </header>
      <nav className="nav" aria-label="Main">
        {NAV.map((n) => (
          <a key={n.id} href={`#/${n.id}`} aria-current={active === n.id ? 'page' : undefined}>
            <n.icon size={22} aria-hidden="true" strokeWidth={1.75} />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <main id="main" className="main">
        <div className="screen" key={route.join('/') || 'today'}>
          {screen}
        </div>
      </main>
      {page !== 'checkin' && <Coach />}
    </div>
  )
}
