import { useEffect, useRef } from 'react'

// Binary is repeated so it dominates; hex and a few operators break it up.
const GLYPHS = '0101010101010101ABCDEF0123456789<>/{}[]$#@%&*+=:;'

/**
 * Site-wide "hacker" backdrop: a fixed layer behind every section.
 *
 *   base      theme colour with two faint accent glows
 *   grid      the cyber grid (fixed, so content scrolls over it)
 *   rain      canvas digital rain — strong in the hero, fading to a faint
 *             texture once the visitor scrolls past it
 *   scanlines CRT lines + vignette, static
 *
 * Performance: one canvas and one timer for the whole page. It draws at
 * 20fps (14fps on phones), pauses while the tab is hidden, and never
 * animates for reduced-motion users or on Save-Data / very low-end devices,
 * which get a single static frame instead. Cards over it are translucent but
 * deliberately not backdrop-blurred: blurring a surface whose backdrop
 * changes every frame would be re-rendered continuously.
 */
export default function HackerBackground() {
  const layerRef = useRef(null)
  const canvasRef = useRef(null)

  // Rain intensity follows the scroll: full over the hero, faint after it.
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    let frame = null
    let lastMix = -1

    const update = () => {
      frame = null
      // Rounded to 1%, so scrolling anywhere below the hero (where it stays 1)
      // does not rewrite the same value on every frame.
      const mix = Math.round(Math.min(1, window.scrollY / (window.innerHeight * 0.85)) * 100) / 100
      if (mix === lastMix) return
      lastMix = mix
      layer.style.setProperty('--rain-mix', String(mix))
    }
    const onScroll = () => { if (frame === null) frame = requestAnimationFrame(update) }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const small = window.matchMedia('(max-width: 767px)').matches
    const lowPower = Boolean(navigator.connection?.saveData) || (navigator.hardwareConcurrency || 4) <= 2

    const fontSize = small ? 14 : 16
    const frameMs = small ? 70 : 50

    let width = 0
    let height = 0
    let columns = 0
    let drops = []
    let speeds = []
    let lastRows = []
    let trail = 'rgba(0, 212, 255, 0.85)'
    let head = 'rgba(210, 255, 240, 0.95)'
    let timer = null

    const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]

    const readColors = () => {
      const root = document.documentElement
      const rgb = getComputedStyle(root).getPropertyValue('--accent-rgb').trim() || '0, 212, 255'
      const light = root.classList.contains('theme-light')
      trail = `rgba(${rgb}, ${light ? 0.75 : 0.85})`
      // A near-white head reads as "hot" on dark; on light it would vanish.
      head = light ? `rgba(${rgb}, 1)` : 'rgba(210, 255, 240, 0.95)'
    }

    const size = () => {
      const w = window.innerWidth
      // Only grow the height: mobile browsers resize the viewport every time
      // the address bar slides, and re-initialising would blank the rain.
      const h = w === width ? Math.max(height, window.innerHeight) : window.innerHeight
      if (w === width && h === height) return false

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = w
      height = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`
      ctx.textBaseline = 'top'

      const rows = Math.ceil(h / fontSize)
      columns = Math.ceil(w / fontSize)
      drops = Array.from({ length: columns }, (_, i) => drops[i] ?? -Math.random() * rows * 1.5)
      speeds = Array.from({ length: columns }, (_, i) => speeds[i] ?? 0.45 + Math.random() * 0.55)
      lastRows = Array.from({ length: columns }, () => -1)
      return true
    }

    const step = () => {
      // Fade what is already there toward transparent (not toward a colour),
      // so the layers underneath keep showing through.
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.085)'
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'source-over'

      for (let i = 0; i < columns; i++) {
        drops[i] += speeds[i]
        const row = Math.floor(drops[i])
        if (row === lastRows[i]) continue
        lastRows[i] = row
        if (row < 0) continue

        const x = i * fontSize
        const y = row * fontSize
        // Demote the previous head to a trail glyph, then draw the new head.
        ctx.clearRect(x, y - fontSize, fontSize, fontSize)
        ctx.fillStyle = trail
        ctx.fillText(pick(), x, y - fontSize)
        ctx.fillStyle = head
        ctx.fillText(pick(), x, y)

        if (y > height && Math.random() > 0.96) {
          drops[i] = -Math.random() * 20
          lastRows[i] = -1
        }
      }
    }

    // A still frame with realistic trails, for when animation is off.
    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height)
      const steps = Math.ceil(height / fontSize) * 2
      for (let s = 0; s < steps; s++) step()
    }

    const animate = () => !reducedMotion.matches && !lowPower

    const stop = () => {
      if (timer !== null) clearInterval(timer)
      timer = null
    }
    const start = () => {
      stop()
      if (!animate()) { drawStatic(); return }
      if (document.hidden) return
      timer = setInterval(step, frameMs)
    }

    readColors()
    size()
    start()

    const onResize = () => { if (size() && !animate()) drawStatic() }
    const onVisibility = () => (document.hidden ? stop() : start())
    const themeObserver = new MutationObserver(() => {
      readColors()
      if (!animate()) drawStatic()
    })

    window.addEventListener('resize', onResize, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    reducedMotion.addEventListener?.('change', start)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })

    return () => {
      stop()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      reducedMotion.removeEventListener?.('change', start)
      themeObserver.disconnect()
    }
  }, [])

  return (
    <div ref={layerRef} className="hacker-bg" aria-hidden="true">
      <div className="hacker-bg__base" />
      <div className="hacker-bg__grid" />
      <canvas ref={canvasRef} className="hacker-bg__rain" />
      <div className="hacker-bg__scanlines" />
      <div className="hacker-bg__vignette" />
    </div>
  )
}
