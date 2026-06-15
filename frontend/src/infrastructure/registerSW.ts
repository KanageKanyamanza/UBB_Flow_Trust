/**
 * Service Worker Registration
 * Registers the SW in production and development.
 * Logs update availability for easy debugging.
 */
export function registerSW(): void {
  if (!('serviceWorker' in navigator)) {
    console.info('[SW] Service Workers not supported in this browser.')
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.info('[SW] Registered successfully. Scope:', registration.scope)

        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update().catch(() => {})
        }, 30 * 60 * 1000)

        // Notify on new SW waiting to activate
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[SW] New version available. Reload to update.')
              // Optionally: dispatch a custom event for a "update available" banner
              window.dispatchEvent(new CustomEvent('sw:update-available'))
            }
          })
        })
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err)
      })
  })
}
