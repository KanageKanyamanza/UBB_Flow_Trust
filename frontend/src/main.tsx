import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { store } from './application/store'
import { ToastProvider } from './application/context/ToastContext'
import { registerSW } from './infrastructure/registerSW'
import './i18n/i18n'
import './index.css'

// Register Service Worker for offline caching
registerSW()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <div className="dark min-h-screen bg-background text-foreground">
          <ToastProvider>
            <App />
          </ToastProvider>
        </div>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>,
)
