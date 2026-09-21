import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiShield, FiAlertCircle } from 'react-icons/fi'

const gadgetHosts = ['ajax.googleapis.com','cdnjs.cloudflare.com','cdn.jsdelivr.net','unpkg.com','code.jquery.com','ajax.aspnetcdn.com','ajax.aspnetajax.googleapis.com']

function parseCsp(csp) {
  const directives = {}
  const parts = csp.split(';').map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    const [name, ...values] = part.split(/\s+/)
    directives[name.toLowerCase()] = values
  }
  return directives
}

function evaluateCsp(csp) {
  const findings = []
  const directives = parseCsp(csp)

  const has = (d) => directives[d] && directives[d].length > 0
  const hasVal = (d, v) => has(d) && directives[d].includes(v)
  const hasSource = (d, v) => has(d) && directives[d].some(s => s.includes(v))

  if (!has('default-src') && !has('script-src')) {
    findings.push({ severity: 'high', finding: 'Missing default-src and script-src', detail: 'Without script-src, there is no restriction on script sources. Add at least default-src \'self\'.' })
  } else if (!has('script-src') && has('default-src')) {
    findings.push({ severity: 'medium', finding: 'No explicit script-src', detail: 'script-src falls back to default-src. Consider adding an explicit script-src for finer control.' })
  }

  if (!has('object-src')) {
    findings.push({ severity: 'high', finding: 'Missing object-src', detail: 'Without object-src \'none\', plugins (Flash, Java) can load arbitrary resources.' })
  }

  if (!has('base-uri')) {
    findings.push({ severity: 'medium', finding: 'Missing base-uri', detail: 'Without base-uri \'self\' or \'none\', an attacker can inject a <base> tag to redirect relative URLs.' })
  }

  if (!has('frame-ancestors')) {
    findings.push({ severity: 'medium', finding: 'Missing frame-ancestors', detail: 'Without frame-ancestors, the page can be framed by any site (clickjacking risk). X-Frame-Options is a weaker alternative.' })
  }

  if (hasVal('script-src', "'unsafe-inline'") || hasVal('default-src', "'unsafe-inline'")) {
    const hasNonce = has('script-src') && directives['script-src'].some(s => s.startsWith("'nonce-"))
    const hasHash = has('script-src') && directives['script-src'].some(s => s.startsWith("'sha256-") || s.startsWith("'sha384-") || s.startsWith("'sha512-"))
    const hasStrictDynamic = has('script-src') && directives['script-src'].includes("'strict-dynamic'")
    if (hasNonce || (hasHash && hasStrictDynamic)) {
      findings.push({ severity: 'info', finding: 'unsafe-inline present but mitigated', detail: 'A nonce or hash with strict-dynamic is present, which overrides unsafe-inline in modern browsers.' })
    } else {
      findings.push({ severity: 'high', finding: 'unsafe-inline in script-src', detail: 'Allows inline scripts. Use nonces or hashes instead. Inline event handlers and javascript: URIs are enabled.' })
    }
  }

  if (hasVal('script-src', "'unsafe-eval'") || hasVal('default-src', "'unsafe-eval'")) {
    findings.push({ severity: 'high', finding: 'unsafe-eval', detail: 'Allows eval() and similar constructs. This significantly increases XSS risk.' })
  }

  if (has('script-src') && directives['script-src'].includes('*')) {
    findings.push({ severity: 'high', finding: 'Wildcard in script-src', detail: 'Wildcard * allows scripts from any origin. This defeats the purpose of CSP.' })
  }

  for (const dir of ['script-src', 'style-src', 'img-src', 'default-src']) {
    if (has(dir)) {
      for (const src of directives[dir]) {
        if (src.startsWith('http:') && !src.startsWith('https:')) {
          findings.push({ severity: 'medium', finding: `HTTP source in ${dir}`, detail: `Source "${src}" uses insecure HTTP. Use HTTPS equivalents.` })
        }
        if (src === 'data:' && dir !== 'img-src') {
          findings.push({ severity: 'medium', finding: `data: in ${dir}`, detail: 'data: URIs can embed arbitrary content. Avoid in script/style contexts.' })
        }
        for (const host of gadgetHosts) {
          if (src.includes(host)) {
            findings.push({ severity: 'medium', finding: `Gadget host in ${dir}`, detail: `Source "${src}" is a known host that may allow script gadgets or JSONP bypasses.` })
          }
        }
      }
    }
  }

  if (has('object-src') && !directives['object-src'].includes("'none'")) {
    findings.push({ severity: 'medium', finding: 'object-src not set to none', detail: `object-src is set to: ${directives['object-src'].join(' ')}. Set to 'none' unless plugins are required.` })
  }

  if (has('frame-src') && directives['frame-src'].includes('*')) {
    findings.push({ severity: 'medium', finding: 'Wildcard in frame-src', detail: 'Allows iframes from any origin. Consider restricting to specific domains.' })
  }

  const score = Math.max(0, 100 - findings.reduce((sum, f) => sum + (f.severity === 'high' ? 20 : f.severity === 'medium' ? 10 : 2), 0))

  return { directives, findings, score }
}

export default function CspEvaluator({ onAnalysis }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    await new Promise(r => setTimeout(r, 100))
    try {
      const data = evaluateCsp(input.trim())
      setResult(data)
      onAnalysis({ tool: 'CSP Evaluator', riskLevel: data.score >= 70 ? 'low' : data.score >= 40 ? 'medium' : 'high', target: 'CSP policy' })
    } catch {
      setResult({ directives: {}, findings: [{ severity: 'high', finding: 'Parse Error', detail: 'Could not parse the CSP string.' }], score: 0 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">CSP Evaluator</h3>
      <p className="text-sm text-cyber-muted mb-8">Paste a Content-Security-Policy header to evaluate its strength and find weaknesses.</p>

      <div className="mb-8">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"Paste CSP, e.g.:\ndefault-src 'self'; script-src 'unsafe-inline' *; style-src 'self'"}
          className="input-field w-full min-h-[100px] resize-y font-mono text-sm"
          rows={4}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !input.trim()}
        className="btn-primary flex items-center gap-2 disabled:opacity-40 mb-8"
      >
        {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiShield className="w-4 h-4" />}
        Evaluate CSP
      </button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className={`p-4 rounded-xl flex items-center justify-between ${
            result.score >= 70 ? 'bg-cyber-green/10 border border-cyber-green/30' :
            result.score >= 40 ? 'bg-cyber-orange/10 border border-cyber-orange/30' :
            'bg-cyber-red/10 border border-cyber-red/30'
          }`}>
            <span className="text-sm font-semibold text-cyber-white">CSP Score</span>
            <span className={`text-2xl font-bold font-mono ${
              result.score >= 70 ? 'text-cyber-green' : result.score >= 40 ? 'text-cyber-orange' : 'text-cyber-red'
            }`}>{result.score}/100</span>
          </div>

          {Object.keys(result.directives).length > 0 && (
            <div className="p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider block mb-2">Parsed Directives</span>
              <div className="space-y-1">
                {Object.entries(result.directives).map(([dir, vals]) => (
                  <p key={dir} className="text-xs font-mono"><span className="text-cyber-cyan">{dir}</span> <span className="text-cyber-text">{vals.join(' ')}</span></p>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {result.findings.map((f, i) => (
              <div key={i} className={`p-3 rounded-lg border ${
                f.severity === 'high' ? 'bg-cyber-red/5 border-cyber-red/20' :
                f.severity === 'medium' ? 'bg-cyber-orange/5 border-cyber-orange/20' :
                'bg-cyber-cyan/5 border-cyber-cyan/20'
              }`}>
                <div className="flex items-start gap-2">
                  {f.severity === 'high' ? <FiAlertTriangle className="w-4 h-4 text-cyber-red mt-0.5 shrink-0" /> :
                   f.severity === 'medium' ? <FiAlertCircle className="w-4 h-4 text-cyber-orange mt-0.5 shrink-0" /> :
                   <FiCheckCircle className="w-4 h-4 text-cyber-cyan mt-0.5 shrink-0" />}
                  <div>
                    <span className={`text-xs font-semibold ${
                      f.severity === 'high' ? 'text-cyber-red' : f.severity === 'medium' ? 'text-cyber-orange' : 'text-cyber-cyan'
                    }`}>{f.finding}</span>
                    <p className="text-xs text-cyber-muted mt-0.5">{f.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!result && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiShield className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Paste a Content-Security-Policy to evaluate</p>
        </div>
      )}
    </div>
  )
}
