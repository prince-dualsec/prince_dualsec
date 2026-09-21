import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  FaShieldAlt, FaBug, FaLock, FaExclamationTriangle, FaFileAlt, FaGlobe
} from 'react-icons/fa'
import {
  FiArrowLeft, FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiTerminal, FiHash,
  FiLink, FiMail, FiKey, FiLock as FiLockIcon, FiShield, FiSearch
} from 'react-icons/fi'
import PasswordAnalyzer from './Tools/PasswordAnalyzer'
import ReportGenerator from './Tools/ReportGenerator'
import PhishingUrlAnalyzer from './Tools/PhishingUrlAnalyzer'
import EmailAuthChecker from './Tools/EmailAuthChecker'
import EmailHeaderAnalyzer from './Tools/EmailHeaderAnalyzer'
import HttpHeadersAnalyzer from './Tools/HttpHeadersAnalyzer'
import CspEvaluator from './Tools/CspEvaluator'
import JwtInspector from './Tools/JwtInspector'
import PwnedPasswordChecker from './Tools/PwnedPasswordChecker'
import LogAttackDetector from './Tools/LogAttackDetector'
import DnssecCaaChecker from './Tools/DnssecCaaChecker'
import HashIdentifier from './Tools/HashIdentifier'
import Logo from '../Logo'

const tools = [
  { id: 'password', name: 'Password Strength', icon: FaShieldAlt, color: '#00ff88', description: 'Analyze password strength, entropy, and character composition', component: PasswordAnalyzer },
  { id: 'phishing', name: 'Phishing URL Analyzer', icon: FiLink, color: '#ff4757', description: 'Heuristic static analysis of URLs for phishing indicators', component: PhishingUrlAnalyzer },
  { id: 'emailauth', name: 'Email Auth Checker', icon: FiMail, color: '#00ff88', description: 'Check SPF, DMARC, and DKIM records for a domain', component: EmailAuthChecker },
  { id: 'emailheader', name: 'Email Header Analyzer', icon: FiMail, color: '#f97316', description: 'Analyze raw email headers for anomalies and auth results', component: EmailHeaderAnalyzer },
  { id: 'httpheaders', name: 'HTTP Headers Analyzer', icon: FiShield, color: '#00d4ff', description: 'Audit raw HTTP response headers for security misconfigurations', component: HttpHeadersAnalyzer },
  { id: 'csp', name: 'CSP Evaluator', icon: FiShield, color: '#79c0ff', description: 'Evaluate Content-Security-Policy for weaknesses and bypasses', component: CspEvaluator },
  { id: 'jwt', name: 'JWT Inspector', icon: FiKey, color: '#f97316', description: 'Decode and inspect JSON Web Tokens for security issues', component: JwtInspector },
  { id: 'pwned', name: 'Pwned Password Check', icon: FiLockIcon, color: '#ff4757', description: 'Check passwords against known breaches (k-anonymity)', component: PwnedPasswordChecker },
  { id: 'logdetect', name: 'Log Attack Detector', icon: FiTerminal, color: '#79c0ff', description: 'Detect brute force, web attacks, and scanners in logs', component: LogAttackDetector },
  { id: 'dnsseccaa', name: 'DNSSEC & CAA Checker', icon: FaGlobe, color: '#00ff88', description: 'Check DNSSEC signing and CAA certificate authority records', component: DnssecCaaChecker },
  { id: 'hashid', name: 'Hash Identifier', icon: FiSearch, color: '#00d4ff', description: 'Identify hash types by length, charset, and prefix patterns', component: HashIdentifier },
  { id: 'report', name: 'Report Generator', icon: FaFileAlt, color: '#00d4ff', description: 'Generate professional cybersecurity analysis reports', component: ReportGenerator },
]

export default function SecurityAnalysis() {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true })
  const [activeTool, setActiveTool] = useState(null)
  const [analysisHistory, setAnalysisHistory] = useState([])

  const addHistory = useCallback((entry) => {
    setAnalysisHistory(prev => [{ ...entry, timestamp: new Date().toISOString() }, ...prev].slice(0, 20))
  }, [])

  const ActiveComponent = activeTool ? tools.find(t => t.id === activeTool)?.component : null

  return (
    <section id="security-lab" className="section-block py-20 sm:py-32 px-4 relative overflow-hidden">
      {/* Subtle background grid accent */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyber-cyan/10 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyber-cyan/10 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto relative" ref={ref}>
        {/* Header with Logo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          {/* Logo Area */}
          <div className="inline-flex items-center justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl bg-cyber-cyan/5 blur-xl group-hover:bg-cyber-cyan/10 transition-all duration-700" />
              <div className="relative w-20 h-20 rounded-2xl bg-cyber-dark/60 border border-cyber-cyan/20 flex items-center justify-center backdrop-blur-sm group-hover:border-cyber-cyan/40 transition-all duration-500">
                <div className="decor-animated absolute inset-2 rounded-xl border border-cyber-cyan/10 animate-[spin_20s_linear_infinite]" />
                <Logo className="w-9 h-9 text-cyber-cyan/80 group-hover:text-cyber-cyan transition-colors duration-500" />
                <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-cyber-cyan/40" />
                <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyber-cyan/40" />
                <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyber-cyan/40" />
                <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-cyber-cyan/40" />
              </div>
            </div>
          </div>

          <span className="text-cyber-cyan font-mono text-sm tracking-widest">// SECURITY ANALYSIS</span>
          <h2 className="section-heading mt-3 text-4xl md:text-5xl">Security Dashboard</h2>
          <p className="section-subtitle max-w-2xl mx-auto text-lg">Professional security analysis tools and intelligence gathering</p>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyber-cyan/30" />
            <FiTerminal className="w-4 h-4 text-cyber-cyan/40" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyber-cyan/30" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTool && ActiveComponent ? (
            <motion.div
              key="tool-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <button
                onClick={() => setActiveTool(null)}
                className="flex items-center gap-2 text-cyber-muted hover:text-cyber-cyan transition-colors mb-8 font-mono text-sm group"
              >
                <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </button>
              <ActiveComponent onAnalysis={addHistory} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Dashboard Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
                {[
                  { label: 'Tools Available', value: tools.length, color: 'text-cyber-cyan', icon: FaShieldAlt },
                  { label: 'Analyses Run', value: analysisHistory.length, color: 'text-cyber-green', icon: FiTerminal },
                  { label: 'Issues Found', value: analysisHistory.filter(h => h.riskLevel === 'high' || h.riskLevel === 'critical').length, color: 'text-cyber-red', icon: FaBug },
                  { label: 'Status', value: 'Online', color: 'text-cyber-green', icon: FiCheckCircle },
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card lift p-6 text-center group hover:border-cyber-cyan/20 transition-all duration-300"
                    >
                      <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-3 opacity-60`} />
                      <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-cyber-muted mt-2 uppercase tracking-wider">{stat.label}</div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Tool Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tools.map((tool, i) => {
                  const Icon = tool.icon
                  return (
                    <motion.button
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      onClick={() => setActiveTool(tool.id)}
                      className="glass-card lift sheen p-6 text-left group hover:border-cyber-cyan/30 transition-all duration-300 cursor-pointer tool-accent-border"
                      style={{ borderLeftColor: tool.color, '--tool-glow': `${tool.color}25` }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                          style={{ backgroundColor: `${tool.color}15`, border: `1px solid ${tool.color}30` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: tool.color }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-cyber-white group-hover:text-cyber-cyan transition-colors">{tool.name}</h3>
                          <p className="text-xs text-cyber-muted mt-1.5 leading-relaxed">{tool.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Recent Activity */}
              {analysisHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 }}
                  className="mt-12 glass-card p-8"
                >
                  <h3 className="text-sm font-semibold text-cyber-white mb-5 flex items-center gap-2">
                    <FiInfo className="w-4 h-4 text-cyber-cyan" />
                    Recent Analyses
                  </h3>
                  <div className="space-y-3">
                    {analysisHistory.slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-cyber-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          {entry.riskLevel === 'critical' || entry.riskLevel === 'high' ? (
                            <FiXCircle className="w-4 h-4 text-cyber-red" />
                          ) : entry.riskLevel === 'medium' ? (
                            <FiAlertTriangle className="w-4 h-4 text-cyber-orange" />
                          ) : (
                            <FiCheckCircle className="w-4 h-4 text-cyber-green" />
                          )}
                          <span className="text-sm text-cyber-text">{entry.tool}</span>
                        </div>
                        <span className="text-xs text-cyber-muted font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Disclaimer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.6 }}
                className="mt-12 p-5 rounded-xl bg-cyber-orange/5 border border-cyber-orange/20 flex items-start gap-3"
              >
                <FaExclamationTriangle className="w-5 h-5 text-cyber-orange flex-shrink-0 mt-0.5" />
                <div className="text-xs text-cyber-muted leading-relaxed">
                  <span className="text-cyber-orange font-semibold">Disclaimer:</span> All tools run locally in your browser or use free public APIs with no key required.
                  No data is stored or sent to third parties. Network-dependent tools show honest error messages on failure.
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
