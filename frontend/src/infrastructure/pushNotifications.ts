/**
 * Web Push notifications (VAPID)
 *
 * Mirrors the auth/baseURL conventions used by apiSlice.ts (frontend/src/infrastructure/api/apiSlice.ts):
 * same VITE_API_URL env var, same accessToken/partnerToken storage keys and quote-stripping logic.
 * This module is intentionally framework-agnostic (no Redux/RTK Query dependency) since it needs to be
 * callable outside of React components/hooks (e.g. on app bootstrap or from a settings toggle).
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getAuthToken(): string | null {
  let partnerToken = localStorage.getItem('partnerToken')
  let accessToken = localStorage.getItem('accessToken')

  if (partnerToken && partnerToken.startsWith('"') && partnerToken.endsWith('"')) {
    partnerToken = partnerToken.slice(1, -1)
  }
  if (accessToken && accessToken.startsWith('"') && accessToken.endsWith('"')) {
    accessToken = accessToken.slice(1, -1)
  }

  if (partnerToken && (!accessToken || window.location.pathname.startsWith('/partner'))) {
    return partnerToken
  }
  if (accessToken) {
    return accessToken
  }
  return null
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers.authorization = `Bearer ${token}`
  }
  return fetch(`${BASE_URL}${path}`, { ...options, headers })
}

/**
 * Converts a base64 (URL-safe) VAPID public key string into a Uint8Array,
 * as required by PushManager.subscribe's applicationServerKey option.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Requests notification permission, subscribes to push via the service worker,
 * and registers the subscription with the backend.
 * Returns true on success, false otherwise. Never throws.
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Push notifications are not supported in this browser.')
      return false
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.info('[Push] Notification permission not granted:', permission)
      return false
    }

    const registration = await navigator.serviceWorker.ready

    const vapidRes = await apiFetch('/push/vapid-public-key', { method: 'GET' })
    if (!vapidRes.ok) {
      console.warn('[Push] Failed to fetch VAPID public key:', vapidRes.status)
      return false
    }
    const vapidData = await vapidRes.json()
    const publicKey: string | undefined = vapidData?.publicKey ?? vapidData?.vapidPublicKey ?? vapidData?.key
    if (!publicKey) {
      console.warn('[Push] VAPID public key missing from response payload.')
      return false
    }

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })
    }

    const subscribeRes = await apiFetch('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription.toJSON()),
    })

    if (!subscribeRes.ok) {
      console.warn('[Push] Failed to register subscription with backend:', subscribeRes.status)
      return false
    }

    return true
  } catch (err) {
    console.warn('[Push] subscribeToPush failed:', err)
    return false
  }
}

/**
 * Unsubscribes the current push subscription (if any) and notifies the backend.
 * Never throws.
 */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      return
    }

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()

    await apiFetch('/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    })
  } catch (err) {
    console.warn('[Push] unsubscribeFromPush failed:', err)
  }
}

/**
 * Returns whether an active push subscription currently exists for this browser/SW.
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false
    }
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch (err) {
    console.warn('[Push] isPushSubscribed failed:', err)
    return false
  }
}
