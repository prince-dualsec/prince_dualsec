/**
 * Build-time SEO wiring.
 *
 * Social scrapers (LinkedIn, WhatsApp, Facebook, X, Slack, Discord) do not run
 * JavaScript and do not resolve relative URLs. A single-page app therefore has
 * exactly one chance to describe itself: the static `<head>` of index.html,
 * with every URL absolute. That is what this plugin fills in.
 *
 * The site URL is discovered rather than hard-coded, because the deploy target
 * is not known when the code is written and a wrong URL fails silently — the
 * share card simply never appears. Resolution order:
 *
 *   1. VITE_SITE_URL                     — explicit override, always wins
 *   2. Vercel / Netlify build variables  — set automatically by the platform
 *   3. localhost                         — dev and local preview
 */

const FALLBACK = 'http://localhost:3000'

function resolveSiteUrl(env = process.env) {
  const candidates = [
    env.VITE_SITE_URL,
    // Vercel: the stable production domain, then the per-deployment host.
    // Both arrive without a scheme.
    env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`,
    env.VERCEL_URL && `https://${env.VERCEL_URL}`,
    // Netlify: URL is the canonical site address, DEPLOY_PRIME_URL the branch
    // or preview address.
    env.URL,
    env.DEPLOY_PRIME_URL,
  ]

  const found = candidates.find((value) => typeof value === 'string' && value.trim())
  // No trailing slash, so callers can join with a leading-slash path safely.
  return (found || FALLBACK).trim().replace(/\/+$/, '')
}

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Person structured data.
 *
 * This is what lets a search engine treat the site as "who Prince is" rather
 * than just a page containing his name, and it is what feeds knowledge-panel
 * style results. `sameAs` is the important part: it ties this site to the
 * GitHub and LinkedIn profiles as one identity.
 */
function buildJsonLd(siteUrl, site) {
  const person = {
    '@type': 'Person',
    '@id': `${siteUrl}/#person`,
    name: site.fullName,
    alternateName: [site.name, site.username],
    url: siteUrl,
    image: `${siteUrl}/og-image.png`,
    jobTitle: site.role,
    description: site.description,
    email: `mailto:${site.email}`,
    sameAs: [site.github, site.linkedin],
    knowsAbout: [
      'Cybersecurity',
      'Penetration Testing',
      'Web Application Security',
      'OSINT',
      'Ethical Hacking',
      'Bug Bounty Hunting',
      'Network Security',
      'Incident Response',
      'Digital Forensics',
    ],
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: `${site.fullName} — ${site.role}`,
    description: site.description,
    inLanguage: 'en',
    publisher: { '@id': `${siteUrl}/#person` },
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [person, website] })
}

function buildHeadTags(siteUrl, site) {
  const title = `${site.fullName} | ${site.role}`
  const image = `${siteUrl}/og-image.png`

  return [
    `<link rel="canonical" href="${esc(siteUrl)}/" />`,
    '',
    '<!-- Open Graph: the share card on LinkedIn, WhatsApp, Facebook, Slack, Discord -->',
    `<meta property="og:url" content="${esc(siteUrl)}/" />`,
    `<meta property="og:site_name" content="${esc(site.fullName)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    '<meta property="og:image:secure_url" content="' + esc(image) + '" />',
    '<meta property="og:image:type" content="image/png" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(title)}" />`,
    '<meta property="og:locale" content="en_US" />',
    `<meta property="profile:username" content="${esc(site.username)}" />`,
    '',
    '<!-- X / Twitter -->',
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(title)}" />`,
    '',
    '<!-- Structured data -->',
    `<script type="application/ld+json">${buildJsonLd(siteUrl, site)}</script>`,
  ].join('\n    ')
}

export default function seoPlugin(site) {
  let siteUrl = FALLBACK

  return {
    name: 'portfolio-seo',

    configResolved(config) {
      // Vite's own loaded env first (covers .env files), then the platform's
      // build environment, which Vite does not load.
      siteUrl = resolveSiteUrl({ ...process.env, ...config.env })
      config.logger.info(`\n  portfolio-seo  canonical site URL: ${siteUrl}`)
    },

    transformIndexHtml(html) {
      return html
        .replace('<!--%SEO%-->', buildHeadTags(siteUrl, site))
        .replace(/%SITE_URL%/g, siteUrl)
    },

    // robots.txt and sitemap.xml have to carry the absolute URL too, so they
    // are generated here rather than sitting as fixed files in public/.
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: [
          'User-agent: *',
          'Allow: /',
          '',
          `Sitemap: ${siteUrl}/sitemap.xml`,
          '',
        ].join('\n'),
      })

      // The app uses a HashRouter, so every section lives under the one real
      // URL. Listing invented paths here would just feed crawlers 404s.
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          '  <url>',
          `    <loc>${siteUrl}/</loc>`,
          `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>`,
          '    <changefreq>monthly</changefreq>',
          '    <priority>1.0</priority>',
          '  </url>',
          '</urlset>',
          '',
        ].join('\n'),
      })
    },
  }
}
