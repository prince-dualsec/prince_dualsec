import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiXCircle, FiShield, FiAlertCircle } from 'react-icons/fi'

const HEADER_CHECKS = [
  { name: 'Strict-Transport-Security', label: 'HSTS', category: 'transport', required: true,
    validate(v) {
      if (!v) return { status: 'missing', recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' }
      const maxAge = v.match(/max-age=(\d+)/)
      const issues = []
      if (!maxAge || parseInt(maxAge[1]) < 31536000) issues.push('max-age should be at least 31536000 (1 year)')
      if (!v.includes('includeSubDomains')) issues.push('Missing includeSubDomains')
      if (!v.includes('preload')) issues.push('Missing preload directive')
      return issues.length ? { status: 'warning', recommendation: issues.join('. ') } : { status: 'good' }
    }
  },
  { name: 'Content-Security-Policy', label: 'CSP', category: 'content', required: true,
    validate(v) {
      if (!v) return { status: 'missing', recommendation: 'Add a Content-Security-Policy header to prevent XSS and data injection.' }
      if (v.includes("'unsafe-inline'") && !v.includes('strict-dynamic')) return { status: 'warning', recommendation: 'CSP contains unsafe-inline without strict-dynamic. Consider nonces or hashes.' }
      if (v.includes('*')) return { status: 'warning', recommendation: 'CSP contains wildcard source. Be more specific.' }
      return { status: 'good' }
    }
  },
  { name: 'X-Frame-Options', label: 'X-Frame-Options', category: 'content', required: true,
    validate(v) {
      if (!v) return { status: 'missing', recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN to prevent clickjacking.' }
      if (!['DENY', 'SAMEORIGIN'].includes(v.trim().toUpperCase())) return { status: 'warning', recommendation: 'X-Frame-Options should be DENY or SAMEORIGIN.' }
      return { status: 'good' }
    }
  },
  { name: 'X-Content-Type-Options', label: 'X-Content-Type-Options', category: 'content', required: true,
    validate(v) {
      if (!v) return { status: 'missing', recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME sniffing.' }
      if (v.trim().toLowerCase() !== 'nosniff') return { status: 'warning', recommendation: 'X-Content-Type-Options should be "nosniff".' }
      return { status: 'good' }
    }
  },
  { name: 'Referrer-Policy', label: 'Referrer-Policy', category: 'privacy', required: true,
    validate(v) {
      if (!v) return { status: 'missing', recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin or similar.' }
      return { status: 'good' }
    }
  },
  { name: 'Permissions-Policy', label: 'Permissions-Policy', category: 'privacy', required: false,
    validate(v) {
      if (!v) return { status: 'warning', recommendation: 'Consider adding Permissions-Policy to restrict browser features.' }
      return { status: 'good' }
    }
  },
  { name: 'Cross-Origin-Opener-Policy', label: 'COOP', category: 'cors', required: false,
    validate(v) {
      if (!v) return { status: 'info', recommendation: 'Consider adding Cross-Origin-Opener-Policy: same-origin for cross-origin isolation.' }
      return { status: 'good' }
    }
  },
  { name: 'Cross-Origin-Embedder-Policy', label: 'COEP', category: 'cors', required: false,
    validate(v) {
      if (!v) return { status: 'info', recommendation: 'Consider adding Cross-Origin-Embedder-Policy: require-corp.' }
      return { status: 'good' }
    }
  },
  { name: 'Cross-Origin-Resource-Policy', label: 'CORP', category: 'cors', required: false,
    validate(v) {
      if (!v) return { status: 'info', recommendation: 'Consider adding Cross-Origin-Resource-Policy: same-origin.' }
      return { status: 'good' }
    }
  },
]

const COOKIE_FLAGS = [
  { name: 'Secure', label: 'Secure', fix: 'Add Secure flag to Set-Cookie' },
  { name: 'HttpOnly', label: 'HttpOnly', fix: 'Add HttpOnly flag to Set-Cookie' },
  { name: 'SameSite', label: 'SameSite', fix: 'Add SameSite=Lax or SameSite=Strict to Set-Cookie' },
]

const LEAK_HEADERS = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version', 'x-runtime']

function parseHeaders(raw) {
  const lines = raw.split(/\r?\n/)
  const headers = {}
  let currentKey = null
  for (const line of lines) {
    if (/^\s/.test(line) && currentKey) {
      headers[currentKey] += ', ' + line.trim()
    } else {
      const match = line.match(/^([^:]+):\s*(.*)/)
      if (match) {
        currentKey = match[1].trim()
        headers[currentKey.toLowerCase()] = match[2].trim()
      }
    }
  }
  return headers
}

export default function HttpHeadersAnalyzer({ onAnalysis }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    await new Promise(r => setTimeout(r, 100))
    try {
      const headers = parseHeaders(input)
      const findings = []
      let score = 100

      for (const check of HEADER_CHECKS) {
        const val = headers[check.name.toLowerCase()]
        const result = check.validate(val)
        findings.push({ ...result, name: check.name, label: check.label })
        if (result.status === 'missing') score -= check.required ? 12 : 3
        if (result.status === 'warning') score -= 5
      }

      const cookies = headers['set-cookie'] || ''
      if (cookies) {
        const cookieParts = cookies.split(/,(?=\s*\w+=)/)
        for (const cookie of cookieParts) {
          for (const flag of COOKIE_FLAGS) {
            if (!cookie.toLowerCase().includes(flag.name.toLowerCase())) {
              findings.push({ status: 'warning', name: 'Set-Cookie', label: `Cookie missing ${flag.label}`, recommendation: flag.fix })
              score -= 5
            }
          }
        }
      }

      const leaks = []
      for (const h of LEAK_HEADERS) {
        if (headers[h]) {
          leaks.push({ header: h, value: headers[h] })
          score -= 3
        }
      }
      if (leaks.length > 0) {
        findings.push({ status: 'warning', name: 'Information Leak', label: `${leaks.length} server-identifying header(s)`, recommendation: `Remove: ${leaks.map(l => l.header).join(', ')}. These reveal server technology.` })
      }

      score = Math.max(0, Math.min(100, score))
      setResult({ findings, score, leaks })
      onAnalysis({ tool: 'HTTP Headers Analyzer', riskLevel: score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high', target: 'raw headers' })
    } catch {
      setResult({ findings: [{ status: 'info', name: 'Error', label: 'Parse Error', recommendation: 'Could not parse input as HTTP headers.' }], score: 0, leaks: [] })
    } finally {
      setLoading(false)
    }
  }

  const statusColors = { good: 'text-cyber-green', warning: 'text-cyber-orange', missing: 'text-cyber-red', info: 'text-cyber-muted' }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">HTTP Security Headers Analyzer</h3>
      <p className="text-sm text-cyber-muted mb-8">Paste raw HTTP response headers to audit security configuration. No fetching — purely local analysis.</p>

      <div className="mb-8">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"Paste raw response headers, e.g.:\nHTTP/1.1 200 OK\nContent-Type: text/html\nStrict-Transport-Security: max-age=31536000\nX-Content-Type-Options: nosniff"}
          className="input-field w-full min-h-[140px] resize-y font-mono text-sm"
          rows={6}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !input.trim()}
        className="btn-primary flex items-center gap-2 disabled:opacity-40 mb-8"
      >
        {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiShield className="w-4 h-4" />}
        Analyze Headers
      </button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className={`p-4 rounded-xl flex items-center justify-between ${
            result.score >= 70 ? 'bg-cyber-green/10 border border-cyber-green/30' :
            result.score >= 40 ? 'bg-cyber-orange/10 border border-cyber-orange/30' :
            'bg-cyber-red/10 border border-cyber-red/30'
          }`}>
            <span className="text-sm font-semibold text-cyber-white">Security Score</span>
            <span className={`text-2xl font-bold font-mono ${
              result.score >= 70 ? 'text-cyber-green' : result.score >= 40 ? 'text-cyber-orange' : 'text-cyber-red'
            }`}>{result.score}/100</span>
          </div>

          <div className="space-y-2">
            {result.findings.map((f, i) => (
              <div key={i} className={`p-3 rounded-lg border ${
                f.status === 'good' ? 'bg-cyber-green/5 border-cyber-green/20' :
                f.status === 'missing' ? 'bg-cyber-red/5 border-cyber-red/20' :
                f.status === 'warning' ? 'bg-cyber-orange/5 border-cyber-orange/20' :
                'bg-cyber-dark/50 border border-cyber-border/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {f.status === 'good' ? <FiCheckCircle className="w-4 h-4 text-cyber-green" /> :
                     f.status === 'missing' ? <FiXCircle className="w-4 h-4 text-cyber-red" /> :
                     f.status === 'warning' ? <FiAlertTriangle className="w-4 h-4 text-cyber-orange" /> :
                     <FiAlertCircle className="w-4 h-4 text-cyber-muted" />}
                    <span className={`text-sm font-mono ${statusColors[f.status]}`}>{f.label || f.name}</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider ${statusColors[f.status]}`}>{f.status}</span>
                </div>
                {f.recommendation && <p className="text-xs text-cyber-muted mt-1.5 ml-6">{f.recommendation}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!result && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiShield className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Paste raw HTTP response headers to analyze</p>
        </div>
      )}
    </div>
  )
}
