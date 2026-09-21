import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiLock, FiCheckCircle, FiXCircle, FiLoader, FiAlertTriangle, FiShield } from 'react-icons/fi'
import { checkPasswordBreach } from '../../../services/security'

const checks = [
  { label: 'Length (8+ chars)', test: (p) => p.length >= 8 },
  { label: 'Length (12+ chars)', test: (p) => p.length >= 12 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
  { label: 'No common patterns', test: (p) => !/(.)\1{2,}|123|abc|password|qwerty/i.test(p) },
  { label: 'No keyboard sequences', test: (p) => !/qwer|asdf|zxcv|1234|abcd/i.test(p) },
]

function calcScore(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score += 15
  if (password.length >= 12) score += 15
  if (password.length >= 16) score += 10
  if (/[A-Z]/.test(password)) score += 15
  if (/[a-z]/.test(password)) score += 10
  if (/[0-9]/.test(password)) score += 15
  if (/[^A-Za-z0-9]/.test(password)) score += 20
  if (!/(.)\1{2,}/.test(password)) score += 5
  if (!/password|qwerty|123456|admin/i.test(password)) score += 5
  return Math.min(100, score)
}

function getStrength(score) {
  if (score >= 80) return { label: 'Strong', color: '#00ff88', bg: 'bg-cyber-green/10 border-cyber-green/30' }
  if (score >= 60) return { label: 'Moderate', color: '#f97316', bg: 'bg-cyber-orange/10 border-cyber-orange/30' }
  if (score >= 40) return { label: 'Weak', color: '#ff4757', bg: 'bg-cyber-red/10 border-cyber-red/30' }
  return { label: 'Very Weak', color: '#ff4757', bg: 'bg-cyber-red/10 border-cyber-red/30' }
}

function calcEntropy(password) {
  if (!password) return 0
  let charsetSize = 0
  if (/[a-z]/.test(password)) charsetSize += 26
  if (/[A-Z]/.test(password)) charsetSize += 26
  if (/[0-9]/.test(password)) charsetSize += 10
  if (/[^A-Za-z0-9]/.test(password)) charsetSize += 33
  if (charsetSize === 0) return 0
  return Math.round(password.length * Math.log2(charsetSize) * 100) / 100
}

function getCharAnalysis(password) {
  if (!password) return { lowercase: 0, uppercase: 0, digits: 0, special: 0, spaces: 0, total: 0 }
  return {
    lowercase: (password.match(/[a-z]/g) || []).length,
    uppercase: (password.match(/[A-Z]/g) || []).length,
    digits: (password.match(/[0-9]/g) || []).length,
    special: (password.match(/[^A-Za-z0-9]/g) || []).length,
    spaces: (password.match(/\s/g) || []).length,
    total: password.length,
  }
}

function estimateCrackTime(password) {
  if (!password) return 'Instant'
  let charset = 0
  if (/[a-z]/.test(password)) charset += 26
  if (/[A-Z]/.test(password)) charset += 26
  if (/[0-9]/.test(password)) charset += 10
  if (/[^A-Za-z0-9]/.test(password)) charset += 33
  if (charset === 0) return 'Instant'
  const combinations = Math.pow(charset, password.length)
  const guessesPerSecond = 1e10
  const seconds = combinations / guessesPerSecond / 2
  if (seconds < 1) return 'Instant'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`
  if (seconds < 31536000 * 1000) return `${Math.round(seconds / 31536000)} years`
  if (seconds < 31536000 * 1e6) return `${Math.round(seconds / 31536000 / 1000)}k years`
  if (seconds < 31536000 * 1e9) return `${Math.round(seconds / 31536000 / 1e6)}M years`
  return `${(seconds / 31536000 / 1e9).toExponential(1)} billion years`
}

export default function PasswordAnalyzer({ onAnalysis }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [breach, setBreach] = useState(null)
  const [breachLoading, setBreachLoading] = useState(false)

  const score = useMemo(() => calcScore(password), [password])
  const strength = useMemo(() => getStrength(score), [score])
  const crackTime = useMemo(() => estimateCrackTime(password), [password])
  const entropy = useMemo(() => calcEntropy(password), [password])
  const charAnalysis = useMemo(() => getCharAnalysis(password), [password])
  const passedChecks = useMemo(() => checks.filter(c => c.test(password)).length, [password])

  // Breach lookup uses HIBP's k-anonymity range API through the backend: only
  // the first five characters of the SHA-1 hash ever leave this machine.
  const runBreachCheck = useCallback(async () => {
    if (!password) return
    setBreachLoading(true)
    setBreach(null)
    try {
      const data = await checkPasswordBreach(password)
      setBreach(data)
      if (data.status !== 'error') {
        onAnalysis?.({
          tool: 'Password Strength',
          riskLevel: data.status === 'pwned' ? 'high' : 'low',
          target: 'Password analysed locally',
        })
      }
    } catch {
      setBreach({ status: 'error', message: 'Unexpected error during breach lookup.' })
    } finally {
      setBreachLoading(false)
    }
  }, [password, onAnalysis])

  // A stale verdict from a previous password would be misleading.
  useEffect(() => { setBreach(null) }, [password])

  const charColors = {
    lowercase: '#00d4ff',
    uppercase: '#00ff88',
    digits: '#f97316',
    special: '#ff4757',
    spaces: '#79c0ff',
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">Password Strength Analyzer</h3>
      <p className="text-sm text-cyber-muted mb-8">Analyze password strength entirely in your browser. Nothing is stored or transmitted.</p>

      <div className="relative mb-8">
        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password to analyze..."
          className="input-field pl-10 pr-20"
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyber-muted hover:text-cyber-cyan transition-colors"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      {password && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Score Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-muted">Strength Score</span>
              <span className="text-sm font-bold font-mono" style={{ color: strength.color }}>{score}/100</span>
            </div>
            <div className="h-3 bg-cyber-dark rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: strength.color }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${strength.bg} border`} style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
            {/* Estimated Crack Time */}
            <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg border" style={{ backgroundColor: `${strength.color}10`, borderColor: `${strength.color}30` }}>
              <span className="text-xs text-cyber-muted font-mono uppercase tracking-wider">Estimated crack time</span>
              <span className="text-sm font-bold font-mono" style={{ color: strength.color }}>{crackTime}</span>
            </div>
          </div>

          {/* Entropy */}
          <div className="p-4 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider">Estimated Entropy</span>
              <span className="text-sm font-bold font-mono text-cyber-cyan">{entropy} bits</span>
            </div>
            <div className="mt-2 h-2 bg-cyber-dark rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (entropy / 100) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-cyber-cyan"
              />
            </div>
            <p className="text-[10px] text-cyber-muted mt-2">
              {entropy >= 60 ? 'High entropy — strong randomness' : entropy >= 40 ? 'Moderate entropy — could be stronger' : 'Low entropy — easily guessable'}
            </p>
          </div>

          {/* Character Composition */}
          <div className="p-4 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
            <span className="text-[10px] text-cyber-muted uppercase tracking-wider block mb-3">Character Composition</span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 gap-y-4">
              {[
                { label: 'Lowercase', value: charAnalysis.lowercase, color: charColors.lowercase },
                { label: 'Uppercase', value: charAnalysis.uppercase, color: charColors.uppercase },
                { label: 'Digits', value: charAnalysis.digits, color: charColors.digits },
                { label: 'Special', value: charAnalysis.special, color: charColors.special },
                { label: 'Spaces', value: charAnalysis.spaces, color: charColors.spaces },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-lg font-bold font-mono" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[10px] text-cyber-muted">{item.label}</p>
                  {charAnalysis.total > 0 && (
                    <div className="mt-1 h-1 bg-cyber-dark rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(item.value / charAnalysis.total) * 100}%`, backgroundColor: item.color }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Breach Lookup */}
          <div className="p-4 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[10px] text-cyber-muted uppercase tracking-wider block">Breach Corpus Lookup</span>
                <p className="text-[10px] text-cyber-muted/70 mt-1">
                  Uses k-anonymity — only the first 5 characters of the SHA-1 hash are sent.
                </p>
              </div>
              <button
                onClick={runBreachCheck}
                disabled={breachLoading}
                className="btn-secondary !px-4 !py-2 text-xs flex items-center gap-2 disabled:opacity-40"
              >
                {breachLoading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiShield className="w-3.5 h-3.5" />}
                {breachLoading ? 'Checking...' : 'Check if breached'}
              </button>
            </div>

            {breach && (
              <div className="mt-4">
                {breach.status === 'error' ? (
                  <div className="p-3 rounded-lg bg-cyber-orange/10 border border-cyber-orange/30 flex items-start gap-2">
                    <FiAlertTriangle className="w-4 h-4 text-cyber-orange flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-cyber-muted">{breach.message}</p>
                  </div>
                ) : breach.status === 'pwned' ? (
                  <div className="p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 flex items-start gap-2">
                    <FiXCircle className="w-4 h-4 text-cyber-red flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-cyber-red">
                        Found in breach data {breach.count?.toLocaleString()} time{breach.count === 1 ? '' : 's'}
                      </p>
                      <p className="text-[10px] text-cyber-muted mt-1">Do not use this password anywhere.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-cyber-green/10 border border-cyber-green/30 flex items-start gap-2">
                    <FiCheckCircle className="w-4 h-4 text-cyber-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-cyber-green">Not found in known breach data</p>
                      <p className="text-[10px] text-cyber-muted mt-1">Absence from the corpus does not make a weak password safe.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checks.map((check, i) => {
              const passed = check.test(password)
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {passed ? (
                    <FiCheckCircle className="w-3.5 h-3.5 text-cyber-green flex-shrink-0" />
                  ) : (
                    <FiXCircle className="w-3.5 h-3.5 text-cyber-red flex-shrink-0" />
                  )}
                  <span className={passed ? 'text-cyber-green' : 'text-cyber-red'}>{check.label}</span>
                </div>
              )
            })}
          </div>

          <div className="text-xs text-cyber-muted text-center font-mono">
            {passedChecks}/{checks.length} checks passed
          </div>
        </motion.div>
      )}

      {!password && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiLock className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Type a password to see analysis</p>
        </div>
      )}
    </div>
  )
}
