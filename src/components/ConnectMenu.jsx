import { useState, useRef, useEffect, useCallback } from 'react'
import { FiChevronDown, FiLinkedin, FiGithub } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { SiGmail } from 'react-icons/si'
import { siteConfig } from '../config/site'

// wa.me rejects anything but digits, so the leading + and any spacing in the
// configured number have to go.
const whatsappNumber = siteConfig.phone.replace(/[^0-9]/g, '')

const channels = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    hint: 'Send a message',
    icon: FaWhatsapp,
    color: '#25D366',
    href: `https://wa.me/${whatsappNumber}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    hint: 'Connect with me',
    icon: FiLinkedin,
    color: '#0A66C2',
    href: siteConfig.linkedin,
  },
  {
    id: 'gmail',
    label: 'Gmail',
    hint: siteConfig.email,
    icon: SiGmail,
    color: '#EA4335',
    // The Gmail compose window rather than a mailto: — a visitor without a
    // desktop mail client configured gets nothing at all from mailto:.
    href: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(siteConfig.email)}`,
  },
  {
    id: 'github',
    label: 'GitHub',
    hint: `@${siteConfig.username}`,
    icon: FiGithub,
    color: '#8b949e',
    href: siteConfig.github,
  },
]

/**
 * Quick-reach dropdown for the direct contact channels.
 *
 * Every entry opens in a new tab: these all leave the site, and a visitor part
 * way through the CV or a security tool should not lose their place.
 *
 * `inline` drops the popover and lays the channels out as a row, for the mobile
 * menu where there is no room for a menu hanging off a menu.
 */
export default function ConnectMenu({ inline = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const buttonRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close()
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      close()
      // Send focus back to the trigger, or the next Tab starts from the top of
      // the document.
      buttonRef.current?.focus()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  if (inline) {
    return (
      <div className="flex items-center justify-center gap-2">
        {channels.map(({ id, label, icon: Icon, color, href }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="w-10 h-10 rounded-lg bg-cyber-dark/50 border border-cyber-border/50 flex items-center justify-center text-cyber-muted hover:text-cyber-white hover:border-cyber-cyan/30 transition-all duration-200"
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </a>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Connect with me"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 border border-transparent hover:border-cyber-cyan/20 transition-all duration-200"
      >
        <FaWhatsapp className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Connect</span>
        <FiChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Connect with me"
          className="absolute right-0 top-full mt-2 w-60 p-1 rounded-lg border border-cyber-border/50 glass-card backdrop-blur-xl shadow-xl z-50"
        >
          {channels.map(({ id, label, hint, icon: Icon, color, href }) => (
            <a
              key={id}
              role="menuitem"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex items-center gap-3 px-2.5 py-2 rounded-md text-cyber-muted hover:bg-cyber-dark/60 hover:text-cyber-white transition-colors group"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: `${color}1a`, border: `1px solid ${color}40` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-cyber-text group-hover:text-cyber-white">
                  {label}
                </span>
                {/* An email address or handle must never be clipped — a
                    half-shown address is worse than none. */}
                <span className="block text-[10px] text-cyber-muted/70 break-anywhere">{hint}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
