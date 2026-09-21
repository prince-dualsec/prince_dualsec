/**
 * Brand mark: an angular crest shield with a P monogram knocked out of it.
 *
 * Drawn with `currentColor` rather than hard-coded hex so it inherits whatever
 * text colour it sits in and follows the light/dark themes for free.
 *
 * The monogram is a filled glyph, not a stroked one: at favicon and navbar-chip
 * sizes a stroked letterform thins out and turns to mush, while a solid one
 * keeps its shape.
 */

const SHIELD = 'M16 2.2 L27.5 6.4 V15.4 L16 29.8 L4.5 15.4 V6.4 Z'

// Outer contour of the P, then the counter (the hole in the bowl). Rendered
// with fill-rule="evenodd" so the second subpath cuts through the first.
const MONOGRAM =
  'M12.2 8.4 H17.6 C20.6 8.4 22.5 10.1 22.5 12.6 C22.5 15.1 20.6 16.8 17.6 16.8 ' +
  'H15.4 V21.8 H12.2 Z ' +
  'M15.4 11.1 H17.3 C18.3 11.1 19.0 11.7 19.0 12.6 C19.0 13.5 18.3 14.1 17.3 14.1 H15.4 Z'

export default function Logo({ className = 'w-6 h-6', title, solid = false }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      <path
        d={SHIELD}
        fill="currentColor"
        fillOpacity={solid ? 0.18 : 0.08}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d={MONOGRAM} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
