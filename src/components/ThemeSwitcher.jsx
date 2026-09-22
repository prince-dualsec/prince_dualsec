import { useState, useRef, useEffect } from 'react'
import { FiSun, FiMoon, FiMonitor, FiChevronDown } from 'react-icons/fi'
import { useTheme } from '../contexts/ThemeContext'

const options = [
  { value: 'dark', label: 'Dark', icon: FiMoon },
  { value: 'light', label: 'Light', icon: FiSun },
  { value: 'system', label: 'System', icon: FiMonitor },
]

/**
 * `inline` renders the three options as a segmented control instead of a
 * dropdown — for the mobile menu, where a popover opening off the bottom of a
 * scrollable panel gets clipped.
 */
export default function ThemeSwitcher({ compact = false, inline = false }) {
  const { theme, changeTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    // pointerdown rather than mousedown: touch browsers only synthesise mouse
    // events after a tap completes, and not at all when the touch scrolls.
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  const current = options.find(o => o.value === theme) || options[0]
  const Icon = current.icon

  if (inline) {
    return (
      <div role="radiogroup" aria-label="Theme" className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-lg bg-cyber-dark/50 border border-cyber-border/50">
          {options.map(opt => {
            const OptIcon = opt.icon
            const active = theme === opt.value
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                onClick={() => changeTheme(opt.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  active ? 'text-cyber-cyan bg-cyber-cyan/10' : 'text-cyber-muted hover:text-cyber-white'
                }`}
              >
                <OptIcon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-all duration-200"
          aria-label="Switch theme"
        >
          <Icon className="w-4 h-4" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-36 py-1 rounded-lg border border-cyber-border/50 glass-card backdrop-blur-xl shadow-xl z-50">
            {options.map(opt => {
              const OptIcon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => { changeTheme(opt.value); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                    theme === opt.value
                      ? 'text-cyber-cyan bg-cyber-cyan/10'
                      : 'text-cyber-muted hover:text-cyber-white hover:bg-cyber-dark/50'
                  }`}
                >
                  <OptIcon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 border border-transparent hover:border-cyber-cyan/20 transition-all duration-200"
        aria-label="Switch theme"
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current.label}</span>
        <FiChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 py-1 rounded-lg border border-cyber-border/50 glass-card backdrop-blur-xl shadow-xl z-50">
          {options.map(opt => {
            const OptIcon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => { changeTheme(opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                  theme === opt.value
                    ? 'text-cyber-cyan bg-cyber-cyan/10'
                    : 'text-cyber-muted hover:text-cyber-white hover:bg-cyber-dark/50'
                }`}
              >
                <OptIcon className="w-3.5 h-3.5" />
                {opt.label}
                {theme === opt.value && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyber-cyan" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
