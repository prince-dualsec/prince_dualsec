import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiMenu, HiX } from 'react-icons/hi'
import { FiFileText } from 'react-icons/fi'
import { siteConfig } from '../config/site'
import ThemeSwitcher from './ThemeSwitcher'
import ConnectMenu from './ConnectMenu'
import CVModal from './CVModal'
import Logo from './Logo'

// "prince-dualsec" -> "prince" + "-dualsec", so the wordmark stays two-tone
// without hard-coding the name.
const dash = siteConfig.username.indexOf('-')
const brandHead = dash === -1 ? siteConfig.username : siteConfig.username.slice(0, dash)
const brandTail = dash === -1 ? '' : siteConfig.username.slice(dash)

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#security-lab', label: 'Security Lab' },
  { href: '#threat-feed', label: 'Threat Feed' },
  { href: '#playbook', label: 'Playbook' },
  { href: '#journey', label: 'Journey' },
  { href: '#achievements', label: 'Achievements' },
  { href: '#github', label: 'GitHub' },
  { href: '#resources', label: 'Resources' },
  { href: '#contact', label: 'Contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [cvOpen, setCvOpen] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = null

    const measure = () => {
      frame = null
      const y = window.scrollY
      setScrolled(y > 20)

      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(100, (y / scrollable) * 100) : 0)

      const sections = navLinks.map(link => link.href.substring(1))
      let current = ''
      for (const section of [...sections].reverse()) {
        const el = document.getElementById(section)
        if (el && el.getBoundingClientRect().top <= 120) {
          current = section
          break
        }
      }
      setActiveSection(current)
    }

    const handleScroll = () => {
      if (frame === null) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  // While the mobile menu is open: freeze the page behind it, close on Escape,
  // and close if the window grows past the breakpoint where the menu is hidden
  // (otherwise the scroll lock would outlive a menu nobody can see).
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false) }
    const wide = window.matchMedia('(min-width: 1500px)')
    const onWide = () => { if (wide.matches) setIsOpen(false) }

    window.addEventListener('keydown', onKey)
    wide.addEventListener('change', onWide)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      wide.removeEventListener('change', onWide)
    }
  }, [isOpen])

  const handleNavClick = (href) => {
    const el = document.querySelector(href)
    if (!isOpen) {
      el?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setIsOpen(false)
    // Scroll only once the menu has closed and the scroll lock is released.
    // Starting the smooth scroll in the same tick is what made every menu link
    // a dead tap on phones: the close re-render cancelled it before it began.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el?.scrollIntoView({ behavior: 'smooth' }))
    })
  }

  return (
    <>
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cyber-black/80 backdrop-blur-xl border-b border-cyber-border/50 shadow-lg shadow-cyber-black/50 navbar-scrolled'
          // A soft fade rather than fully clear: the hero's digital rain runs
          // right up under the bar and would otherwise speckle the links.
          : 'bg-gradient-to-b from-cyber-black/80 to-transparent'
      }`}
    >
      {/* Wider than the page's max-w-7xl content shell: the nav carries more in
          one row than any section does, and capping it at 1280px was clipping
          the CV button off the right edge on every ordinary laptop. */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          {/* Brand — shrink-0 + nowrap, or the nav links squeeze this until
              "prince-dualsec" wraps onto a second line. */}
          <a
            href="#hero"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex items-center gap-2.5 group shrink-0"
            aria-label={`${siteConfig.username} — back to top`}
          >
            <span className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/25 group-hover:border-cyber-cyan/60 group-hover:bg-cyber-cyan/[0.18] transition-colors duration-300">
              <Logo className="w-[18px] h-[18px] text-cyber-cyan" />
            </span>
            <span className="hidden sm:block font-mono text-[17px] font-bold leading-none tracking-tight whitespace-nowrap">
              <span className="text-cyber-white">{brandHead}</span>
              {brandTail && <span className="text-cyber-cyan">{brandTail}</span>}
            </span>
          </a>

          {/* Desktop nav — flex row with gap-0 keeps links tight and
              separate from the actions column. */}
          <div className="hidden nav:flex items-center gap-0">
            {navLinks.map((link) => {
              const active = activeSection === link.href.substring(1)
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-2.5 py-2 text-[13px] font-medium rounded-lg transition-colors duration-200 whitespace-nowrap ${
                    active ? 'text-cyber-cyan' : 'text-cyber-muted hover:text-cyber-white'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2.5 -bottom-0.5 h-[2px] rounded-full bg-cyber-cyan"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                </a>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:block">
              <ConnectMenu />
            </div>

            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>

            <button
              onClick={() => setCvOpen(true)}
              className="btn-primary !px-3 sm:!px-4 !py-2 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              <FiFileText className="w-4 h-4" />
              <span className="hidden xs:inline">Get My CV</span>
              <span className="xs:hidden">CV</span>
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="nav:hidden p-2 -mr-1 text-cyber-muted hover:text-cyber-cyan transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Progress */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-transparent" aria-hidden="true">
        <div
          className="h-full bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-green transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%`, boxShadow: '0 0 8px rgba(var(--accent-rgb), 0.6)' }}
        />
      </div>

      {/* Mobile Menu — opacity/translate only. Animating height to or from
          'auto' makes framer-motion measure the element and restore
          window.scrollY afterwards, which cancels any scroll in flight. */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="nav:hidden bg-cyber-black/95 backdrop-blur-xl border-t border-b border-cyber-border/50 navbar-mobile-menu max-h-[calc(100vh-4rem)] supports-[height:100dvh]:max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
          >
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                    aria-current={activeSection === link.href.substring(1) ? 'page' : undefined}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      activeSection === link.href.substring(1)
                        ? 'text-cyber-cyan bg-cyber-cyan/10'
                        : 'text-cyber-muted hover:text-cyber-white hover:bg-cyber-dark/50'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="mt-3 pt-4 pb-1 border-t border-cyber-border/50 sm:hidden space-y-4">
                <ConnectMenu inline />
                <ThemeSwitcher inline />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>

    {/* Tap anywhere outside the open menu to dismiss it. Sits under the nav
        (z-40 vs z-50), so the menu itself stays interactive. */}
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="menu-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsOpen(false)}
          className="nav:hidden fixed inset-0 z-40 bg-black/50"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
    <CVModal isOpen={cvOpen} onClose={() => setCvOpen(false)} />
    </>
  )
}
