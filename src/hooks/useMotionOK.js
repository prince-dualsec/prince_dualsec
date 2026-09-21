import { useState, useEffect } from 'react'

/**
 * True when it is reasonable to run continuous/decorative motion: the viewport
 * is not a small phone and the user has not asked for reduced motion.
 * Starts false so the first paint is the calm one.
 */
export default function useMotionOK(minWidth = 768) {
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const size = window.matchMedia(`(min-width: ${minWidth}px)`)
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setOk(size.matches && !calm.matches)

    update()
    size.addEventListener('change', update)
    calm.addEventListener('change', update)
    return () => {
      size.removeEventListener('change', update)
      calm.removeEventListener('change', update)
    }
  }, [minWidth])

  return ok
}
