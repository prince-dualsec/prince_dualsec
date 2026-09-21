import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiHash, FiAlertTriangle } from 'react-icons/fi'

const HASH_PROFILES = [
  { name: 'MD5', length: 32, charset: 'hex', prefix: null },
  { name: 'NTLM', length: 32, charset: 'hex', prefix: null },
  { name: 'SHA-1', length: 40, charset: 'hex', prefix: null },
  { name: 'RIPEMD-160', length: 40, charset: 'hex', prefix: null },
  { name: 'SHA-224', length: 56, charset: 'hex', prefix: null },
  { name: 'SHA-256', length: 64, charset: 'hex', prefix: null },
  { name: 'SHA-384', length: 96, charset: 'hex', prefix: null },
  { name: 'SHA-512', length: 128, charset: 'hex', prefix: null },
  { name: 'SHA3-256', length: 64, charset: 'hex', prefix: null },
  { name: 'SHA3-512', length: 128, charset: 'hex', prefix: null },
  { name: 'bcrypt', length: null, charset: 'bcrypt', prefix: ['$2a$','$2b$','$2y$'] },
  { name: 'scrypt', length: null, charset: 'base64', prefix: ['$7$'] },
  { name: 'Argon2', length: null, charset: 'argon2', prefix: ['$argon2i$','$argon2d$','$argon2id$'] },
  { name: 'PBKDF2', length: null, charset: 'pbkdf2', prefix: ['$pbkdf2$'] },
  { name: 'md5crypt', length: null, charset: 'md5crypt', prefix: ['$1$'] },
  { name: 'sha256crypt', length: null, charset: 'sha256crypt', prefix: ['$5$'] },
  { name: 'sha512crypt', length: null, charset: 'sha512crypt', prefix: ['$6$'] },
  { name: 'phpass', length: null, charset: 'phpass', prefix: ['$P$','$H$'] },
  { name: 'MySQL5', length: 41, charset: 'hex', prefix: ['*'] },
]

function identifyHash(hash) {
  const trimmed = hash.trim()
  const candidates = []

  for (const profile of HASH_PROFILES) {
    let score = 0
    let reason = ''

    if (profile.prefix) {
      const match = profile.prefix.some(p => trimmed.startsWith(p))
      if (match) {
        score = 95
        reason = `Matches prefix pattern for ${profile.name}`
      } else {
        continue
      }
    } else if (profile.charset === 'hex') {
      if (!/^[0-9a-fA-F]+$/.test(trimmed)) continue
      if (trimmed.length === profile.length) {
        score = 70
        reason = `${trimmed.length} hex characters matches ${profile.name} length`
      } else {
        continue
      }
    }

    if (profile.name === 'MD5' && trimmed.length === 32) {
      score = 60
      reason = '32 hex characters — could be MD5 or NTLM (cannot distinguish)'
    }
    if (profile.name === 'NTLM' && trimmed.length === 32) {
      score = 50
      reason = '32 hex characters — could be NTLM or MD5 (format-based guess)'
    }
    if (profile.name === 'SHA-1' && trimmed.length === 40) {
      score = 70
      reason = '40 hex characters — likely SHA-1 or RIPEMD-160'
    }
    if (profile.name === 'RIPEMD-160' && trimmed.length === 40) {
      score = 40
      reason = '40 hex characters — could be RIPEMD-160 (less common than SHA-1)'
    }
    if (profile.name === 'SHA-256' && trimmed.length === 64) {
      score = 80
      reason = '64 hex characters — likely SHA-256 or SHA3-256'
    }
    if (profile.name === 'SHA3-256' && trimmed.length === 64) {
      score = 40
      reason = '64 hex characters — could be SHA3-256 (less common than SHA-256)'
    }
    if (profile.name === 'SHA-512' && trimmed.length === 128) {
      score = 80
      reason = '128 hex characters — likely SHA-512 or SHA3-512'
    }

    if (score > 0) {
      candidates.push({ name: profile.name, score, reason })
    }
  }

  if (trimmed.startsWith('*') && trimmed.length === 41 && /^[*][0-9a-fA-F]{40}$/.test(trimmed)) {
    candidates.unshift({ name: 'MySQL5', score: 90, reason: 'Starts with * followed by 40 hex characters — MySQL5 password hash' })
  }

  if (candidates.length === 0 && /^[0-9a-fA-F]+$/.test(trimmed)) {
    candidates.push({ name: 'Unknown hex hash', score: 20, reason: `${trimmed.length} hex characters — unrecognized length` })
  }

  if (candidates.length === 0 && trimmed.includes('$') && trimmed.includes('.')) {
    candidates.push({ name: 'Possible bcrypt or similar', score: 60, reason: 'Contains $ and . — characteristic of bcrypt or similar adaptive hash formats' })
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates
}

export default function HashIdentifier({ onAnalysis }) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResults(null)
    await new Promise(r => setTimeout(r, 100))
    try {
      const hashes = input.split(/[\n,;\s]+/).map(h => h.trim()).filter(Boolean)
      const allResults = hashes.map(h => ({ hash: h, candidates: identifyHash(h) }))
      setResults(allResults)
      onAnalysis({ tool: 'Hash Identifier', riskLevel: 'low', target: `${hashes.length} hash(es) identified` })
    } catch {
      setResults([{ hash: input, candidates: [] }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">Hash Identifier</h3>
      <p className="text-sm text-cyber-muted mb-8">Paste one or more hashes to identify their likely type based on length, charset, and prefix patterns.</p>

      <div className="mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"Paste hash(es) to identify, e.g.:\n5f4dcc3b5aa765d61d8327deb882cf99\n$2b$10$N9qo8uLOickgx2ZMRZoMye..."}
          className="input-field w-full min-h-[100px] resize-y font-mono text-sm"
          rows={4}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !input.trim()}
        className="btn-primary flex items-center gap-2 disabled:opacity-40 mb-8"
      >
        {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiHash className="w-4 h-4" />}
        Identify Hashes
      </button>

      <div className="p-3 rounded-lg bg-cyber-orange/5 border border-cyber-orange/20 mb-8 flex items-start gap-2">
        <FiAlertTriangle className="w-4 h-4 text-cyber-orange mt-0.5 shrink-0" />
        <p className="text-xs text-cyber-orange/80">This is a format-based guess only. For example, 32 hex characters could be MD5 or NTLM — they are indistinguishable by format alone.</p>
      </div>

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {results.map((r, i) => (
            <div key={i} className="p-4 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
              <p className="text-xs font-mono text-cyber-cyan mb-3 break-all">{r.hash}</p>
              {r.candidates.length > 0 ? (
                <div className="space-y-2">
                  {r.candidates.map((c, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                        c.score >= 80 ? 'bg-cyber-green/20 text-cyber-green' :
                        c.score >= 50 ? 'bg-cyber-orange/20 text-cyber-orange' :
                        'bg-cyber-cyan/20 text-cyber-cyan'
                      }`}>{c.score}%</div>
                      <div>
                        <span className="text-xs font-semibold text-cyber-white">{c.name}</span>
                        <p className="text-[10px] text-cyber-muted">{c.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-cyber-muted">No matching hash type found</p>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {!results && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiHash className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Paste hash(es) to identify their type</p>
        </div>
      )}
    </div>
  )
}
