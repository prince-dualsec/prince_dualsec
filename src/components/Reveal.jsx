import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

/**
 * Scroll-triggered entrance. Animates transform + opacity only, so it stays on
 * the compositor, and collapses to a plain fade when the user prefers reduced
 * motion (handled by the global reduced-motion rule in index.css).
 */
const OFFSETS = {
  up: { y: 28, x: 0 },
  down: { y: -28, x: 0 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
}

export default function Reveal({
  children,
  from = 'up',
  delay = 0,
  duration = 0.55,
  className = '',
  once = true,
}) {
  const [ref, inView] = useInView({ threshold: 0.12, triggerOnce: once, rootMargin: '0px 0px -60px 0px' })
  const offset = OFFSETS[from] || OFFSETS.up

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
