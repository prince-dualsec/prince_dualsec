/**
 * Resolves the backend origin.
 *
 * Hard-coding localhost breaks the moment the site is opened from another
 * device: `localhost` there means that visitor's own machine, so every API call
 * fails. When no explicit VITE_BACKEND_URL is configured, derive the origin
 * from whatever host actually served the page and keep the backend port.
 */
const BACKEND_PORT = 3001

function resolveBackendUrl() {
  const configured = import.meta.env.VITE_BACKEND_URL
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1'

  // An explicit value wins, except when it points at localhost and the page is
  // being served to some other machine — that combination can never work.
  if (configured && !(/\/\/(localhost|127\.0\.0\.1)/.test(configured) && !isLocal)) {
    return configured.replace(/\/$/, '')
  }

  if (typeof window === 'undefined') return `http://localhost:${BACKEND_PORT}`

  return `${window.location.protocol}//${host}:${BACKEND_PORT}`
}

export const BACKEND_URL = resolveBackendUrl()
