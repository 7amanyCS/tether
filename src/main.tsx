import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import './styles.css'
import App from './App'
import { SensorProvider } from './lib/sensor'
import { StoreProvider } from './lib/store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <SensorProvider>
        <App />
      </SensorProvider>
    </StoreProvider>
  </StrictMode>,
)
