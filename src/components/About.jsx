import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import CountUp from './CountUp'
import { FaNetworkWired, FaLinux, FaSearch, FaShieldAlt, FaLock, FaTerminal } from 'react-icons/fa'
import { siteConfig } from '../config/site'
import { assetUrl } from '../utils/assetUrl'

const highlights = [
  { icon: FaShieldAlt, label: "Security Testing", color: "#00d4ff" },
  { icon: FaSearch, label: "OSINT Research", color: "#00ff88" },
  { icon: FaNetworkWired, label: "Networking", color: "#f97316" },
  { icon: FaLinux, label: "Linux Proficiency", color: "#79c0ff" },
  { icon: FaTerminal, label: "Scripting", color: "#00d4ff" },
  { icon: FaLock, label: "Cryptography", color: "#ff4757" },
]

export default function About() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section id="about" className="section-block py-16 sm:py-24 px-4 relative">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-cyber-cyan font-mono text-sm">// ABOUT ME</span>
          <h2 className="section-heading mt-2">About Me</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-cyber-cyan to-cyber-blue mx-auto mt-4 rounded-full" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left - Avatar & Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-8">
              <div className="rounded-2xl bg-cyber-dark border-2 border-cyber-cyan/20 relative overflow-hidden group" style={{ width: 'clamp(200px, 40vw, 256px)', aspectRatio: '4 / 5' }}>
                <img
                  src={assetUrl(siteConfig.profileImage)}
                  alt={`Portrait of ${siteConfig.name}`}
                  width="825"
                  height="1024"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 border-2 border-cyber-cyan/10 rounded-2xl group-hover:border-cyber-cyan/30 transition-all duration-500 pointer-events-none" />
                {/* Corner accents */}
                <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-cyber-cyan/40" />
                <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-cyber-cyan/40" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-cyber-cyan/40" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-cyber-cyan/40" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 text-center w-full">
              {[
                { value: 5, suffix: "+", label: "Years\nExperience" },
                { value: 20, suffix: "+", label: "Projects\nCompleted" },
                { value: 100, suffix: "+", label: "Vulnerabilities\nFound" },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-2 sm:p-4">
                  <div className="text-2xl font-bold text-cyber-cyan font-mono">
                    <CountUp value={stat.value} suffix={stat.suffix} active={inView} />
                  </div>
                  <div className="text-xs text-cyber-muted mt-1 whitespace-pre-line">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right - Bio */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="glass-card p-5 sm:p-8">
              <div className="font-mono text-sm text-cyber-muted mb-6">
                <span className="text-cyber-cyan">class</span> <span className="text-cyber-green">CybersecurityExpert</span> {'{'}
              </div>

              <div className="space-y-4 text-cyber-text leading-relaxed pl-3 sm:pl-4 border-l border-cyber-border">
                <p>
                  I'm a passionate cybersecurity professional with a deep commitment to securing digital landscapes.
                  My expertise spans <span className="text-cyber-cyan">penetration testing</span>,
                  <span className="text-cyber-green"> web application security</span>,
                  <span className="text-cyber-purple"> OSINT research</span>, and
                  <span className="text-cyber-orange"> network security</span>.
                </p>
                <p>
                  I thrive on identifying vulnerabilities before malicious actors can exploit them.
                  From bug bounty hunting to security research, I'm always exploring new attack vectors
                  and defense mechanisms to stay ahead of evolving threats.
                </p>
                <p>
                  My toolkit includes <span className="text-cyber-cyan">Kali Linux</span>,
                  <span className="text-cyber-green"> Burp Suite</span>,
                  <span className="text-cyber-purple"> Nmap</span>, and custom scripts
                  I've developed for specialized security assessments.
                </p>
              </div>

              <div className="font-mono text-sm text-cyber-muted mt-6">
                {'}'}
              </div>
            </div>

            {/* Highlight Tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              {highlights.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-dark/50 border border-cyber-border/50"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                  <span className="text-xs xs:text-sm text-cyber-text min-w-0">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
