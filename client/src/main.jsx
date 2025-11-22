import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './app/App'
import { initSentry } from '@shared/utils/sentry'
// Validate environment variables (will throw in production if missing)
import '@shared/utils/validation/envValidation'

// Initialize Sentry before React renders
initSentry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
   
  </StrictMode>,
)
