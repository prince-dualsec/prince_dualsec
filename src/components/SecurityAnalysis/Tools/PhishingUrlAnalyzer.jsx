import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiLink } from 'react-icons/fi'

const BRANDS = [
  'paypal.com','apple.com','microsoft.com','google.com','amazon.com','facebook.com','netflix.com',
  'instagram.com','twitter.com','linkedin.com','github.com','dropbox.com','icloud.com','live.com',
  'outlook.com','yahoo.com','aol.com','ebay.com','walmart.com','target.com','bestbuy.com',
  'chase.com','bankofamerica.com','wellsfargo.com','citibank.com','venmo.com','cashapp.com',
  'zelle.com','uber.com','lyft.com','airbnb.com','spotify.com','hulu.com','disney.com',
  'roblox.com','steam.com','epicgames.com','riotgames.com','blizzard.com','electron.com',
  'zoom.us','slack.com','discord.com','twitch.tv','reddit.com','tiktok.com','snapchat.com',
  'whatsapp.com','telegram.org','signal.org','protonmail.com',
]

const SHORTENERS = ['bit.ly','tinyurl.com','t.co','goo.gl','is.gd','buff.ly','ow.ly','rb.gy','cutt.ly','shorturl.at','adf.ly','bl.ink','lnkd.in','tiny.cc']

const SUSPICIOUS_TLDS = ['.xyz','.top','.club','.work','.online','.site','.buzz','.tk','.ml','.ga','.cf','.gq','.info','.biz']

const SUSPICIOUS_WORDS = ['login','verify','secure','update','account','password','confirm','signin','authenticate','credential','banking','wallet']

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] !== b[j-1] ? 1 : 0)
      )
  return dp[m][n]
}

function analyzeUrl(url) {
  const findings = []
  let score = 0

  try {
    const parsed = new URL(url)

    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      findings.push({ severity: 'high', finding: 'Dangerous scheme', detail: `Uses ${parsed.protocol}// which can execute code or embed data directly.` })
      score += 30
    }

    if (parsed.protocol === 'http:' && parsed.hostname !== 'localhost') {
      findings.push({ severity: 'medium', finding: 'HTTP instead of HTTPS', detail: 'The URL uses unencrypted HTTP. Legitimate sites use HTTPS.' })
      score += 10
    }

    if (parsed.username || parsed.password) {
      findings.push({ severity: 'high', finding: '@ userinfo trick', detail: `Contains @ in the URL (username: "${parsed.username}"). The part before @ is decorative; the real host is "${parsed.hostname}". This is a classic phishing technique.` })
      score += 25
    }

    const host = parsed.hostname
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      findings.push({ severity: 'high', finding: 'IP address as host', detail: 'Uses a raw IPv4 address instead of a domain name. Phishing sites often use IPs to avoid domain checks.' })
      score += 20
    } else if (/^0x[0-9a-f]+$/i.test(host)) {
      findings.push({ severity: 'high', finding: 'Hex-encoded IP', detail: `Host "${host}" is a hexadecimal-encoded IP address.` })
      score += 20
    } else if (/^0[0-7]+\.[0-7]+\.[0-7]+\.[0-7]+$/.test(host)) {
      findings.push({ severity: 'high', finding: 'Octal-encoded IP', detail: `Host "${host}" uses octal encoding to disguise an IP address.` })
      score += 20
    } else if (/^\d+$/.test(host)) {
      findings.push({ severity: 'high', finding: 'Decimal-encoded IP', detail: `Host "${host}" is a decimal-encoded IP address.` })
      score += 20
    }

    if (host.includes('xn--')) {
      const decoded = host.replace(/xn--/g, '')
      findings.push({ severity: 'medium', finding: 'Punycode domain', detail: `Uses internationalized domain name encoding (xn--). Decoded form may impersonate a brand. Decoded segment: "${decoded}"` })
      score += 15
    }

    const labels = host.split('.')
    if (labels.length > 4) {
      findings.push({ severity: 'medium', finding: 'Excessive subdomains', detail: `Host has ${labels.length} labels. Attackers use deep subdomains to hide the real domain.` })
      score += 10
    }

    if (host.length > 50) {
      findings.push({ severity: 'low', finding: 'Very long hostname', detail: `Hostname is ${host.length} characters. Long hosts are harder for users to verify.` })
      score += 5
    }

    const tld = '.' + (labels[labels.length - 1] || '')
    if (SUSPICIOUS_TLDS.includes(tld)) {
      findings.push({ severity: 'medium', finding: 'Suspicious TLD', detail: `TLD "${tld}" is commonly abused by phishing sites.` })
      score += 10
    }

    if (SHORTENERS.some(s => host === s || host.endsWith('.' + s))) {
      findings.push({ severity: 'medium', finding: 'URL shortener', detail: `Host "${host}" is a known URL shortener. Shorteners can mask the real destination.` })
      score += 10
    }

    const secondLevel = labels.slice(-2).join('.')
    for (const brand of BRANDS) {
      const brandName = brand.split('.')[0]
      if (secondLevel === brand) continue
      if (host.includes(brandName) && secondLevel !== brand) {
        const dist = levenshtein(host.split('.')[0], brandName)
        if (dist <= 2 && dist > 0) {
          findings.push({ severity: 'high', finding: 'Brand lookalike', detail: `Host resembles "${brand}" (edit distance: ${dist}). Likely impersonation.` })
          score += 20
          break
        }
        if (host.includes(brandName) && secondLevel !== brand) {
          findings.push({ severity: 'medium', finding: 'Brand name in subdomain', detail: `Contains "${brandName}" but hosted on "${secondLevel}". May confuse users.` })
          score += 10
          break
        }
      }
    }

    const path = (parsed.pathname + parsed.search).toLowerCase()
    for (const word of SUSPICIOUS_WORDS) {
      if (host.includes(word) || path.includes(word)) {
        findings.push({ severity: 'low', finding: 'Suspicious keyword', detail: `Contains "${word}" in ${host.includes(word) ? 'hostname' : 'path'}. Phishing pages often use credential-related words.` })
        score += 5
        break
      }
    }

    const params = parsed.searchParams
    for (const key of ['url','redirect','next','return','goto','to','out','redir','continue','destination']) {
      if (params.has(key)) {
        findings.push({ severity: 'medium', finding: 'Redirect parameter', detail: `URL contains "${key}=" parameter, commonly used in open-redirect attacks.` })
        score += 10
        break
      }
    }

    if (parsed.pathname.includes('@')) {
      findings.push({ severity: 'high', finding: '@ in path', detail: 'Path contains @ which may indicate an attempt to confuse URL parsers.' })
      score += 15
    }

  } catch {
    findings.push({ severity: 'high', finding: 'Invalid URL', detail: 'The input is not a valid URL.' })
    score = 50
  }

  score = Math.min(score, 100)
  const riskLevel = score >= 50 ? 'high' : score >= 25 ? 'medium' : score >= 10 ? 'low' : 'safe'

  return { score, riskLevel, findings }
}

export default function PhishingUrlAnalyzer({ onAnalysis }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    await new Promise(r => setTimeout(r, 100))
    try {
      const data = analyzeUrl(input.trim())
      setResult(data)
      onAnalysis({ tool: 'Phishing URL Analyzer', riskLevel: data.riskLevel, target: input.substring(0, 60) })
    } catch {
      setResult({ score: 0, riskLevel: 'safe', findings: [{ severity: 'info', finding: 'Error', detail: 'Unexpected error during analysis.' }] })
    } finally {
      setLoading(false)
    }
  }

  const riskColors = {
    high: { color: '#ff4757', bg: 'bg-cyber-red/10 border-cyber-red/30' },
    medium: { color: '#f97316', bg: 'bg-cyber-orange/10 border-cyber-orange/30' },
    low: { color: '#00ff88', bg: 'bg-cyber-green/10 border-cyber-green/30' },
    safe: { color: '#00d4ff', bg: 'bg-cyber-cyan/10 border-cyber-cyan/30' },
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">Phishing URL Analyzer</h3>
      <p className="text-sm text-cyber-muted mb-2">Heuristic static analysis of URLs for phishing indicators. This is NOT a reputation database — it checks structural patterns only.</p>
      <p className="text-xs text-cyber-orange/80 mb-8">⚠ This tool never fetches or opens the URL. Analysis is purely local.</p>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="Enter URL to analyze (e.g., http://paypa1-login.example.com@192.168.0.1/verify)..."
          className="input-field flex-1"
        />
        <button onClick={handleAnalyze} disabled={loading || !input.trim()} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-40 shrink-0">
          {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiLink className="w-4 h-4" />}
          Analyze
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className={`p-4 rounded-xl flex items-center justify-between ${riskColors[result.riskLevel]?.bg || riskColors.safe.bg}`}>
            <div className="flex items-center gap-3">
              {result.riskLevel === 'high' || result.riskLevel === 'medium' ? (
                <FiAlertTriangle className="w-5 h-5" style={{ color: riskColors[result.riskLevel]?.color }} />
              ) : (
                <FiCheckCircle className="w-5 h-5" style={{ color: riskColors[result.riskLevel]?.color }} />
              )}
              <span className="text-sm font-semibold" style={{ color: riskColors[result.riskLevel]?.color }}>
                Risk Score: {result.score}/100 — {result.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>

          {result.findings.length > 0 ? (
            <div className="space-y-3">
              {result.findings.map((f, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  f.severity === 'high' ? 'bg-cyber-red/5 border-cyber-red/20' :
                  f.severity === 'medium' ? 'bg-cyber-orange/5 border-cyber-orange/20' :
                  'bg-cyber-green/5 border-cyber-green/20'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${
                      f.severity === 'high' ? 'text-cyber-red' :
                      f.severity === 'medium' ? 'text-cyber-orange' :
                      'text-cyber-green'
                    }`}>{f.finding}</span>
                  </div>
                  <p className="text-xs text-cyber-muted leading-relaxed">{f.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-cyber-green/5 border border-cyber-green/20 text-center">
              <FiCheckCircle className="w-6 h-6 text-cyber-green mx-auto mb-2" />
              <p className="text-sm text-cyber-green">No suspicious patterns detected</p>
            </div>
          )}
        </motion.div>
      )}

      {!result && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiLink className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Enter a URL to perform heuristic phishing analysis</p>
        </div>
      )}
    </div>
  )
}
