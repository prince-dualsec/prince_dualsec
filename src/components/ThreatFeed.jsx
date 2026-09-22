import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiActivity, FiPause, FiPlay, FiRefreshCw, FiExternalLink, FiAlertTriangle } from 'react-icons/fi'
import { getCVEFeed } from '../services/security'
import Reveal from './Reveal'
import CountUp from './CountUp'

const SEVERITY = {
  CRITICAL: { color: '#ff4757', label: 'Critical' },
  HIGH: { color: '#f97316', label: 'High' },
  MEDIUM: { color: '#f5c518', label: 'Medium' },
  LOW: { color: '#00ff88', label: 'Low' },
  UNSCORED: { color: '#8b949e', label: 'Unscored' },
  NONE: { color: '#8b949e', label: 'Unscored' },
}

const REFRESH_MS = 5 * 60 * 1000 // the server caches for 15 min; this just re-reads
const ROTATE_MS = 4000

function severityOf(key) {
  return SEVERITY[key] || SEVERITY.UNSCORED
}

function timeAgo(iso) {
  if (!iso) return 'unknown'
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return 'unknown'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ThreatFeed() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: false })
  const [feed, setFeed] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [pulse, setPulse] = useState(0)
  const mounted = useRef(true)

  // Must be re-armed on every mount, not just initialised once: StrictMode
  // runs the cleanup between its two development mounts, and a ref that is
  // never set back to true leaves every later response discarded — the feed
  // sits on "Connecting" for ever.
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const load = useCallback(async () => {
    const data = await getCVEFeed()
    if (!mounted.current) return
    if (data.status === 'error') {
      setError(data.message)
    } else {
      setError(null)
      setFeed(data)
      setPulse((p) => p + 1)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Periodic refresh, paused while the section is off screen so a background
  // tab is not polling the backend for nothing.
  useEffect(() => {
    if (!inView || !playing) return
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [inView, playing, load])

  // Rotate the highlighted entry — the "live ticker" motion.
  useEffect(() => {
    if (!playing || !inView || !feed?.items?.length) return
    const id = setInterval(() => {
      setCursor((c) => (c + 1) % feed.items.length)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [playing, inView, feed])

  const items = feed?.items || []
  const active = items[cursor]
  const counts = feed?.counts || {}
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

  return (
    <section id="threat-feed" className="section-block py-16 sm:py-24 px-4 relative">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <Reveal className="text-center mb-8 sm:mb-12">
          <span className="text-cyber-cyan font-mono text-sm">// LIVE INTELLIGENCE</span>
          <h2 className="section-heading mt-2">Live Threat Feed</h2>
          <p className="section-subtitle">
            Real vulnerability disclosures from the NVD, refreshed automatically
          </p>
        </Reveal>

        {/* Status bar */}
        <Reveal delay={0.1}>
          <div className="glass-card px-4 sm:px-6 py-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2.5 h-2.5">
                {!error && playing && (
                  <span className="absolute inset-0 rounded-full bg-cyber-green animate-ping opacity-60" />
                )}
                <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${error ? 'bg-cyber-red' : 'bg-cyber-green'}`} />
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-cyber-muted">
                {error ? 'Feed offline' : loading ? 'Connecting' : playing ? 'Live' : 'Paused'}
              </span>
            </div>

            {feed && (
              <div className="text-xs font-mono text-cyber-muted">
                <span className="text-cyber-cyan font-bold">
                  <CountUp key={pulse} value={feed.totalInWindow} />
                </span>
                {' '}disclosed in the last {feed.windowDays} days
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="p-2 rounded-lg text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
                aria-label={playing ? 'Pause feed' : 'Resume feed'}
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setLoading(true); load() }}
                className="p-2 rounded-lg text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
                aria-label="Refresh feed"
                title="Refresh"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </Reveal>

        {error ? (
          <div className="glass-card p-6 flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-cyber-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-cyber-orange font-semibold">Live feed unavailable</p>
              <p className="text-xs text-cyber-muted mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            {/* Spotlight */}
            <Reveal from="left" delay={0.15}>
              <div className="glass-card p-5 sm:p-8 h-full relative overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-px opacity-60"
                  style={{ background: `linear-gradient(90deg, transparent, ${severityOf(active?.severity).color}, transparent)` }}
                />
                <div className="flex items-center gap-2 mb-5">
                  <FiActivity className="w-4 h-4 text-cyber-cyan" />
                  <span className="text-[10px] font-mono uppercase tracking-[2px] text-cyber-muted">
                    Now showing {items.length ? cursor + 1 : 0} / {items.length}
                  </span>
                </div>

                <div className="min-h-[190px]">
                  <AnimatePresence mode="wait">
                    {active && (
                      <motion.div
                        key={active.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span
                            className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider"
                            style={{
                              color: severityOf(active.severity).color,
                              backgroundColor: `${severityOf(active.severity).color}15`,
                              border: `1px solid ${severityOf(active.severity).color}35`,
                            }}
                          >
                            {severityOf(active.severity).label}
                          </span>
                          {active.score !== null && (
                            <span className="text-2xl font-bold font-mono" style={{ color: severityOf(active.severity).color }}>
                              {active.score.toFixed(1)}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-cyber-muted/70 ml-auto">
                            {timeAgo(active.published)}
                          </span>
                        </div>

                        <a
                          href={active.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-lg font-bold font-mono text-cyber-white hover:text-cyber-cyan transition-colors break-anywhere"
                        >
                          {active.id}
                          <FiExternalLink className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                        </a>

                        <p className="text-sm text-cyber-muted leading-relaxed mt-3">
                          {active.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Progress rail for the rotation */}
                {playing && items.length > 0 && (
                  <div className="mt-5 h-0.5 rounded-full bg-cyber-border/40 overflow-hidden">
                    <motion.div
                      key={`${cursor}-${pulse}`}
                      className="h-full bg-cyber-cyan/70"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: ROTATE_MS / 1000, ease: 'linear' }}
                    />
                  </div>
                )}
              </div>
            </Reveal>

            {/* Severity breakdown + queue */}
            <Reveal from="right" delay={0.2}>
              <div className="space-y-4">
                <div className="glass-card p-5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyber-muted block mb-3">
                    Severity mix (sample)
                  </span>
                  <div className="space-y-2.5">
                    {order.map((key) => {
                      const total = order.reduce((n, k) => n + (counts[k] || 0), 0) || 1
                      const value = counts[key] || 0
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-[11px] font-mono mb-1">
                            <span style={{ color: severityOf(key).color }}>{severityOf(key).label}</span>
                            <span className="text-cyber-muted">{value}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-cyber-border/40 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: severityOf(key).color }}
                              initial={{ width: 0 }}
                              animate={{ width: inView ? `${(value / total) * 100}%` : 0 }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="glass-card p-2 max-h-[260px] overflow-y-auto scrollbar-thin">
                  {items.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => { setCursor(i); setPlaying(false) }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors ${
                        i === cursor ? 'bg-cyber-cyan/10' : 'hover:bg-cyber-dark/50'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: severityOf(item.severity).color }}
                      />
                      <span className={`text-[11px] font-mono truncate ${i === cursor ? 'text-cyber-cyan' : 'text-cyber-muted'}`}>
                        {item.id}
                      </span>
                      {item.score !== null && (
                        <span className="text-[11px] font-mono ml-auto flex-shrink-0" style={{ color: severityOf(item.severity).color }}>
                          {item.score.toFixed(1)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {feed?.stale && (
          <p className="text-[11px] font-mono text-cyber-orange/70 mt-4 text-center">
            // Showing the last successful fetch — NVD is not responding right now.
          </p>
        )}
      </div>
    </section>
  )
}
