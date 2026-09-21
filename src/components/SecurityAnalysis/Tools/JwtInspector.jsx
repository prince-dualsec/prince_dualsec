import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiKey, FiAlertCircle } from 'react-icons/fi'

function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  return decodeURIComponent(atob(padded).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
}

function parseJwt(token) {
  const parts = token.trim().split('.')
  if (parts.length < 2 || parts.length > 3) return null
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    const signature = parts[2] || null
    return { header, payload, signature, raw: token }
  } catch {
    return null
  }
}

async function verifyHs256(token, secret) {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return false
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${parts[0]}.${parts[1]}`))
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return expected === parts[2]
}

export default function JwtInspector({ onAnalysis }) {
  const [input, setInput] = useState('')
  const [secret, setSecret] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    setVerifyResult(null)
    await new Promise(r => setTimeout(r, 100))
    try {
      const parsed = parseJwt(input)
      if (!parsed) {
        setResult({ error: true, message: 'Could not parse JWT. Check the format.' })
        return
      }

      const now = Math.floor(Date.now() / 1000)
      const warnings = []
      const alg = parsed.header.alg

      if (alg === 'none') warnings.push({ severity: 'high', finding: 'alg: "none"', detail: 'This JWT has no signature. Any content can be forged. Never trust a JWT with alg none.' })
      if (!['HS256','HS384','HS512','RS256','RS384','RS512','ES256','ES384','ES512','PS256','PS384','PS512'].includes(alg)) {
        warnings.push({ severity: 'medium', finding: `Unusual algorithm: ${alg}`, detail: 'This algorithm is not commonly used. Verify it is expected.' })
      }
      if (['HS384','HS512'].includes(alg)) warnings.push({ severity: 'low', finding: `Algorithm: ${alg}`, detail: 'Valid but less common. Ensure the server supports it.' })

      if (!parsed.payload.exp) {
        warnings.push({ severity: 'high', finding: 'Missing exp claim', detail: 'No expiration time. This token never expires — a security risk.' })
      } else {
        const expDate = new Date(parsed.payload.exp * 1000)
        const daysUntil = Math.round((parsed.payload.exp - now) / 86400)
        if (parsed.payload.exp < now) {
          warnings.push({ severity: 'high', finding: 'Token expired', detail: `Expired on ${expDate.toISOString()} (${Math.abs(daysUntil)} days ago).` })
        } else {
          if (daysUntil > 365) warnings.push({ severity: 'medium', finding: 'Very long lifetime', detail: `Expires in ${daysUntil} days. Consider shorter token lifetimes.` })
        }
      }

      if (parsed.payload.iat && parsed.payload.exp) {
        const lifetime = Math.round((parsed.payload.exp - parsed.payload.iat) / 86400)
        if (lifetime > 365) warnings.push({ severity: 'medium', finding: 'Long token lifetime', detail: `Token valid for ~${lifetime} days (iat to exp).` })
      }

      const sensitiveKeys = ['password','secret','credit','card','ssn','token','private']
      for (const key of Object.keys(parsed.payload)) {
        if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
          warnings.push({ severity: 'medium', finding: `Sensitive claim: "${key}"`, detail: `The payload contains "${key}" which may be sensitive data.` })
        }
      }

      setResult({ ...parsed, warnings })
      onAnalysis({ tool: 'JWT Inspector', riskLevel: warnings.some(w => w.severity === 'high') ? 'high' : warnings.some(w => w.severity === 'medium') ? 'medium' : 'low', target: alg })
    } catch {
      setResult({ error: true, message: 'Unexpected error during JWT analysis.' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!input.trim() || !secret.trim()) return
    try {
      const ok = await verifyHs256(input.trim(), secret.trim())
      setVerifyResult(ok)
    } catch {
      setVerifyResult(null)
    }
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">JWT Security Inspector</h3>
      <p className="text-sm text-cyber-muted mb-8">Decode and inspect a JSON Web Token. Never sent anywhere — fully local.</p>

      <div className="mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a JWT (eyJhbGciOiJIUzI1NiIs...)..."
          className="input-field w-full min-h-[80px] resize-y font-mono text-sm"
          rows={3}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
        <input
          type="text"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Secret key for HS256 verification (optional)"
          className="input-field flex-1 font-mono text-sm"
        />
        <button onClick={handleVerify} disabled={!input.trim() || !secret.trim()} className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-40 shrink-0">
          <FiKey className="w-4 h-4" /> Verify
        </button>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !input.trim()}
        className="btn-primary flex items-center gap-2 disabled:opacity-40 mb-8"
      >
        {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiKey className="w-4 h-4" />}
        Decode & Inspect
      </button>

      {verifyResult !== null && (
        <div className={`p-3 rounded-lg mb-5 flex items-center gap-2 ${verifyResult ? 'bg-cyber-green/10 border border-cyber-green/30' : 'bg-cyber-red/10 border border-cyber-red/30'}`}>
          {verifyResult ? <FiCheckCircle className="w-4 h-4 text-cyber-green" /> : <FiAlertTriangle className="w-4 h-4 text-cyber-red" />}
          <span className={`text-sm ${verifyResult ? 'text-cyber-green' : 'text-cyber-red'}`}>
            {verifyResult ? 'Signature is VALID for the provided secret' : 'Signature INVALID — does not match the provided secret'}
          </span>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {result.error ? (
            <div className="p-4 rounded-xl bg-cyber-red/10 border border-cyber-red/30 flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 text-cyber-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-cyber-red">{result.message}</p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
                <span className="text-[10px] text-cyber-muted uppercase tracking-wider block mb-2">Header</span>
                <pre className="text-xs text-cyber-text font-mono whitespace-pre-wrap">{JSON.stringify(result.header, null, 2)}</pre>
              </div>

              <div className="p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
                <span className="text-[10px] text-cyber-muted uppercase tracking-wider block mb-2">Payload</span>
                <pre className="text-xs text-cyber-text font-mono whitespace-pre-wrap">{JSON.stringify(result.payload, null, 2)}</pre>
              </div>

              {result.payload.exp && (
                <div className={`p-3 rounded-lg border ${
                  result.payload.exp < Math.floor(Date.now()/1000) ? 'bg-cyber-red/10 border-cyber-red/30' : 'bg-cyber-green/10 border-cyber-green/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cyber-muted">Expires</span>
                    <span className={`text-sm font-mono font-bold ${result.payload.exp < Math.floor(Date.now()/1000) ? 'text-cyber-red' : 'text-cyber-green'}`}>
                      {new Date(result.payload.exp * 1000).toISOString()}
                      {result.payload.exp < Math.floor(Date.now()/1000) ? ' (EXPIRED)' : ` (${Math.round((result.payload.exp - Date.now()/1000) / 86400)}d left)`}
                    </span>
                  </div>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] text-cyber-muted uppercase tracking-wider">Security Warnings</span>
                  {result.warnings.map((w, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${
                      w.severity === 'high' ? 'bg-cyber-red/5 border-cyber-red/20' :
                      w.severity === 'medium' ? 'bg-cyber-orange/5 border-cyber-orange/20' :
                      'bg-cyber-cyan/5 border-cyber-cyan/20'
                    }`}>
                      <span className={`text-xs font-semibold ${
                        w.severity === 'high' ? 'text-cyber-red' : w.severity === 'medium' ? 'text-cyber-orange' : 'text-cyber-cyan'
                      }`}>{w.finding}</span>
                      <p className="text-xs text-cyber-muted mt-0.5">{w.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {!result && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiKey className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Paste a JWT to decode and inspect</p>
        </div>
      )}
    </div>
  )
}
