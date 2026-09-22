import { motion } from 'framer-motion'
import { TypeAnimation } from 'react-type-animation'
import { FiArrowDown } from 'react-icons/fi'
import { FaShieldAlt, FaTerminal, FaBug, FaLock } from 'react-icons/fa'
import { siteConfig } from '../config/site'
import useMotionOK from '../hooks/useMotionOK'

const floatingIcons = [
  { Icon: FaShieldAlt, delay: 0, x: '10%', y: '20%' },
  { Icon: FaTerminal, delay: 1, x: '85%', y: '15%' },
  { Icon: FaBug, delay: 2, x: '75%', y: '70%' },
  { Icon: FaLock, delay: 0.5, x: '15%', y: '75%' },
]

export default function Hero() {
  // Ornamental loops are skipped on phones and for reduced-motion users:
  // each one keeps a rAF animation alive for the lifetime of the page.
  const showDecor = useMotionOK()

  return (
    // svh, not vh: on mobile browsers 100vh includes the area under the
    // address bar, which hid the scroll hint. The vertical padding keeps the
    // content clear of the fixed navbar and the hint on short (landscape)
    // screens, where the content is taller than the viewport.
    <section id="hero" className="relative min-h-screen supports-[min-height:100svh]:min-h-[100svh] flex items-center justify-center overflow-hidden pt-24 pb-28 sm:py-28">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-cyan/5 rounded-full blur-[90px] hero-blur-cyan" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-cyber-blue/5 rounded-full blur-[80px] hero-blur-blue" />
        {/* Dims the digital rain (HackerBackground) behind the headline. */}
        <div className="absolute inset-0 hero-spotlight" />
      </div>

      {/* Hacker HUD: scan beam, corner brackets and terminal readouts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="hero-scanbeam decor-animated" />
      </div>
      <div className="absolute inset-x-4 sm:inset-x-8 top-20 bottom-5 sm:bottom-8 pointer-events-none" aria-hidden="true">
        <span className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-cyber-cyan/40" />
        <span className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-cyber-cyan/40" />
        <span className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-cyber-cyan/40" />
        <span className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-cyber-cyan/40" />

        <span className="hidden lg:block absolute top-2 left-12 font-mono text-[11px] tracking-wider text-cyber-cyan/55">
          root@prince:~# <span className="animate-blink">_</span>
        </span>
        <span className="hidden lg:block absolute top-2 right-12 font-mono text-[11px] tracking-wider text-cyber-cyan/55">
          [ ACCESS GRANTED ]
        </span>
        <span className="hidden lg:block absolute bottom-2 left-12 font-mono text-[11px] tracking-wider text-cyber-muted/60">
          SYS.STATUS :: <span className="text-cyber-green/70">ONLINE</span>
        </span>
        <span className="hidden lg:block absolute bottom-2 right-12 font-mono text-[11px] tracking-wider text-cyber-muted/60">
          // {siteConfig.username}
        </span>
      </div>

      {/* Floating Icons */}
      {showDecor && floatingIcons.map(({ Icon, delay, x, y }, i) => (
        <motion.div
          key={i}
          className="absolute text-cyber-cyan/10 hero-floating-icon"
          style={{ left: x, top: y }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: delay,
          }}
        >
          <Icon size={40 + i * 10} />
        </motion.div>
      ))}

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan text-xs xs:text-sm font-mono mb-6 sm:mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse flex-shrink-0" />
          Available for security projects
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-bold text-cyber-white mb-4 font-mono break-words">
            Hi, I'm{' '}
            <span className="text-shimmer neon-text">{siteConfig.name}</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-cyber-muted font-mono mb-2">
            {siteConfig.username}
          </p>
        </motion.div>

        {/* Animated Role */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="min-h-[3rem] flex items-center justify-center mb-8 px-2"
        >
          <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-mono text-cyber-text text-center">
            <span className="text-cyber-muted">&gt;&gt; </span>
            <TypeAnimation
              sequence={[
                'Cybersecurity Expert',
                2000,
                'Security Tester',
                2000,
                'Ethical Hacker',
                2000,
                'OSINT Researcher',
                2000,
                'Bug Bounty Hunter',
                2000,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
              className="text-cyber-cyan"
            />
            <span className="inline-block w-0.5 h-6 bg-cyber-cyan animate-blink">_</span>
          </div>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-cyber-muted text-base sm:text-lg max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed"
        >
          {siteConfig.description}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#projects" onClick={(e) => { e.preventDefault(); document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }) }} className="btn-primary text-base flex items-center gap-2 group">
            <span>View Projects</span>
            <FiArrowDown className="group-hover:translate-y-1 transition-transform" />
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-cyber-muted/50"
        >
          <span className="text-xs font-mono">scroll</span>
          <FiArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  )
}
