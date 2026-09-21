import { useState, useEffect, useRef } from 'react'

/**
 * Counts from 0 up to `value` once `active` turns true.
 * `suffix` is appended verbatim, so "20+" is <CountUp value={20} suffix="+" />.
 */
export default function CountUp({ value, suffix = '', duration = 1400, active = true }) {
  const [display, setDisplay] = useState(0)
  const frame = useRef(null)

  useEffect(() => {
    if (!active) return

    // Upstream values can be absent — the threat feed renders a count straight
    // from the API response — and animating towards undefined paints "NaN".
    if (!Number.isFinite(value)) {
      setDisplay(0)
      return
    }

    // Respect the OS setting rather than animating anyway.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }

    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      // easeOutExpo, so the number decelerates into its final value
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplay(Math.round(eased * value))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration, active])

  return <>{display}{suffix}</>
}
