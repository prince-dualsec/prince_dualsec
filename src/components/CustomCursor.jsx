import { useState, useEffect, useRef } from 'react'

// Text-entry targets keep the native I-beam — an arrow over a text field gives
// no caret feedback while typing.
const TEXT_INPUT_TYPES = new Set(['text', 'email', 'url', 'search', 'password', 'tel', 'number'])

function isTextTarget(el) {
  if (!el || typeof el.closest !== 'function') return false
  const field = el.closest('input, textarea, [contenteditable="true"]')
  if (!field) return false
  if (field.tagName === 'INPUT') return TEXT_INPUT_TYPES.has(field.type)
  return true
}

function isInteractive(el) {
  return Boolean(el && typeof el.closest === 'function' && el.closest('a, button, [role="button"], summary, label, select'))
}

export default function CustomCursor() {
  const cursorRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [clicking, setClicking] = useState(false)
  const [overText, setOverText] = useState(false)
  const [hot, setHot] = useState(false)
  const pos = useRef({ x: 0, y: 0 })
  const raf = useRef(null)
  const shown = useRef(false)
  const textRef = useRef(false)
  const hotRef = useRef(false)

  useEffect(() => {
    // A touchscreen laptop with a mouse reports maxTouchPoints > 0 but is still
    // a fine-pointer device. Gate on the pointer capability actually in use, and
    // let the stylesheet follow this decision through .custom-cursor-active so
    // the two can never disagree and leave the page with no cursor at all.
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    let teardown = null

    const enable = () => {
      document.documentElement.classList.add('custom-cursor-active')
      let schedule = () => {}

      const onMouseMove = (e) => {
        pos.current.x = e.clientX
        pos.current.y = e.clientY
        schedule()
        // Only re-render React when the hovered category actually changes.
        const text = isTextTarget(e.target)
        const hover = isInteractive(e.target)
        if (text !== textRef.current) { textRef.current = text; setOverText(text) }
        if (hover !== hotRef.current) { hotRef.current = hover; setHot(hover) }
        if (!shown.current) {
          shown.current = true
          setVisible(true)
        }
      }

      const onMouseDown = () => setClicking(true)
      const onMouseUp = () => setClicking(false)
      const hide = () => { shown.current = false; setVisible(false) }
      const show = () => { shown.current = true; setVisible(true) }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mousedown', onMouseDown)
      document.addEventListener('mouseup', onMouseUp)
      document.addEventListener('mouseleave', hide)
      document.addEventListener('mouseenter', show)
      // Alt-tabbing away leaves a stale cursor pinned to the page.
      window.addEventListener('blur', hide)

      // Drive the transform from the move event via a single queued frame
      // instead of an unconditional rAF loop. The old version scheduled a
      // callback every frame for the life of the page, keeping the main thread
      // and compositor busy even while the mouse sat still.
      const draw = () => {
        raf.current = null
        if (cursorRef.current) {
          // -1px on both axes puts the arrow tip on the real hotspot rather
          // than one pixel down and to the right of it.
          cursorRef.current.style.transform =
            `translate3d(${pos.current.x - 1}px, ${pos.current.y - 1}px, 0)`
        }
      }
      schedule = () => {
        if (raf.current === null) raf.current = requestAnimationFrame(draw)
      }

      teardown = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mousedown', onMouseDown)
        document.removeEventListener('mouseup', onMouseUp)
        document.removeEventListener('mouseleave', hide)
        document.removeEventListener('mouseenter', show)
        window.removeEventListener('blur', hide)
        if (raf.current !== null) cancelAnimationFrame(raf.current)
        raf.current = null
        document.documentElement.classList.remove('custom-cursor-active')
        shown.current = false
        setVisible(false)
      }
    }

    const apply = () => {
      if (teardown) { teardown(); teardown = null }
      if (query.matches) enable()
    }

    apply()
    // Plugging in or unplugging a mouse flips this at runtime.
    // Safari < 14 only has the deprecated addListener form.
    if (query.addEventListener) query.addEventListener('change', apply)
    else if (query.addListener) query.addListener(apply)

    return () => {
      if (query.removeEventListener) query.removeEventListener('change', apply)
      else if (query.removeListener) query.removeListener(apply)
      if (teardown) teardown()
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      /* Above the boot screen (z-9999), which otherwise paints over the cursor
         for the first few seconds while the native one is hidden. */
      className="fixed top-0 left-0 z-[10000] pointer-events-none"
      style={{
        opacity: visible && !overText ? 1 : 0,
        transition: 'opacity 0.15s',
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      <svg
        width="24"
        height="28"
        viewBox="0 0 24 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `scale(${clicking ? 0.85 : hot ? 1.15 : 1})`,
          transformOrigin: '4px 4px',
          transition: 'transform 0.12s ease-out',
          filter: clicking ? 'brightness(0.8)' : 'none',
        }}
      >
        <path
          d="M1 1L1 22L7 17L12 27L16 25L11 15L18 15L1 1Z"
          fill="var(--accent)"
          stroke="#000000"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
