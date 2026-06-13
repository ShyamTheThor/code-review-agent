import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Toaster 
        position="top-right" 
        expand={false} 
        richColors 
        theme="dark"
        toastOptions={{
          style: {
            background: '#09090b',
            border: '1px solid #27272a',
            color: '#fafafa',
          },
        }}
      />
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
