/**
 * Recent CVE disclosures from the NVD, shaped for the Live Threat Feed.
 *
 * Shared by three callers so they can never drift apart:
 *   - api/security/cve-feed.js  — the Vercel function used in production
 *   - server/index.js           — the Express server used in local development
 *   - src/services/security.js  — the browser, as a fallback when neither of
 *                                 the above is reachable (NVD allows CORS)
 *
 * Keep this file free of Node- and browser-only APIs.
 */

const NVD_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0'

export const FEED_WINDOW_DAYS = 3

const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }

// AbortSignal.timeout() is missing from Safari before 16, still common on
// older iPhones.
function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms)
  }
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

function shapeFeed(data) {
  const items = (data.vulnerabilities || []).map((v) => {
    const cve = v.cve
    const metric = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || cve.metrics?.cvssMetricV2?.[0]
    const score = metric?.cvssData?.baseScore ?? null
    return {
      id: cve.id,
      description: cve.descriptions?.find((d) => d.lang === 'en')?.value || '',
      score,
      severity: metric?.cvssData?.baseSeverity
        || (score === null ? 'UNSCORED' : score >= 9 ? 'CRITICAL' : score >= 7 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW'),
      published: cve.published || null,
      url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
    }
  })

  // Most severe first, then most recent.
  items.sort((a, b) =>
    (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0) ||
    new Date(b.published) - new Date(a.published)
  )

  const counts = items.reduce((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1
    return acc
  }, {})

  return {
    status: 'ok',
    source: 'NVD',
    windowDays: FEED_WINDOW_DAYS,
    totalInWindow: data.totalResults ?? items.length,
    counts,
    items: items.slice(0, 20),
  }
}

/**
 * Fetches and shapes the feed. Throws on any upstream failure; callers decide
 * whether to fall back to cached data.
 *
 * `apiKey` is optional. Without one NVD allows ~5 requests per 30 seconds per
 * IP, which is plenty behind a cache but not for a busy uncached server.
 */
export async function fetchNvdFeed({ apiKey, timeoutMs = 20000 } = {}) {
  const end = new Date()
  const start = new Date(end.getTime() - FEED_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const fmt = (d) => d.toISOString().replace('Z', '')

  const url = `${NVD_URL}?pubStartDate=${fmt(start)}&pubEndDate=${fmt(end)}&resultsPerPage=40`
  const response = await fetch(url, {
    headers: apiKey ? { apiKey } : undefined,
    signal: timeoutSignal(timeoutMs),
  })
  if (!response.ok) throw new Error(`NVD returned ${response.status}`)

  return shapeFeed(await response.json())
}
