import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import { store } from './application/store'
import { AuthProvider } from './application/context/AuthContext'
import { ToastProvider } from './application/context/ToastContext'
import { registerSW } from './infrastructure/registerSW'
import './index.css'

// Register Service Worker for offline caching
registerSW()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <div className="dark min-h-screen bg-background text-foreground">
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </div>
    </Provider>
  </React.StrictMode>,
)
