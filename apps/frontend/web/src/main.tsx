import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

if (import.meta.env.DEV) {
  const originalInfo = console.info
  console.info = (...args: unknown[]) => {
    const firstArg = args[0]
    if (
      typeof firstArg === 'string' &&
      firstArg.includes('Download the React DevTools for a better development experience')
    ) {
      return
    }
    originalInfo(...args)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
    
  </StrictMode>,
)
