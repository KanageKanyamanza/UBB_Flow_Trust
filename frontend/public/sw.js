/**
 * UBBFlow Service Worker
 * Stratégies :
 *  - Cache-First  → assets statiques (JS, CSS, fonts, images)
 *  - Network-First → appels API (/auth, /accounts, etc.)
 *  - SWR (Stale-While-Revalidate) → pages HTML
 */

const CACHE_NAME = 'ubbflow-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching shell assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed (some assets may not exist yet):', err)
      })
    })
  )
  self.skipWaiting()
})

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Removing old cache:', key)
            return caches.delete(key)
          })
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // Skip API calls → Network-First
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets (JS/CSS/fonts/images) → Cache-First
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // HTML navigation → Stale-While-Revalidate
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Default → Network with cache fallback
  event.respondWith(networkWithCacheFallback(request))
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isApiRequest(url) {
  const apiPatterns = ['/auth/', '/accounts', '/transactions', '/analytics', '/documents',
    '/budgets', '/alerts', '/profile', '/trust', '/compliance', '/consent-grants',
    '/partner', '/public', '/export', '/recurring-rules', '/upload']
  return apiPatterns.some((p) => url.pathname.startsWith(p))
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|ico|gif)$/i.test(url.pathname)
}

/** Cache-First: serve from cache, fall back to network and cache result */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline — asset not cached', { status: 503 })
  }
}

/** Network-First: try network, fall back to cache if offline */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'Vous êtes hors ligne.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/** Stale-While-Revalidate: serve cached version immediately, update cache in background */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  const networkFetch = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => null)

  // Serve stale immediately if available, else wait for network
  return cached || networkFetch || new Response('Offline', { status: 503 })
}

/** Network with cache fallback for misc requests */
async function networkWithCacheFallback(request) {
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

// ─── Web Push ────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'UBBFlow', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'UBBFlow'
  const options = {
    body: data.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: data.url || '/' }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(self.clients.openWindow(url))
})
