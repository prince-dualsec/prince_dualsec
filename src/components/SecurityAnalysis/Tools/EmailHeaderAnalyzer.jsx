import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiMail, FiAlertCircle } from 'react-icons/fi'

function parseHeaders(raw) {
  const lines = raw.split(/\r?\n/)
  const headers = {}
  let currentKey = null

  for (const line of lines) {
    if (/^\s/.test(line) && currentKey) {
      headers[currentKey] += ' ' + line.trim()
    } else {
      const match = line.match(/^([^:]+):\s*(.*)/)
      if (match) {
        currentKey = match[1].trim().toLowerCase()
        headers[currentKey] = match[2].trim()
      }
    }
  }
  return headers
}

function parseReceivedChain(raw) {
  const lines = raw.split(/\r?\n/)
  const received = []
  let current = ''

  for (const line of lines) {
    if (/^received:/i.test(line)) {
      if (current) received.push(current)
      current = line.replace(/^received:\s*/i, '')
    } else if (/^\s/.test(line) && current) {
      current += ' ' + line.trim()
    }
  }
  if (current) received.push(current)
  return received.reverse()
}

function extractDate(dateStr) {
  if (!dateStr) return null
  try { return new Date(dateStr) } catch { return null }
}

export default function EmailHeaderAnalyzer({ onAnalysis }) {
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
      const receivedChain = parseReceivedChain(input)
      const findings = []

      const from = headers['from'] || ''
      const returnPath = headers['return-path'] || ''
      const replyTo = headers['reply-to'] || ''

      const fromEmail = from.match(/<([^>]+)>/)?.[1] || from.match(/[\w.+-]+@[\w.-]+/)?.[0] || ''
      const rpEmail = returnPath.match(/<([^>]+)>/)?.[1] || returnPath.match(/[\w.+-]+@[\w.-]+/)?.[0] || ''

      if (fromEmail && rpEmail && fromEmail.toLowerCase() !== rpEmail.toLowerCase()) {
        findings.push({ severity: 'high', finding: 'From / Return-Path mismatch', detail: `From: "${fromEmail}" but Return-Path: "${rpEmail}". This may indicate spoofing.` })
      }

      if (replyTo) {
        const replyEmail = replyTo.match(/<([^>]+)>/)?.[1] || replyTo.match(/[\w.+-]+@[\w.-]+/)?.[0] || ''
        if (replyEmail && fromEmail && replyEmail.toLowerCase() !== fromEmail.toLowerCase()) {
          findings.push({ severity: 'medium', finding: 'Reply-To differs from From', detail: `Reply-To: "${replyEmail}" does not match From: "${fromEmail}".` })
        }
      }

      const messageId = headers['message-id'] || ''
      if (messageId) {
        const msgDomain = messageId.match(/@([^>]+)/)?.[1]
        const fromDomain = fromEmail.split('@')[1]
        if (msgDomain && fromDomain && msgDomain.toLowerCase() !== fromDomain.toLowerCase()) {
          findings.push({ severity: 'medium', finding: 'Message-ID domain mismatch', detail: `Message-ID domain "${msgDomain}" differs from sender domain "${fromDomain}".` })
        }
      }

      const xOriginatingIp = headers['x-originating-ip'] || ''
      if (xOriginatingIp) {
        findings.push({ severity: 'info', finding: 'X-Originating-IP found', detail: `Originating IP: ${xOriginatingIp}` })
      }

      const authResults = headers['authentication-results'] || ''
      if (authResults) {
        const spfMatch = authResults.match(/spf=(\w+)/)
        const dkimMatch = authResults.match(/dkim=(\w+)/)
        const dmarcMatch = authResults.match(/dmarc=(\w+)/)

        if (spfMatch && spfMatch[1] !== 'pass') findings.push({ severity: 'high', finding: `SPF: ${spfMatch[1]}`, detail: `SPF check result is "${spfMatch[1]}" in Authentication-Results.` })
        if (dkimMatch && dkimMatch[1] !== 'pass') findings.push({ severity: 'high', finding: `DKIM: ${dkimMatch[1]}`, detail: `DKIM check result is "${dkimMatch[1]}" in Authentication-Results.` })
        if (dmarcMatch && dmarcMatch[1] !== 'pass') findings.push({ severity: 'high', finding: `DMARC: ${dmarcMatch[1]}`, detail: `DMARC check result is "${dmarcMatch[1]}" in Authentication-Results.` })

        if (!spfMatch) findings.push({ severity: 'low', finding: 'No SPF in Auth-Results', detail: 'Authentication-Results header does not contain an SPF result.' })
        if (!dkimMatch) findings.push({ severity: 'low', finding: 'No DKIM in Auth-Results', detail: 'Authentication-Results header does not contain a DKIM result.' })
      } else {
        findings.push({ severity: 'medium', finding: 'No Authentication-Results', detail: 'No Authentication-Results header found. Email authentication status is unknown.' })
      }

      const hopDetails = []
      const baseDate = extractDate(headers['date'])
      for (let i = 0; i < receivedChain.length; i++) {
        const hop = receivedChain[i]
        const fromMatch = hop.match(/from\s+(\S+)/i)
        const byMatch = hop.match(/by\s+(\S+)/i)
        const dateMatch = hop.match(/;\s*(.+)/)
        const date = dateMatch ? extractDate(dateMatch[1]) : null

        hopDetails.push({
          hop: i + 1,
          from: fromMatch?.[1] || 'unknown',
          by: byMatch?.[1] || 'unknown',
          date,
          delay: (i > 0 && date && hopDetails[i-1]?.date) ? Math.round((hopDetails[i-1].date - date) / 1000) : null,
        })
      }

      setResult({ findings, hopDetails, headers, authResults })
      onAnalysis({ tool: 'Email Header Analyzer', riskLevel: findings.some(f => f.severity === 'high') ? 'high' : findings.some(f => f.severity === 'medium') ? 'medium' : 'low', target: fromEmail || 'headers' })
    } catch {
      setResult({ findings: [{ severity: 'info', finding: 'Parse Error', detail: 'Could not parse the input as email headers.' }], hopDetails: [], headers: {} })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">Email Header Analyzer</h3>
      <p className="text-sm text-cyber-muted mb-8">Paste raw email headers to analyze the Received chain, authentication results, and flag anomalies. Runs fully locally.</p>

      <div className="mb-8">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste raw email headers here..."
          className="input-field w-full min-h-[140px] resize-y font-mono text-sm"
          rows={6}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !input.trim()}
        className="btn-primary flex items-center gap-2 disabled:opacity-40 mb-8"
      >
        {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiMail className="w-4 h-4" />}
        Analyze Headers
      </button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {result.findings.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider">Findings</span>
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
          )}

          {result.hopDetails.length > 0 && (
            <div className="p-4 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider block mb-3">Received Chain ({result.hopDetails.length} hops)</span>
              <div className="space-y-2">
                {result.hopDetails.map((hop, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-cyber-cyan font-mono w-6">#{hop.hop}</span>
                    <span className="text-cyber-text font-mono truncate flex-1">{hop.from} → {hop.by}</span>
                    {hop.delay !== null && <span className="text-cyber-muted shrink-0">{hop.delay}s</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!result && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiMail className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Paste raw email headers to analyze</p>
        </div>
      )}
    </div>
  )
}
