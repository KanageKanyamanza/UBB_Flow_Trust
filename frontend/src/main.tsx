import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import { store } from './application/store'
import { AuthProvider } from './application/context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <div className="dark min-h-screen bg-background text-foreground">
          <App />
        </div>
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
)
