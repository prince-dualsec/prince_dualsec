import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiPrinter, FiUser, FiGithub, FiLinkedin, FiMail, FiPhone } from 'react-icons/fi'
import { siteConfig } from '../config/site'
import { skillsData, toolsData } from '../config/skills'
import { projectsData } from '../config/projects'
import { achievementsData } from '../config/achievements'
import { journeyData } from '../config/journey'
import { buildCVHtml, printCVDocument, loadPhotoDataUrl } from '../utils/cvDocument'
import { assetUrl, absoluteAssetUrl } from '../utils/assetUrl'
import Logo from './Logo'

// Strip anything a filesystem would reject, and keep the name a sane length.
// This becomes the document title, which is what the browser offers as the
// default filename in the "Save as PDF" dialog.
function safeFileName(value) {
  const cleaned = (value || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40)
  return cleaned || 'visitor'
}

// Certifications that are only planned or under way must not sit in the same
// list as ones actually held — on a CV that reads as a claim to hold them.
function splitAchievements(list) {
  const earned = list.filter((a) => a.status === 'completed')
  const pending = list.filter((a) => a.status !== 'completed')
  return { earned, pending }
}

const STATUS_LABEL = {
  'in-progress': 'In progress',
  planned: 'Planned',
  completed: 'Earned',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function CVModal({ isOpen, onClose }) {
  const [visitorName, setVisitorName] = useState('')
  const [showCV, setShowCV] = useState(false)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')

  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const restoreFocusRef = useRef(null)

  const { earned, pending } = useMemo(() => splitAchievements(achievementsData), [])

  const handleClose = useCallback(() => {
    setShowCV(false)
    setVisitorName('')
    setName('')
    setFormError('')
    onClose()
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = visitorName.trim()
    if (trimmed.length < 2) {
      setFormError('Please enter your name (at least 2 characters).')
      inputRef.current?.focus()
      return
    }
    setFormError('')
    setName(trimmed)
    setShowCV(true)
  }

  // Escape to dismiss, background scroll lock, and a focus trap. A modal that
  // leaves focus behind it is unusable with a keyboard or a screen reader.
  useEffect(() => {
    if (!isOpen) return

    restoreFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }
      if (e.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      )
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      // Send focus back where it came from, typically the Get My CV button.
      const target = restoreFocusRef.current
      if (target && typeof target.focus === 'function') target.focus()
    }
  }, [isOpen, handleClose])

  // Move focus into the panel when the view changes.
  useEffect(() => {
    if (!isOpen) return
    const id = setTimeout(() => {
      if (!showCV) inputRef.current?.focus()
      else panelRef.current?.querySelector(FOCUSABLE)?.focus()
    }, 80)
    return () => clearTimeout(id)
  }, [isOpen, showCV])

  const [printing, setPrinting] = useState(false)

  // Printing the live modal never gave a clean PDF — the page behind it still
  // occupies layout space, so the job came out padded with blank pages. Render
  // a purpose-built A4 document instead and print that.
  const handlePrint = async () => {
    setPrinting(true)
    try {
      // Read the portrait into the document itself. A printed page cannot wait
      // on a network fetch, so anything still loading is simply absent from the
      // PDF — which is exactly how the photo went missing before.
      const photo = await loadPhotoDataUrl(absoluteAssetUrl(siteConfig.profileImage))
      const html = buildCVHtml({
        name,
        site: siteConfig,
        skills: skillsData,
        tools: toolsData,
        projects: projectsData,
        earned,
        pending,
        journey: journeyData,
        photo,
        docTitle: `${siteConfig.name}_CV_${safeFileName(name)}`,
      })
      await printCVDocument(html)
    } finally {
      setPrinting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cv-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cv-print-hide absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="cv-modal cv-print-root relative w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-cyber-cyan/20 shadow-[0_0_40px_rgba(0,212,255,0.1)]"
            style={{ background: 'rgb(var(--cyber-black) / 0.98)' }}
          >
            {!showCV ? (
              /* ── Request form ───────────────────────────────── */
              <div className="p-5 sm:p-8 md:p-12 overflow-y-auto scrollbar-thin">
                <button
                  onClick={handleClose}
                  className="cv-print-hide absolute top-4 right-4 z-10 p-2 rounded-lg text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/10 transition-all"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center mx-auto mb-4">
                    <Logo className="w-8 h-8 text-cyber-cyan" />
                  </div>
                  <h2 id="cv-modal-title" className="text-2xl md:text-3xl font-bold text-cyber-white font-mono mb-2">
                    Get My CV
                  </h2>
                  <p className="text-cyber-muted max-w-md mx-auto text-sm sm:text-base">
                    Add your name and the CV will be personalised for you, then download it
                    as a PDF.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="max-w-md mx-auto space-y-5">
                  <div>
                    <label htmlFor="cv-visitor-name" className="block text-sm text-cyber-text mb-2 font-mono">
                      Your name
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted pointer-events-none" />
                      <input
                        id="cv-visitor-name"
                        ref={inputRef}
                        type="text"
                        value={visitorName}
                        onChange={(e) => {
                          setVisitorName(e.target.value)
                          if (formError) setFormError('')
                        }}
                        placeholder="e.g. Alex Morgan"
                        autoComplete="name"
                        maxLength={60}
                        aria-invalid={Boolean(formError)}
                        aria-describedby={formError ? 'cv-name-error' : undefined}
                        className="w-full pl-10 pr-4 py-3 cv-input rounded-lg text-cyber-text placeholder-cyber-muted/50 transition-all duration-300 focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/30"
                      />
                    </div>
                    {formError && (
                      <p id="cv-name-error" role="alert" className="text-[11px] text-cyber-red mt-2">
                        {formError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <Logo className="w-4 h-4" />
                    Generate CV
                  </button>
                </form>
              </div>
            ) : (
              /* ── Generated CV ───────────────────────────────── */
              <>
                {/* Action bar */}
                <div className="cv-print-hide flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-cyber-border/50 bg-cyber-dark/30 flex-shrink-0">
                  <span id="cv-modal-title" className="text-sm font-mono text-cyber-muted truncate">
                    CV — {siteConfig.name}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handlePrint}
                      disabled={printing}
                      title="Opens the print dialog — choose 'Save as PDF' as the destination"
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 transition-all disabled:opacity-50"
                    >
                      <FiPrinter className={`w-4 h-4 ${printing ? 'animate-pulse' : ''}`} />
                      <span className="hidden sm:inline">{printing ? 'Preparing…' : 'Download PDF'}</span>
                    </button>
                    <button
                      onClick={handleClose}
                      aria-label="Close"
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/20 transition-all"
                    >
                      <FiX className="w-4 h-4" />
                      <span className="hidden sm:inline">Close</span>
                    </button>
                  </div>
                </div>

                {/* Sheet */}
                <div className="cv-print-sheet flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8 scrollbar-thin">
                  {/* Header */}
                  <header className="cv-block flex items-start justify-between gap-6 pb-6 border-b border-cyber-border/30 print:border-gray-300">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-20 h-20 rounded-2xl bg-cyber-cyan/10 border border-cyber-cyan/30 print:border-gray-300 flex items-center justify-center flex-shrink-0">
                        <Logo className="w-10 h-10 text-cyber-cyan print:text-gray-700" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-3xl md:text-4xl font-bold font-mono mb-1 text-cyber-white print:text-black">
                          {siteConfig.name}
                        </h1>
                        <p className="text-cyber-cyan font-mono text-lg print:text-blue-700">{siteConfig.username}</p>
                        <p className="text-cyber-muted mt-2 print:text-gray-600">{siteConfig.role}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <img
                        src={assetUrl(siteConfig.profileImage)}
                        alt={siteConfig.name}
                        width="825"
                        height="1024"
                        className="w-[105px] h-[131px] rounded-lg object-cover object-top border border-cyber-border/30 print:border-gray-300"
                      />
                      <p className="text-sm text-cyber-cyan/60 font-mono print:text-gray-500 text-right">
                        Prepared for: {name}
                      </p>
                    </div>
                  </header>

                  <Section title="Contact">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <ContactItem icon={FiMail} label="Email" value={siteConfig.email} href={`mailto:${siteConfig.email}`} />
                      <ContactItem icon={FiPhone} label="Phone" value={siteConfig.phone} href={`tel:${siteConfig.phone}`} />
                      {siteConfig.phone2 && (
                        <ContactItem icon={FiPhone} label="Alternate" value={siteConfig.phone2} href={`tel:${siteConfig.phone2}`} />
                      )}
                      <ContactItem icon={FiGithub} label="GitHub" value={siteConfig.github.replace(/^https?:\/\//, '')} href={siteConfig.github} />
                      <ContactItem icon={FiLinkedin} label="LinkedIn" value={siteConfig.linkedin.replace(/^https?:\/\//, '')} href={siteConfig.linkedin} />
                    </div>
                  </Section>

                  <Section title="Professional Summary">
                    <p className="text-cyber-text leading-relaxed print:text-gray-800">
                      {siteConfig.description}
                    </p>
                  </Section>

                  <Section title="Core Skills">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      {Object.values(skillsData).map((category) => (
                        <div key={category.title} className="cv-block">
                          <h4 className="text-sm font-semibold text-cyber-cyan mb-2 font-mono print:text-blue-700">
                            {category.title}
                          </h4>
                          <div className="space-y-1.5">
                            {category.skills.map((skill) => (
                              <div key={skill.name} className="flex items-center gap-3 text-sm">
                                <span className="text-cyber-text print:text-gray-800 flex-1">{skill.name}</span>
                                <span className="h-1 w-20 rounded-full bg-cyber-border/50 overflow-hidden flex-shrink-0 print:hidden">
                                  <span
                                    className="block h-full rounded-full bg-cyber-cyan"
                                    style={{ width: `${skill.level}%` }}
                                  />
                                </span>
                                <span className="text-cyber-muted font-mono text-xs w-9 text-right print:text-gray-500">
                                  {skill.level}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Tools & Technologies">
                    <div className="flex flex-wrap gap-2">
                      {toolsData.map((tool) => (
                        <span
                          key={tool.name}
                          className="px-2.5 py-1 text-xs rounded-md bg-cyber-dark border border-cyber-border text-cyber-text font-mono print:bg-transparent print:border-gray-300 print:text-gray-800"
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </Section>

                  <Section title="Key Projects">
                    <div className="space-y-3">
                      {projectsData.map((project) => (
                        <article
                          key={project.id}
                          className="cv-block p-4 rounded-lg bg-cyber-dark/30 border border-cyber-border/30 print:bg-transparent print:border-gray-200"
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4 className="text-sm font-semibold text-cyber-white print:text-black">{project.title}</h4>
                            <StatusPill status={project.status} />
                          </div>
                          <p className="text-xs text-cyber-muted mb-2 print:text-gray-700">{project.description}</p>
                          <p className="text-[11px] font-mono text-cyber-cyan/80 print:text-gray-600">
                            {project.technologies.join(' · ')}
                          </p>
                        </article>
                      ))}
                    </div>
                  </Section>

                  {earned.length > 0 && (
                    <Section title="Certifications">
                      <div className="space-y-3">
                        {earned.map((item) => (
                          <CredentialRow key={item.id} item={item} />
                        ))}
                      </div>
                    </Section>
                  )}

                  {pending.length > 0 && (
                    <Section title="Certifications in Progress & Planned">
                      <p className="text-[11px] text-cyber-muted/70 mb-3 print:text-gray-500">
                        Listed for transparency — these are not yet held.
                      </p>
                      <div className="space-y-3">
                        {pending.map((item) => (
                          <CredentialRow key={item.id} item={item} />
                        ))}
                      </div>
                    </Section>
                  )}

                  <Section title="Professional Journey">
                    <div className="space-y-3">
                      {journeyData.map((item) => (
                        <div key={item.id} className="cv-block flex items-start gap-3">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 flex-shrink-0 print:bg-transparent print:text-blue-700 print:border-blue-200">
                            {item.year}
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-cyber-white print:text-black">{item.title}</h4>
                            <p className="text-xs text-cyber-muted print:text-gray-700">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <footer className="text-center pt-6 border-t border-cyber-border/30 print:border-gray-300">
                    <p className="text-xs text-cyber-muted font-mono print:text-gray-500">
                      {siteConfig.email} · {siteConfig.github.replace(/^https?:\/\//, '')} · generated{' '}
                      {new Date().toLocaleDateString()}
                    </p>
                  </footer>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatusPill({ status }) {
  const done = status === 'completed'
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-mono flex-shrink-0 border ${
        done
          ? 'bg-cyber-green/15 text-cyber-green border-cyber-green/30 print:bg-transparent print:text-green-700 print:border-green-300'
          : 'bg-cyber-orange/15 text-cyber-orange border-cyber-orange/30 print:bg-transparent print:text-orange-700 print:border-orange-300'
      }`}
    >
      {done ? 'Completed' : 'In progress'}
    </span>
  )
}

function CredentialRow({ item }) {
  return (
    <div className="cv-block flex items-start gap-3">
      <span
        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 print:hidden"
        style={{ backgroundColor: item.color }}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-cyber-white print:text-black">{item.title}</h4>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyber-border text-cyber-muted print:border-gray-300 print:text-gray-600">
            {STATUS_LABEL[item.status] || item.status}
          </span>
        </div>
        <p className="text-xs text-cyber-muted print:text-gray-600">
          {item.issuer}
          {/* A placeholder credential id would read as a real one on a CV. */}
          {item.credentialId && !/X{2,}/i.test(item.credentialId) && ` · ID ${item.credentialId}`}
        </p>
        <p className="text-xs text-cyber-text mt-0.5 print:text-gray-700">{item.description}</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="cv-section">
      <h3 className="text-lg font-bold text-cyber-cyan mb-3 font-mono pb-1 border-b border-cyber-cyan/20 print:text-blue-700 print:border-blue-200">
        {title}
      </h3>
      {children}
    </section>
  )
}

function ContactItem({ icon: Icon, label, value, href }) {
  const content = (
    <div className="flex items-center gap-3 p-2 rounded-lg print:p-1">
      <Icon className="w-4 h-4 text-cyber-cyan flex-shrink-0 print:text-blue-700" />
      <div className="min-w-0">
        <div className="text-[10px] text-cyber-muted uppercase tracking-wider print:text-gray-500">{label}</div>
        {/* Never truncate on a CV — a clipped email or URL is unusable. */}
        <div className="text-sm text-cyber-text font-mono break-anywhere print:text-gray-800">{value}</div>
      </div>
    </div>
  )

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="block rounded-lg hover:bg-cyber-dark/30 transition-colors print:hover:bg-transparent"
      >
        {content}
      </a>
    )
  }
  return content
}
