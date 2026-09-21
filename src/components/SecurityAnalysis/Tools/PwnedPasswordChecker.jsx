import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

async function sha1(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

export default function PwnedPasswordChecker({ onAnalysis }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleCheck = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const hash = await sha1(input)
      const prefix = hash.substring(0, 5)
      const suffix = hash.substring(5)

      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' }
      })

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`)
      }

      const text = await res.text()
      const lines = text.split('\n')
      let count = 0

      for (const line of lines) {
        const [hashSuffix, occurrences] = line.split(':')
        if (hashSuffix.trim() === suffix) {
          count = parseInt(occurrences.trim(), 10)
          break
        }
      }

      setResult({ count, hash, message: 'Your password never left your browser — only the first 5 SHA-1 characters were sent (k-anonymity).' })
      onAnalysis({ tool: 'Pwned Password Check', riskLevel: count > 0 ? 'high' : 'low', target: count > 0 ? `found ${count} times` : 'not found' })
    } catch (err) {
      setResult({ count: -1, error: true, message: `Network error: ${err.message}. Could not reach the API — this does NOT mean your password is safe.` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">Pwned Password Check</h3>
      <p className="text-sm text-cyber-muted mb-8">Check if a password has appeared in known data breaches using the k-anonymity model.</p>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
        <div className="relative flex-1">
          <input
            type={showPassword ? 'text' : 'password'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            placeholder="Enter a password to check..."
            className="input-field w-full pr-10"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan transition-colors"
          >
            {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        </div>
        <button onClick={handleCheck} disabled={loading || !input.trim()} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-40 shrink-0">
          {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiLock className="w-4 h-4" />}
          Check
        </button>
      </div>
      <p className="text-[10px] text-cyber-muted/70 mb-8 font-mono">Only the first 5 characters of the SHA-1 hash are sent. The password never leaves your browser.</p>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {result.error ? (
            <div className="p-4 rounded-xl bg-cyber-orange/10 border border-cyber-orange/30 flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 text-cyber-orange flex-shrink-0 mt-0.5" />
              <p className="text-sm text-cyber-orange">{result.message}</p>
            </div>
          ) : result.count > 0 ? (
            <>
              <div className="p-4 rounded-xl bg-cyber-red/10 border border-cyber-red/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-cyber-red" />
                  <span className="text-sm font-semibold text-cyber-red">Password found in breaches</span>
                </div>
                <span className="text-2xl font-bold font-mono text-cyber-red">{result.count.toLocaleString()}×</span>
              </div>
              <p className="text-xs text-cyber-red/80">This password has appeared {result.count.toLocaleString()} times in known data breaches. Change it immediately.</p>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-cyber-green/10 border border-cyber-green/30 flex items-center gap-3">
              <FiCheckCircle className="w-5 h-5 text-cyber-green" />
              <span className="text-sm font-semibold text-cyber-green">Not found in any known breach</span>
            </div>
          )}

          {result.hash && (
            <div className="p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider">SHA-1 Hash</span>
              <p className="text-xs text-cyber-text font-mono mt-1 break-all">{result.hash}</p>
            </div>
          )}

          {result.message && (
            <p className="text-[10px] text-cyber-muted text-center font-mono">{result.message}</p>
          )}
        </motion.div>
      )}

      {!result && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiLock className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Enter a password to check against known breaches</p>
        </div>
      )}
    </div>
  )
}
