/**
 * Resolves files that live in `public/`.
 *
 * Writing `/images/profile.png` straight into a component only works while the
 * site is served from the domain root. The Vite base is `./`, and the deploy
 * script publishes to GitHub Pages, where the site sits under a project path —
 * a leading slash there points at the user page, not at this build, and the
 * image silently 404s. Going through Vite's own BASE_URL keeps every reference
 * correct whatever the base is set to.
 */
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/*$/, '/')

export function assetUrl(path) {
  return `${BASE}${String(path).replace(/^\/+/, '')}`
}

/**
 * The same file as a fully qualified URL.
 *
 * A relative path is useless anywhere there is no document to resolve it
 * against — most notably the `about:srcdoc` iframe the CV is printed from.
 */
export function absoluteAssetUrl(path) {
  const relative = assetUrl(path)
  if (typeof window === 'undefined') return relative
  return new URL(relative, window.location.href).href
}
