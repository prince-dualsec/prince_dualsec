import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiGlobe, FiShield, FiAlertCircle } from 'react-icons/fi'

async function dnsQueryGoogle(name, type) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}&do=1`)
    if (res.ok) return await res.json()
  } catch {}
  return null
}

export default function DnssecCaaChecker({ onAnalysis }) {
  const [domain, setDomain] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const d = domain.trim().toLowerCase()

      const [dsData, dnskeyData, caaData, nsData] = await Promise.all([
        dnsQueryGoogle(d, '43'),
        dnsQueryGoogle(d, '48'),
        dnsQueryGoogle(d, '257'),
        dnsQueryGoogle(d, '2'),
      ])

      const dsRecords = dsData?.Answer?.filter(a => a.type === 43) || []
      const dnskeyRecords = dnskeyData?.Answer?.filter(a => a.type === 48) || []
      const caaRecords = caaData?.Answer?.filter(a => a.type === 257) || []
      const nsRecords = nsData?.Answer?.filter(a => a.type === 2) || []

      const adFlag = dsData?.AD || dnskeyData?.AD || false
      const hasDnssec = dsRecords.length > 0 && dnskeyRecords.length > 0

      const findings = []

      if (hasDnssec) {
        findings.push({ severity: 'ok', finding: 'DNSSEC is configured', detail: `Found ${dsRecords.length} DS record(s) and ${dnskeyRecords.length} DNSKEY record(s).` })
      } else if (dsRecords.length > 0) {
        findings.push({ severity: 'warning', finding: 'DS records found but no DNSKEY', detail: 'DS records exist but DNSKEY records are missing or not returned.' })
      } else {
        findings.push({ severity: 'warning', finding: 'No DNSSEC', detail: 'No DS or DNSKEY records found. Domain is not signed with DNSSEC.' })
      }

      if (adFlag) {
        findings.push({ severity: 'ok', finding: 'AD (Authenticated Data) flag set', detail: 'The resolver confirms DNSSEC validation. Note: this depends on the resolver supporting validation.' })
      } else {
        findings.push({ severity: 'info', finding: 'AD flag not set', detail: 'The Google resolver did not set the AD flag. This may mean the domain is unsigned or the resolver does not validate.' })
      }

      if (caaRecords.length > 0) {
        const issuers = caaRecords.map(r => {
          const match = r.data?.match(/(\d+)\s+(\w+)\s+"([^"]+)"/)
          return match ? { flags: match[1], tag: match[2], value: match[3] } : { raw: r.data }
        })
        const issueTags = issuers.filter(i => i.tag === 'issue')
        const issuewildTags = issuers.filter(i => i.tag === 'issuewild')

        findings.push({ severity: 'ok', finding: `CAA records found (${caaRecords.length})`, detail: `Authorized CA(s): ${issueTags.map(i => i.value).join(', ') || 'none'}` })
        if (issuewildTags.length > 0) {
          findings.push({ severity: 'ok', finding: 'CAA issuewild configured', detail: `Wildcard authorized: ${issuewildTags.map(i => i.value).join(', ')}` })
        }
      } else {
        findings.push({ severity: 'info', finding: 'No CAA records', detail: 'No CAA records found. Any Certificate Authority can issue certificates for this domain.' })
      }

      const nsProviders = nsRecords.map(r => {
        const data = r.data || ''
        return data.replace(/\.$/, '').split('.').slice(-2).join('.')
      })
      const uniqueProviders = [...new Set(nsProviders)]

      findings.push({ severity: 'info', finding: `${nsRecords.length} NS record(s)`, detail: uniqueProviders.length > 1 ? `Multiple providers: ${uniqueProviders.join(', ')}` : `Single provider: ${uniqueProviders[0] || 'unknown'}` })

      setResult({ findings, dsRecords, dnskeyRecords, caaRecords, nsRecords, adFlag, hasDnssec })
      onAnalysis({ tool: 'DNSSEC & CAA Checker', riskLevel: hasDnssec ? 'low' : 'medium', target: d })
    } catch {
      setResult({ findings: [{ severity: 'warning', finding: 'Error', detail: 'Failed to query DNS records.' }], dsRecords: [], dnskeyRecords: [], caaRecords: [], nsRecords: [], adFlag: false, hasDnssec: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">DNSSEC & CAA Checker</h3>
      <p className="text-sm text-cyber-muted mb-8">Check DNSSEC signing, CAA records, and NS diversity via Google DNS. No API key required.</p>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          placeholder="Enter domain (e.g., cloudflare.com)..."
          className="input-field flex-1"
        />
        <button onClick={handleCheck} disabled={loading || !domain.trim()} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-40 shrink-0">
          {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiGlobe className="w-4 h-4" />}
          Check
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className={`p-4 rounded-xl flex items-center justify-between ${
            result.hasDnssec ? 'bg-cyber-green/10 border border-cyber-green/30' : 'bg-cyber-orange/10 border border-cyber-orange/30'
          }`}>
            <div className="flex items-center gap-3">
              {result.hasDnssec ? <FiCheckCircle className="w-5 h-5 text-cyber-green" /> : <FiAlertCircle className="w-5 h-5 text-cyber-orange" />}
              <span className="text-sm font-semibold" style={{ color: result.hasDnssec ? '#00ff88' : '#f97316' }}>
                DNSSEC: {result.hasDnssec ? 'Signed' : 'Unsigned'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {result.findings.map((f, i) => (
              <div key={i} className={`p-3 rounded-lg border ${
                f.severity === 'ok' ? 'bg-cyber-green/5 border-cyber-green/20' :
                f.severity === 'warning' ? 'bg-cyber-orange/5 border-cyber-orange/20' :
                'bg-cyber-cyan/5 border-cyber-cyan/20'
              }`}>
                <div className="flex items-start gap-2">
                  {f.severity === 'ok' ? <FiCheckCircle className="w-4 h-4 text-cyber-green mt-0.5 shrink-0" /> :
                   f.severity === 'warning' ? <FiAlertTriangle className="w-4 h-4 text-cyber-orange mt-0.5 shrink-0" /> :
                   <FiAlertCircle className="w-4 h-4 text-cyber-cyan mt-0.5 shrink-0" />}
                  <div>
                    <span className={`text-xs font-semibold ${
                      f.severity === 'ok' ? 'text-cyber-green' : f.severity === 'warning' ? 'text-cyber-orange' : 'text-cyber-cyan'
                    }`}>{f.finding}</span>
                    <p className="text-xs text-cyber-muted mt-0.5">{f.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-cyber-muted/70 text-center font-mono">
            Note: The AD flag depends on the resolver's DNSSEC validation support. Results are indicative, not definitive.
          </p>
        </motion.div>
      )}

      {!result && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiGlobe className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Enter a domain to check DNSSEC and CAA records</p>
        </div>
      )}
    </div>
  )
}
