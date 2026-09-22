/**
 * Resolves the backend origin.
 *
 * - An explicit VITE_BACKEND_URL wins (e.g. a backend hosted elsewhere).
 * - A production build otherwise talks to its own origin: on Vercel the /api
 *   routes are serverless functions deployed alongside the site
 *   (see api/). The old default of "<host>:3001" pointed every visitor at a
 *   port that does not exist on Vercel, so those calls always failed.
 * - In development, derive the origin from whatever host served the page and
 *   use the Express server's port. Hard-coding localhost would break the
 *   moment the dev site is opened from a phone on the same network.
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

  // Same origin: requests go to /api/... on the site itself.
  if (import.meta.env.PROD) return ''

  if (typeof window === 'undefined') return `http://localhost:${BACKEND_PORT}`

  return `${window.location.protocol}//${host}:${BACKEND_PORT}`
}

export const BACKEND_URL = resolveBackendUrl()
