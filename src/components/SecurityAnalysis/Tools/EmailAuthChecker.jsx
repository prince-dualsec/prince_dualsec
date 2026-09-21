import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiXCircle, FiMail, FiAlertCircle } from 'react-icons/fi'

async function dnsQuery(name, type) {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { 'accept': 'application/dns-json' },
    })
    if (res.ok) {
      const data = await res.json()
      return data.Answer || []
    }
  } catch {}
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`)
    if (res.ok) {
      const data = await res.json()
      return data.Answer || []
    }
  } catch {}
  return []
}

function parseSpf(record) {
  if (!record) return null
  const mechanisms = []
  const lookups = []
  const parts = record.split(/\s+/)
  let hasAll = false
  let allType = null

  for (const part of parts) {
    if (part === 'v=spf1') continue
    if (part.endsWith('all')) {
      hasAll = true
      allType = part.charAt(0) === '+' ? 'pass' : part.charAt(0) === '-' ? 'fail' : part.charAt(0) === '~' ? 'softfail' : part.charAt(0) === '?' ? 'neutral' : 'pass'
      continue
    }
    const mod = part.charAt(0)
    const mechanism = mod === '+' || mod === '-' || mod === '~' || mod === '?' ? part.substring(1) : part
    const type = mechanism.split(':')[0]
    mechanisms.push({ type, raw: part })
    if (['include', 'a', 'mx', 'ptr', 'exists', 'redirect'].some(m => type.startsWith(m))) {
      lookups.push(type)
    }
  }

  return { raw: record, mechanisms, lookups, lookupCount: lookups.length, hasAll, allType }
}

function parseDmarc(record) {
  if (!record) return null
  const parts = record.split(/\s+/)
  const tags = {}
  for (const part of parts) {
    if (part.startsWith('v=DMARC1')) continue
    const [key, val] = part.split('=')
    if (key && val) tags[key.trim()] = val.trim()
  }
  return { raw: record, tags }
}

export default function EmailAuthChecker({ onAnalysis }) {
  const [domain, setDomain] = useState('')
  const [selector, setSelector] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const d = domain.trim().toLowerCase()

      const spfAnswers = await dnsQuery(d, 'TXT')
      const spfRecord = spfAnswers.find(a => a.data && a.data.startsWith('v=spf1'))
      const spf = parseSpf(spfRecord?.data)

      const dmarcAnswers = await dnsQuery(`_dmarc.${d}`, 'TXT')
      const dmarcRecord = dmarcAnswers.find(a => a.data && a.data.startsWith('v=DMARC1'))
      const dmarc = parseDmarc(dmarcRecord?.data)

      let dkim = null
      let dkimSelector = null
      if (selector.trim()) {
        const dkimAnswers = await dnsQuery(`${selector.trim()}.${d}`, 'TXT')
        dkim = dkimAnswers.find(a => a.data && (a.data.includes('v=DKIM1') || a.data.includes('p=MI'))) || null
        dkimSelector = selector.trim()
      } else {
        const commonSelectors = ['default','google','selector1','selector2','k1','s1','mail','dkim','postmark','mandrill','s1._domainkey','s2._domainkey']
        for (const sel of commonSelectors) {
          const dkimAnswers = await dnsQuery(`${sel}.${d}`, 'TXT')
          const found = dkimAnswers.find(a => a.data && (a.data.includes('v=DKIM1') || a.data.includes('p=MI')))
          if (found) { dkim = found; dkimSelector = sel; break }
        }
      }

      let score = 0
      const reasons = []

      if (spf) {
        if (spf.hasAll && spf.allType === 'fail') { score += 35; reasons.push({ ok: true, text: 'SPF uses -all (hard fail) — unauthorized senders are rejected' }) }
        else if (spf.hasAll && spf.allType === 'softfail') { score += 25; reasons.push({ ok: false, text: 'SPF uses ~all (softfail) — unauthorized senders are marked but not rejected' }) }
        else if (spf.hasAll && spf.allType === 'neutral') { score += 10; reasons.push({ ok: false, text: 'SPF uses ?all (neutral) — does not authorize or reject' }) }
        else { score += 15; reasons.push({ ok: false, text: 'SPF record has no all mechanism' }) }

        if (spf.lookupCount > 10) { score -= 10; reasons.push({ ok: false, text: `SPF has ${spf.lookupCount} DNS lookups (limit is 10) — may cause permerror` }) }
        else { score += 5 }

        if (spf.mechanisms.length > 1) {
          reasons.push({ ok: false, text: 'Multiple SPF records found — only one should exist' })
          score -= 5
        }
      } else {
        reasons.push({ ok: false, text: 'No SPF record found — anyone can send email for this domain' })
      }

      if (dmarc) {
        const p = dmarc.tags.p
        if (p === 'reject') { score += 35; reasons.push({ ok: true, text: 'DMARC p=reject — non-aligned emails are rejected' }) }
        else if (p === 'quarantine') { score += 25; reasons.push({ ok: true, text: 'DMARC p=quarantine — non-aligned emails are quarantined' }) }
        else if (p === 'none') { score += 5; reasons.push({ ok: false, text: 'DMARC p=none — no enforcement, monitoring only' }) }

        if (dmarc.tags.sp) reasons.push({ ok: true, text: `DMARC subdomain policy: sp=${dmarc.tags.sp}` })
        if (dmarc.tags.pct) reasons.push({ ok: true, text: `DMARC pct=${dmarc.tags.pct} — applied to ${dmarc.tags.pct}% of messages` })
        if (dmarc.tags.rua) reasons.push({ ok: true, text: `Aggregate reports: ${dmarc.tags.rua}` })
      } else {
        reasons.push({ ok: false, text: 'No DMARC record found — no email authentication policy' })
      }

      if (dkim) {
        score += 30
        reasons.push({ ok: true, text: `DKIM found with selector "${dkimSelector}"` })
      } else {
        reasons.push({ ok: false, text: selector.trim() ? `No DKIM record found for selector "${selector.trim()}"` : 'No DKIM record found with common selectors (not conclusive)' })
      }

      score = Math.max(0, Math.min(100, score))

      setResult({ spf, dmarc, dkim, dkimSelector, score, reasons, domain: d })
      onAnalysis({ tool: 'Email Auth Checker', riskLevel: score >= 60 ? 'low' : score >= 30 ? 'medium' : 'high', target: d })
    } catch {
      setResult({ spf: null, dmarc: null, dkim: null, score: 0, reasons: [{ ok: false, text: 'Error querying DNS records.' }], domain: domain.trim() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">Email Auth Checker</h3>
      <p className="text-sm text-cyber-muted mb-8">Check SPF, DMARC, and DKIM records for a domain. Queries DNS via Cloudflare DoH — no API key required.</p>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          placeholder="Enter domain (e.g., google.com)..."
          className="input-field flex-1"
        />
        <button onClick={handleCheck} disabled={loading || !domain.trim()} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-40 shrink-0">
          {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiMail className="w-4 h-4" />}
          Check
        </button>
      </div>
      <div className="mb-8">
        <input
          type="text"
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
          placeholder="DKIM selector (optional — leave blank to try common selectors)"
          className="input-field w-full"
        />
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className={`p-4 rounded-xl flex items-center justify-between ${
            result.score >= 60 ? 'bg-cyber-green/10 border border-cyber-green/30' :
            result.score >= 30 ? 'bg-cyber-orange/10 border border-cyber-orange/30' :
            'bg-cyber-red/10 border border-cyber-red/30'
          }`}>
            <span className="text-sm font-semibold text-cyber-white">Overall Grade</span>
            <span className={`text-2xl font-bold font-mono ${
              result.score >= 60 ? 'text-cyber-green' : result.score >= 30 ? 'text-cyber-orange' : 'text-cyber-red'
            }`}>{result.score}/100</span>
          </div>

          <div className="space-y-3">
            {result.reasons.map((r, i) => (
              <div key={i} className={`p-3 rounded-lg border ${r.ok ? 'bg-cyber-green/5 border-cyber-green/20' : 'bg-cyber-orange/5 border-cyber-orange/20'}`}>
                <div className="flex items-start gap-2">
                  {r.ok ? <FiCheckCircle className="w-4 h-4 text-cyber-green mt-0.5 shrink-0" /> : <FiAlertCircle className="w-4 h-4 text-cyber-orange mt-0.5 shrink-0" />}
                  <p className="text-xs text-cyber-text leading-relaxed">{r.text}</p>
                </div>
              </div>
            ))}
          </div>

          {result.spf && (
            <div className="p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider block mb-2">SPF Record</span>
              <p className="text-xs text-cyber-text font-mono break-all">{result.spf.raw}</p>
            </div>
          )}
          {result.dmarc && (
            <div className="p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider block mb-2">DMARC Record</span>
              <p className="text-xs text-cyber-text font-mono break-all">{result.dmarc.raw}</p>
            </div>
          )}
          {result.dkim && (
            <div className="p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider block mb-2">DKIM Record (selector: {result.dkimSelector})</span>
              <p className="text-xs text-cyber-text font-mono break-all">{result.dkim.data}</p>
            </div>
          )}
        </motion.div>
      )}

      {!result && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiMail className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Enter a domain to check email authentication records</p>
        </div>
      )}
    </div>
  )
}
