/**
 * Builds a standalone, print-ready HTML document for the CV.
 *
 * This exists because printing the live modal never produced a clean PDF: the
 * page behind it still occupies layout space (visibility:hidden does not remove
 * boxes), the dark theme leaks through, and the on-screen monospace display
 * type reads as amateur on paper. Rendering a separate document instead gives
 * full control over page size, typography and pagination.
 */

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const STATUS_LABEL = {
  'in-progress': 'In progress',
  planned: 'Planned',
  completed: 'Earned',
}

// System stacks only: a print job must not wait on a webfont that may never
// arrive, and these render predictably in every PDF engine.
const SANS = "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
const MONO = "'Cascadia Mono', Consolas, 'SF Mono', Menlo, monospace"

// Wide enough that the 28mm-tall portrait still looks sharp at print
// resolution, small enough that the inlined copy stays well under a megabyte.
const PHOTO_WIDTH = 620

/**
 * Reads the portrait and returns it as a self-contained data URI.
 *
 * The print document is an `about:srcdoc` iframe, which has no meaningful base
 * URL of its own, so a relative `src` resolves inconsistently between engines
 * and the portrait came out blank in the saved PDF. Even with an absolute URL
 * the print snapshot can be taken before the fetch finishes. Inlining the bytes
 * removes the fetch entirely, so the image is simply part of the document.
 *
 * Returns null if the image cannot be read; the caller renders without it
 * rather than failing the whole export.
 */
export function loadPhotoDataUrl(src) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !src) return resolve(null)

    const img = new Image()
    // Same-origin in practice, but set explicitly so the canvas is never
    // tainted if the portrait is ever moved to a CDN.
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const scale = Math.min(1, PHOTO_WIDTH / img.naturalWidth)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.naturalWidth * scale)
        canvas.height = Math.round(img.naturalHeight * scale)

        const ctx = canvas.getContext('2d')
        // The source PNG has no transparency; a white matte keeps JPEG from
        // filling any stray alpha with black.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        resolve(canvas.toDataURL('image/jpeg', 0.92))
      } catch {
        resolve(null)
      }
    }

    img.onerror = () => resolve(null)
    img.src = src
  })
}

export function buildCVHtml({ name, site, skills, tools, projects, earned, pending, journey, photo, docTitle }) {
  const contacts = [
    ['Email', site.email, `mailto:${site.email}`],
    ['Phone', site.phone, `tel:${site.phone}`],
    site.phone2 ? ['Alternate', site.phone2, `tel:${site.phone2}`] : null,
    ['GitHub', site.github.replace(/^https?:\/\//, ''), site.github],
    ['LinkedIn', site.linkedin.replace(/^https?:\/\//, ''), site.linkedin],
  ].filter(Boolean)

  const contactHtml = contacts
    .map(
      ([label, value, href]) => `
        <div class="contact">
          <span class="contact-label">${esc(label)}</span>
          <a class="contact-value" href="${esc(href)}">${esc(value)}</a>
        </div>`
    )
    .join('')

  const skillsHtml = Object.values(skills)
    .map(
      (cat) => `
      <div class="skill-group">
        <h4>${esc(cat.title)}</h4>
        <ul class="skill-list">
          ${cat.skills
            .map(
              (s) => `<li><span>${esc(s.name)}</span><span class="pct">${esc(s.level)}%</span></li>`
            )
            .join('')}
        </ul>
      </div>`
    )
    .join('')

  const projectsHtml = projects
    .map(
      (p) => `
      <article class="entry">
        <div class="entry-head">
          <h4>${esc(p.title)}</h4>
          <span class="tag ${p.status === 'completed' ? 'tag-done' : 'tag-wip'}">
            ${p.status === 'completed' ? 'Completed' : 'In progress'}
          </span>
        </div>
        <p class="entry-body">${esc(p.description)}</p>
        <p class="entry-meta">${esc(p.technologies.join(' · '))}</p>
      </article>`
    )
    .join('')

  const credential = (a) => {
    // A placeholder id such as SY0-XXX-XXX would read as a genuine one.
    const showId = a.credentialId && !/X{2,}/i.test(a.credentialId)
    return `
      <article class="entry">
        <div class="entry-head">
          <h4>${esc(a.title)}</h4>
          <span class="tag">${esc(STATUS_LABEL[a.status] || a.status)}</span>
        </div>
        <p class="entry-meta">${esc(a.issuer)}${showId ? ` · ID ${esc(a.credentialId)}` : ''}</p>
        <p class="entry-body">${esc(a.description)}</p>
      </article>`
  }

  const journeyHtml = journey
    .map(
      (j) => `
      <article class="entry timeline">
        <span class="year">${esc(j.year)}</span>
        <div>
          <h4>${esc(j.title)}</h4>
          <p class="entry-body">${esc(j.description)}</p>
        </div>
      </article>`
    )
    .join('')

  const section = (title, body) =>
    body ? `<section class="section"><h3>${esc(title)}</h3>${body}</section>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<!-- Browsers seed the "Save as PDF" filename from the document title, so this
     is what the visitor ends up with on disk. -->
<title>${esc(docTitle || `${site.name} - CV`)}</title>
<style>
  @page { size: A4; margin: 16mm 15mm; }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #1a1a1a;
    font-family: ${SANS};
    font-size: 10.5pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  a { color: #0b5fa5; text-decoration: none; }

  /* ── Masthead ─────────────────────────────── */
  .masthead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16pt;
    border-bottom: 2pt solid #0b5fa5;
    padding-bottom: 10pt;
    margin-bottom: 14pt;
  }
  .ident { display: flex; align-items: flex-start; gap: 10pt; }
  .mark { width: 34pt; height: 34pt; flex-shrink: 0; }
  .name { font-size: 24pt; font-weight: 700; letter-spacing: -0.4pt; margin: 0; color: #0d1117; }
  .handle { font-family: ${MONO}; font-size: 10pt; color: #0b5fa5; margin: 2pt 0 0; }
  .role { font-size: 11pt; color: #444; margin: 4pt 0 0; }
  .head-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6pt;
    flex-shrink: 0;
  }
  .photo {
    width: 28mm;
    height: 35mm;
    object-fit: cover;
    object-position: center top;
    border-radius: 3pt;
    border: 0.5pt solid #c9d6e3;
  }
  .prepared {
    text-align: right;
    font-size: 8.5pt;
    color: #666;
    white-space: nowrap;
  }

  /* ── Contact strip ────────────────────────── */
  .contacts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 3pt 18pt;
    margin-bottom: 14pt;
  }
  .contact { display: flex; gap: 6pt; font-size: 9.5pt; align-items: baseline; }
  .contact-label {
    color: #777;
    text-transform: uppercase;
    letter-spacing: 0.4pt;
    font-size: 7.5pt;
    min-width: 46pt;
  }
  .contact-value { font-family: ${MONO}; font-size: 9pt; word-break: break-word; }

  /* ── Sections ─────────────────────────────── */
  .section { margin-bottom: 13pt; }
  .section h3 {
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 1.1pt;
    color: #0b5fa5;
    border-bottom: 0.7pt solid #c9d6e3;
    padding-bottom: 3pt;
    margin: 0 0 7pt;
    /* Never leave a heading stranded at the foot of a page. */
    break-after: avoid;
    page-break-after: avoid;
  }

  .summary { margin: 0; text-align: justify; }

  /* ── Skills ───────────────────────────────── */
  .skills { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt 22pt; }
  .skill-group { break-inside: avoid; page-break-inside: avoid; }
  .skill-group h4 {
    font-size: 9.5pt;
    margin: 0 0 3pt;
    color: #0d1117;
  }
  .skill-list { list-style: none; margin: 0; padding: 0; }
  .skill-list li {
    display: flex;
    justify-content: space-between;
    gap: 8pt;
    font-size: 9pt;
    padding: 0.8pt 0;
    border-bottom: 0.4pt dotted #dfe5ec;
  }
  .pct { font-family: ${MONO}; color: #777; font-size: 8.5pt; }

  /* ── Tools ────────────────────────────────── */
  .tools { font-family: ${MONO}; font-size: 9pt; color: #333; margin: 0; line-height: 1.7; }

  /* ── Entries ──────────────────────────────── */
  .entry {
    margin-bottom: 7pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .entry-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8pt; }
  .entry h4 { font-size: 10pt; margin: 0; color: #0d1117; }
  .entry-body { margin: 1.5pt 0 0; font-size: 9.5pt; color: #444; }
  .entry-meta { margin: 1.5pt 0 0; font-size: 8.5pt; color: #777; font-family: ${MONO}; }

  .tag {
    font-size: 7.5pt;
    letter-spacing: 0.3pt;
    padding: 1pt 5pt;
    border: 0.6pt solid #c9d6e3;
    border-radius: 8pt;
    color: #555;
    white-space: nowrap;
  }
  .tag-done { border-color: #9ccfae; color: #1d6b39; }
  .tag-wip { border-color: #e5c391; color: #8a5a10; }

  .timeline { display: flex; gap: 9pt; align-items: flex-start; }
  .year {
    font-family: ${MONO};
    font-size: 8.5pt;
    color: #0b5fa5;
    border: 0.6pt solid #c9d6e3;
    border-radius: 3pt;
    padding: 1pt 4pt;
    min-width: 34pt;
    text-align: center;
    flex-shrink: 0;
  }

  .note { font-size: 8.5pt; color: #777; margin: -3pt 0 6pt; font-style: italic; }

  /* ── Footer ───────────────────────────────── */
  .foot {
    margin-top: 14pt;
    padding-top: 7pt;
    border-top: 0.7pt solid #dfe5ec;
    font-size: 8pt;
    color: #888;
    text-align: center;
    font-family: ${MONO};
  }
</style>
</head>
<body>
  <header class="masthead">
    <div class="ident">
      <svg class="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 2.2 L27.5 6.4 V15.4 L16 29.8 L4.5 15.4 V6.4 Z"
              fill="#0b5fa5" fill-opacity="0.10" stroke="#0b5fa5"
              stroke-width="2" stroke-linejoin="round"/>
        <path d="M12.2 8.4 H17.6 C20.6 8.4 22.5 10.1 22.5 12.6 C22.5 15.1 20.6 16.8 17.6 16.8 H15.4 V21.8 H12.2 Z M15.4 11.1 H17.3 C18.3 11.1 19.0 11.7 19.0 12.6 C19.0 13.5 18.3 14.1 17.3 14.1 H15.4 Z"
              fill="#0b5fa5" fill-rule="evenodd"/>
      </svg>
    <div>
      <h1 class="name">${esc(site.name)}</h1>
      <p class="handle">${esc(site.username)}</p>
      <p class="role">${esc(site.role)}</p>
    </div>
    </div>
    <div class="head-right">
      ${photo ? `<img class="photo" src="${photo}" alt="${esc(site.name)}">` : ''}
      <div class="prepared">
        Prepared for<br><strong>${esc(name)}</strong><br>
        ${esc(new Date().toLocaleDateString())}
      </div>
    </div>
  </header>

  <div class="contacts">${contactHtml}</div>

  ${section('Profile', `<p class="summary">${esc(site.description)}</p>`)}
  ${section('Core Skills', `<div class="skills">${skillsHtml}</div>`)}
  ${section('Tools & Technologies', `<p class="tools">${esc(tools.map((t) => t.name).join('  ·  '))}</p>`)}
  ${section('Key Projects', projectsHtml)}
  ${earned.length ? section('Certifications', earned.map(credential).join('')) : ''}
  ${
    pending.length
      ? section(
          'Certifications — In Progress & Planned',
          `<p class="note">Listed for transparency; these are not yet held.</p>${pending
            .map(credential)
            .join('')}`
        )
      : ''
  }
  ${section('Professional Journey', journeyHtml)}

  <div class="foot">
    ${esc(site.email)} &nbsp;·&nbsp; ${esc(site.github.replace(/^https?:\/\//, ''))}
  </div>
</body>
</html>`
}

/**
 * Resolves once the print document has everything it needs to paginate.
 *
 * `iframe.onload` is not that moment: a frame can report itself loaded while an
 * image is still decoding or a font is still swapping, and whatever is missing
 * at that instant is missing from the PDF. The race cap stops one stuck asset
 * from holding the print dialog shut for ever.
 */
function whenFrameReady(win, timeoutMs = 4000) {
  const doc = win.document

  const images = Array.from(doc.images).map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise((done) => {
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
        })
  )

  const fonts = doc.fonts ? doc.fonts.ready.catch(() => {}) : Promise.resolve()

  return Promise.race([
    Promise.all([...images, fonts]),
    new Promise((done) => win.setTimeout(done, timeoutMs)),
  ])
}

/**
 * Prints the CV through a hidden iframe.
 *
 * An iframe rather than window.open, because popup blockers silently kill the
 * latter and there is no reliable way to detect it.
 */
export function printCVDocument(html) {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.setAttribute('tabindex', '-1')
    // Must stay rendered: display:none or visibility:hidden stops some engines
    // from paginating the document at all.
    frame.style.cssText =
      'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;opacity:0;'

    let settled = false
    const cleanup = () => {
      if (settled) return
      settled = true
      // Give the print job a moment to take its snapshot before teardown.
      setTimeout(() => {
        if (frame.parentNode) frame.parentNode.removeChild(frame)
        resolve()
      }, 500)
    }

    frame.onload = async () => {
      const win = frame.contentWindow
      if (!win) return cleanup()
      try {
        await whenFrameReady(win)
        // The frame can be torn down while we were waiting.
        if (settled || !frame.contentWindow) return cleanup()
        win.focus()
        win.addEventListener('afterprint', cleanup, { once: true })
        win.print()
        // afterprint is unreliable in Safari and some mobile browsers.
        setTimeout(cleanup, 60000)
      } catch {
        cleanup()
      }
    }

    frame.srcdoc = html
    document.body.appendChild(frame)
  })
}
