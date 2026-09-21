import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiMail, FiGithub, FiLinkedin, FiPhone } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { siteConfig } from '../config/site'
import Logo from './Logo'

export default function Contact() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section id="contact" className="section-block py-16 sm:py-24 px-4 relative">
      <style>{`
        /* ── Strong neon glow pulse ── */
        @keyframes cyber-glow {
          0%, 100% {
            filter:
              drop-shadow(0 0 8px rgba(var(--accent-rgb), 0.6))
              drop-shadow(0 0 20px rgba(var(--accent-rgb), 0.35))
              drop-shadow(0 0 40px rgba(var(--accent-rgb), 0.15));
          }
          50% {
            filter:
              drop-shadow(0 0 16px rgba(var(--accent-rgb), 0.9))
              drop-shadow(0 0 36px rgba(var(--accent-rgb), 0.5))
              drop-shadow(0 0 64px rgba(var(--accent-rgb), 0.25));
          }
        }

        /* ── Radial halo pulse behind logo ── */
        @keyframes halo-pulse {
          0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.5;  transform: translate(-50%, -50%) scale(1.15); }
        }

        /* ── Ring rotation ── */
        @keyframes ring-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* ── Radar ripple expanding outward ── */
        @keyframes radar-ripple {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }

        /* ── Bright scan line top → bottom ── */
        @keyframes scan-sweep {
          0%   { transform: translateY(-100%); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }

        /* ── Glitch flicker ── */
        @keyframes glitch-flicker {
          0%, 91%, 100% { transform: translate(0, 0); opacity: 1; }
          92% { transform: translate(-2px, 1px); opacity: 0.75; }
          93% { transform: translate(2px, -1px); opacity: 0.85; }
          94% { transform: translate(-1px, -1px); opacity: 0.65; }
          95% { transform: translate(1px, 0); opacity: 1; }
        }

        /* ── Applied classes ── */
        .cyber-glow { animation: cyber-glow 3s ease-in-out infinite; }
        .cyber-halo { animation: halo-pulse 3s ease-in-out infinite; }
        .cyber-ring { animation: ring-spin 12s linear infinite; }
        .cyber-ripple { animation: radar-ripple 2.8s ease-out infinite; }
        .cyber-ripple-2 { animation: radar-ripple 2.8s ease-out infinite 0.9s; }
        .cyber-ripple-3 { animation: radar-ripple 2.8s ease-out infinite 1.8s; }
        .cyber-scan { animation: scan-sweep 3s linear infinite; }
        .cyber-glitch { animation: glitch-flicker 5s steps(1) infinite; }

        /* ── Hover: intensify glow + halo, speed up ring ── */
        .logo-card:hover .cyber-glow {
          filter:
            drop-shadow(0 0 20px rgba(var(--accent-rgb), 1))
            drop-shadow(0 0 44px rgba(var(--accent-rgb), 0.6))
            drop-shadow(0 0 80px rgba(var(--accent-rgb), 0.3));
        }
        .logo-card:hover .cyber-halo { opacity: 0.65; transform: translate(-50%, -50%) scale(1.25); }
        .logo-card:hover .cyber-ring { animation-duration: 6s; }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .cyber-glow { animation: none !important; filter: drop-shadow(0 0 12px rgba(var(--accent-rgb), 0.55)); }
          .cyber-halo, .cyber-ring, .cyber-ripple, .cyber-ripple-2, .cyber-ripple-3,
          .cyber-scan, .cyber-glitch { animation: none !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyber-cyan font-mono text-sm">// GET IN TOUCH</span>
          <h2 className="section-heading mt-2">Contact</h2>
          <p className="section-subtitle">Have a security project or want to collaborate? Let's talk.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          {/* Contact Info — unchanged */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl mx-auto lg:mx-0 w-full"
          >
            <div className="glass-card p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-cyber-white mb-6">Contact Information</h3>

              <div className="space-y-4">
                <a href={`https://wa.me/${siteConfig.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-cyber-dark/30 border border-cyber-border/30 hover:border-cyber-cyan/20 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                    <FaWhatsapp className="w-5 h-5 text-cyber-cyan" />
                  </div>
                  <div>
                    <div className="text-xs text-cyber-muted">WhatsApp</div>
                    <div className="text-sm text-cyber-white group-hover:text-cyber-cyan transition-colors">Chat on WhatsApp</div>
                  </div>
                </a>

                <a href={`tel:${siteConfig.phone2}`} className="flex items-center gap-4 p-4 rounded-xl bg-cyber-dark/30 border border-cyber-border/30 hover:border-cyber-cyan/20 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                    <FiPhone className="w-5 h-5 text-cyber-cyan" />
                  </div>
                  <div>
                    <div className="text-xs text-cyber-muted">Phone</div>
                    <div className="text-sm text-cyber-white group-hover:text-cyber-cyan transition-colors">Call Me</div>
                  </div>
                </a>

                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${siteConfig.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-cyber-dark/30 border border-cyber-border/30 hover:border-cyber-cyan/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                    <FiMail className="w-5 h-5 text-cyber-cyan" />
                  </div>
                  <div>
                    <div className="text-xs text-cyber-muted">Email</div>
                    <div className="text-sm text-cyber-white group-hover:text-cyber-cyan transition-colors">{siteConfig.email}</div>
                  </div>
                </a>

                <a href={siteConfig.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-cyber-dark/30 border border-cyber-border/30 hover:border-cyber-cyan/20 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                    <FiLinkedin className="w-5 h-5 text-cyber-cyan" />
                  </div>
                  <div>
                    <div className="text-xs text-cyber-muted">LinkedIn</div>
                    <div className="text-sm text-cyber-white group-hover:text-cyber-cyan transition-colors">Connect on LinkedIn</div>
                  </div>
                </a>

                <a href={siteConfig.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-cyber-dark/30 border border-cyber-border/30 hover:border-cyber-cyan/20 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                    <FiGithub className="w-5 h-5 text-cyber-cyan" />
                  </div>
                  <div>
                    <div className="text-xs text-cyber-muted">GitHub</div>
                    <div className="text-sm text-cyber-white group-hover:text-cyber-cyan transition-colors">@{siteConfig.username}</div>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Logo Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-xl mx-auto lg:mx-0 w-full"
          >
            <div className="logo-card glass-card p-6 h-full flex items-center justify-center min-h-[360px] relative overflow-hidden group">

              {/* ── Radial glow halo behind everything ── */}
              <div
                className="cyber-halo absolute left-1/2 top-1/2 w-48 h-48 sm:w-56 sm:h-56 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.35) 0%, rgba(var(--accent-rgb), 0.08) 50%, transparent 70%)',
                }}
              />

              {/* ── Radar ripple rings ── */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="cyber-ripple absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-cyber-cyan/35" />
                <div className="cyber-ripple-2 absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-cyber-cyan/25" />
                <div className="cyber-ripple-3 absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-cyber-cyan/20" />
              </div>

              {/* ── Rotating glowing ring ── */}
              <div className="absolute left-1/2 top-1/2 w-36 h-36 sm:w-40 sm:h-40 pointer-events-none">
                <svg
                  viewBox="0 0 140 140"
                  className="cyber-ring absolute inset-0 w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="70" cy="70" r="64"
                    stroke="rgb(var(--accent-rgb))"
                    strokeWidth="1"
                    strokeDasharray="8 6"
                    opacity="0.25"
                  />
                  <circle
                    cx="70" cy="70" r="64"
                    stroke="rgb(var(--accent-rgb))"
                    strokeWidth="1.5"
                    strokeDasharray="22 380"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                </svg>
              </div>

              {/* ── Bright scan line (clipped to logo area) ── */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ clipPath: 'circle(48px at center)' }}>
                <div
                  className="cyber-scan absolute left-0 right-0 h-[2px] mx-auto"
                  style={{ background: 'linear-gradient(90deg, transparent 5%, rgb(var(--accent-rgb)) 40%, rgb(var(--accent-rgb)) 60%, transparent 95%)', top: '0%', boxShadow: '0 0 12px rgba(var(--accent-rgb), 0.8), 0 0 24px rgba(var(--accent-rgb), 0.4)' }}
                />
              </div>

              {/* ── Logo with glow + glitch ── */}
              <div className="cyber-glitch relative z-10">
                <div className="cyber-glow">
                  <div className="text-cyber-cyan" style={{ width: 'clamp(96px, 12vw, 150px)', height: 'clamp(96px, 12vw, 150px)' }}>
                    <Logo className="w-full h-full" title="Prince Dualsec brand mark" solid />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
