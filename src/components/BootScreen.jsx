import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const bootMessages = [
  { text: '> Initializing security protocols...', delay: 200 },
  { text: '> Loading encryption modules...', delay: 600 },
  { text: '> Scanning network interfaces...', delay: 1000 },
  { text: '> Verifying system integrity...', delay: 1400 },
  { text: '> Establishing secure connection...', delay: 1800 },
  { text: '> Loading cybersecurity dashboard...', delay: 2200 },
  { text: '> System ready.', delay: 2600, color: '#00ff88' },
]

export default function BootScreen({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [done, setDone] = useState(false)
  const [progress, setProgress] = useState(0)
  const skipRef = useRef(false)
  const doneTimer = useRef(null)

  const finish = useCallback(() => {
    if (skipRef.current) return
    skipRef.current = true
    setDone(true)
    doneTimer.current = setTimeout(() => onComplete(), 600)
  }, [onComplete])

  useEffect(() => () => clearTimeout(doneTimer.current), [])

  useEffect(() => {
    // Timers must be cleared on unmount, otherwise StrictMode's double-invoke
    // in development queues every boot line twice.
    const timers = bootMessages.map(({ text, delay }, i) =>
      setTimeout(() => {
        if (skipRef.current) return
        setVisibleLines(prev => (prev.includes(text) ? prev : [...prev, text]))
        setProgress(Math.round(((i + 1) / bootMessages.length) * 100))
      }, delay)
    )
    timers.push(setTimeout(() => {
      if (!skipRef.current) finish()
    }, 3200))

    return () => timers.forEach(clearTimeout)
  }, [finish])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [finish])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          onClick={finish}
          className="boot-screen fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--bg-primary)' }}
        >
          {/* Scan lines overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.1) 2px, rgba(0,212,255,0.1) 4px)',
            }}
          />

          <div className="relative w-full max-w-lg mx-4">
            {/* Terminal Window */}
            <div className="rounded-xl overflow-hidden border border-cyber-cyan/30 shadow-[0_0_60px_rgba(0,212,255,0.15)] boot-terminal"
              style={{ background: 'rgb(var(--cyber-black) / 0.95)' }}
            >
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-cyber-border boot-header"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-auto text-xs font-mono" style={{ color: 'var(--text-muted)' }}>root@prince:~</span>
              </div>

              {/* Terminal Body */}
              <div className="p-6 min-h-[260px] font-mono text-sm">
                {/* Logo */}
                <div className="mb-6 text-center">
                  <span className="text-2xl font-bold tracking-wider"
                    style={{
                      fontFamily: 'Orbitron, sans-serif',
                      color: 'var(--accent)',
                      textShadow: '0 0 20px rgba(var(--accent-rgb), 0.5), 0 0 40px rgba(var(--accent-rgb), 0.2)',
                    }}
                  >
                    PRINCE
                  </span>
                  <span className="block text-xs mt-1 tracking-[3px] uppercase" style={{ color: 'var(--text-muted)' }}>
                    Cybersecurity Dashboard
                  </span>
                </div>

                {/* Boot Lines */}
                <div className="space-y-1.5">
                  {visibleLines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs"
                      style={{ color: line === bootMessages[bootMessages.length - 1].text ? '#00ff88' : 'var(--accent)' }}
                    >
                      {line}
                    </motion.div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span>LOADING</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                      background: 'linear-gradient(90deg, var(--accent), #00ff88)',
                      boxShadow: '0 0 10px rgba(var(--accent-rgb), 0.5)',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Blinking Cursor */}
                <div className="mt-4 text-xs text-cyber-cyan">
                  <span className="animate-blink">_</span>
                  <span className="ml-2" style={{ color: 'var(--text-muted)' }}>click or press any key to skip</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
