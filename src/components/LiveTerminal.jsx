import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiPlay, FiPause, FiSkipForward, FiRotateCcw, FiTerminal } from 'react-icons/fi'
import Reveal from './Reveal'

/**
 * An auto-playing recon playbook.
 *
 * The notes are explanations of what each command does — deliberately not
 * invented scan output. The site promises it never shows simulated results, and
 * a terminal printing fake open ports would break that promise.
 */
const PLAYBOOK = [
  {
    cmd: 'nmap -sV -Pn --top-ports 1000 target.example',
    note: 'Service/version sweep over the 1000 most common ports. -Pn skips host discovery for hosts that drop ICMP.',
    tag: 'recon',
  },
  {
    cmd: 'subfinder -d target.example -silent | httpx -sc -title',
    note: 'Passive subdomain enumeration piped into a liveness probe, keeping status codes and page titles.',
    tag: 'recon',
  },
  {
    cmd: 'nuclei -l live-hosts.txt -severity critical,high',
    note: 'Template-driven vulnerability checks, filtered to findings worth waking someone up for.',
    tag: 'scan',
  },
  {
    cmd: 'ffuf -u https://target.example/FUZZ -w wordlist.txt -mc 200,204,301',
    note: 'Content discovery. Matching only meaningful status codes keeps the signal-to-noise ratio usable.',
    tag: 'scan',
  },
  {
    cmd: 'sqlmap -r request.txt --batch --risk 2 --level 3',
    note: 'Replays a captured request to test injection points. Raise risk/level only with written authorisation.',
    tag: 'exploit',
  },
  {
    cmd: 'openssl s_client -connect target.example:443 -servername target.example',
    note: 'Inspects the served certificate chain, negotiated protocol and cipher suite.',
    tag: 'verify',
  },
  {
    cmd: 'testssl.sh --severity HIGH target.example',
    note: 'Audits TLS configuration for weak ciphers, protocol downgrades and known named flaws.',
    tag: 'verify',
  },
  {
    cmd: 'echo "scope: authorised targets only" >> engagement-notes.md',
    note: 'Every engagement starts and ends with documented scope. Out-of-scope testing is not testing, it is trespass.',
    tag: 'report',
  },
]

const TAG_COLORS = {
  recon: '#00d4ff',
  scan: '#f97316',
  exploit: '#ff4757',
  verify: '#00ff88',
  report: '#79c0ff',
}

const TYPE_MS = 28
const HOLD_MS = 2600

export default function LiveTerminal() {
  const [ref, inView] = useInView({ threshold: 0.25, triggerOnce: false })
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState('typing') // typing -> output
  const [playing, setPlaying] = useState(true)
  const [history, setHistory] = useState([])
  const bodyRef = useRef(null)

  const entry = PLAYBOOK[step]
  const running = playing && inView

  // Type the current command one character at a time.
  useEffect(() => {
    if (!running || phase !== 'typing') return
    if (typed.length >= entry.cmd.length) {
      const id = setTimeout(() => setPhase('output'), 260)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setTyped(entry.cmd.slice(0, typed.length + 1)), TYPE_MS)
    return () => clearTimeout(id)
  }, [running, phase, typed, entry])

  // Hold on the explanation, then advance.
  useEffect(() => {
    if (!running || phase !== 'output') return
    const id = setTimeout(() => {
      setHistory((h) => [...h, entry].slice(-3))
      setStep((s) => (s + 1) % PLAYBOOK.length)
      setTyped('')
      setPhase('typing')
    }, HOLD_MS)
    return () => clearTimeout(id)
  }, [running, phase, entry])

  // Keep the newest line in view.
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [typed, phase, history])

  const skip = useCallback(() => {
    setHistory((h) => [...h, PLAYBOOK[step]].slice(-3))
    setStep((s) => (s + 1) % PLAYBOOK.length)
    setTyped('')
    setPhase('typing')
  }, [step])

  const restart = useCallback(() => {
    setHistory([])
    setStep(0)
    setTyped('')
    setPhase('typing')
    setPlaying(true)
  }, [])

  return (
    <section id="playbook" className="section-block py-16 sm:py-24 px-4 relative">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <Reveal className="text-center mb-12">
          <span className="text-cyber-cyan font-mono text-sm">// METHODOLOGY</span>
          <h2 className="section-heading mt-2">Recon Playbook</h2>
          <p className="section-subtitle">How an authorised assessment actually runs, step by step</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-xl overflow-hidden border border-cyber-cyan/20 shadow-[0_0_50px_rgba(var(--accent-rgb),0.06)]">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-cyber-border bg-cyber-dark/60">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs font-mono text-cyber-muted truncate">root@prince:~/engagement</span>

              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="p-1.5 rounded-md text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
                  aria-label={playing ? 'Pause playbook' : 'Play playbook'}
                  title={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <FiPause className="w-3.5 h-3.5" /> : <FiPlay className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={skip}
                  className="p-1.5 rounded-md text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
                  aria-label="Next command"
                  title="Next"
                >
                  <FiSkipForward className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={restart}
                  className="p-1.5 rounded-md text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
                  aria-label="Restart playbook"
                  title="Restart"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              ref={bodyRef}
              className="bg-cyber-black/70 p-4 sm:p-6 h-[320px] sm:h-[300px] overflow-y-auto scrollbar-thin font-mono text-xs sm:text-sm"
            >
              {history.map((h, i) => (
                <div key={`${h.cmd}-${i}`} className="mb-3 opacity-40">
                  <div className="flex gap-2">
                    <span className="text-cyber-green flex-shrink-0">$</span>
                    <span className="text-cyber-text break-anywhere">{h.cmd}</span>
                  </div>
                  <p className="text-cyber-muted mt-1 pl-4 leading-relaxed">{h.note}</p>
                </div>
              ))}

              <div className="mb-3">
                <div className="flex gap-2">
                  <span className="text-cyber-green flex-shrink-0">$</span>
                  <span className="text-cyber-white break-anywhere">
                    {typed}
                    {phase === 'typing' && <span className="animate-blink text-cyber-cyan">▋</span>}
                  </span>
                </div>

                {phase === 'output' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 pl-4 flex items-start gap-2"
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                      style={{
                        color: TAG_COLORS[entry.tag],
                        backgroundColor: `${TAG_COLORS[entry.tag]}15`,
                        border: `1px solid ${TAG_COLORS[entry.tag]}30`,
                      }}
                    >
                      {entry.tag}
                    </span>
                    <p className="text-cyber-muted leading-relaxed">{entry.note}</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-cyber-border bg-cyber-dark/40 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <FiTerminal className="w-3 h-3 text-cyber-muted" />
                <span className="text-[10px] font-mono text-cyber-muted">
                  {step + 1} / {PLAYBOOK.length}
                </span>
              </div>
              <div className="flex-1 min-w-[80px] h-0.5 rounded-full bg-cyber-border/50 overflow-hidden">
                <div
                  className="h-full bg-cyber-cyan/60 transition-[width] duration-300"
                  style={{ width: `${((step + 1) / PLAYBOOK.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-cyber-muted/60">
                reference commands — nothing is executed
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
