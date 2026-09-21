import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLoader, FiAlertTriangle, FiTerminal, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

const SSH_FAILED = /Failed password for (?:invalid user )?(\S+) from (\S+)/
const SSH_INVALID = /Invalid user (\S+) from (\S+)/
const SSH_SUCCESS = /Accepted (\S+) for (\S+) from (\S+)/
const NGINX_COMBINED = /^(\S+) - \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d{3}) (\d+|-)/
const SQLI = /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b.*\b(from|into|table|values|where|set)\b)/i
const XSS = /(<script[\s>]|javascript:|on\w+\s*=)/i
const PATH_TRAVERSAL = /(\.\.\/|\.\.\\)/
const CMD_INJECTION = /(\||;|`|\$\(|%0a|%0d)/
const LOG4SHELL = /\$\{jndi:/i
const SHELLSHOCK = /\(\)\s*\{/
const LFI = /(\/etc\/passwd|\/etc\/shadow|\/proc\/self)/i
const RFI = /(https?:\/\/[^\s"']+\.(?:php|asp|jsp|py))/i

const SENSITIVE_PATHS = ['/\.env', '/wp-login\.php', '/phpmyadmin', '/\.git', '/admin', '/wp-admin', '/xmlrpc\.php', '/cgi-bin', '/.htaccess', '/config\.php']

const SCANNER_AGENTS = ['sqlmap','nikto','nmap','masscan','gobuster','dirbuster','wfuzz','ffuf','burpsuite','zgrab','nuclei','whatweb']

function detectFormat(lines) {
  for (const line of lines.slice(0, 5)) {
    if (/^(sshd|Failed password|Invalid user|Accepted)/.test(line)) return 'ssh'
    if (NGINX_COMBINED.test(line)) return 'nginx'
  }
  return 'unknown'
}

function analyzeLog(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const format = detectFormat(lines)
  const findings = []
  const ipStats = {}

  for (const line of lines) {
    const sshFail = line.match(SSH_FAILED)
    const sshInvalid = line.match(SSH_INVALID)
    const sshSuccess = line.match(SSH_SUCCESS)
    const nginxMatch = line.match(NGINX_COMBINED)

    if (sshFail) {
      const [, user, ip] = sshFail
      if (!ipStats[ip]) ipStats[ip] = { failures: 0, successes: 0, invalidUsers: [], attacks: [], lines: [] }
      ipStats[ip].failures++
      ipStats[ip].lines.push(line)
    }

    if (sshInvalid) {
      const [, user, ip] = sshInvalid
      if (!ipStats[ip]) ipStats[ip] = { failures: 0, successes: 0, invalidUsers: [], attacks: [], lines: [] }
      ipStats[ip].invalidUsers.push(user)
      ipStats[ip].lines.push(line)
    }

    if (sshSuccess) {
      const [, method, user, ip] = sshSuccess
      if (!ipStats[ip]) ipStats[ip] = { failures: 0, successes: 0, invalidUsers: [], attacks: [], lines: [] }
      ipStats[ip].successes++
      ipStats[ip].lines.push(line)
    }

    const attackPatterns = [
      { regex: SQLI, name: 'SQL Injection' },
      { regex: XSS, name: 'XSS Attack' },
      { regex: PATH_TRAVERSAL, name: 'Path Traversal' },
      { regex: CMD_INJECTION, name: 'Command Injection' },
      { regex: LOG4SHELL, name: 'Log4Shell (JNDI)' },
      { regex: SHELLSHOCK, name: 'Shellshock' },
      { regex: LFI, name: 'LFI/RFI Attempt' },
      { regex: RFI, name: 'RFI Attempt' },
    ]

    for (const { regex, name } of attackPatterns) {
      if (regex.test(line)) {
        const ip = nginxMatch?.[1] || sshFail?.[2] || sshInvalid?.[2] || 'unknown'
        if (!ipStats[ip]) ipStats[ip] = { failures: 0, successes: 0, invalidUsers: [], attacks: [], lines: [] }
        ipStats[ip].attacks.push({ type: name, line })
      }
    }

    if (nginxMatch) {
      const [, ip, , method, path, status] = nginxMatch
      if (!ipStats[ip]) ipStats[ip] = { failures: 0, successes: 0, invalidUsers: [], attacks: [], lines: [] }
      if (parseInt(status) >= 400) ipStats[ip].fourXX = (ipStats[ip].fourXX || 0) + 1
      if (parseInt(status) >= 500) ipStats[ip].fiveXX = (ipStats[ip].fiveXX || 0) + 1

      for (const pattern of SENSITIVE_PATHS) {
        if (new RegExp(pattern).test(path)) {
          ipStats[ip].attacks.push({ type: 'Sensitive Path Probe', line })
        }
      }

      const ua = line.toLowerCase()
      for (const scanner of SCANNER_AGENTS) {
        if (ua.includes(scanner)) {
          ipStats[ip].attacks.push({ type: `Scanner: ${scanner}`, line })
        }
      }
    }
  }

  const THRESHOLD = 10
  const topIps = Object.entries(ipStats)
    .filter(([, s]) => s.failures >= THRESHOLD || s.attacks.length > 0)
    .sort((a, b) => (b[1].failures + b[1].attacks.length) - (a[1].failures + a[1].attacks.length))

  for (const [ip, stats] of topIps) {
    if (stats.failures >= THRESHOLD) {
      findings.push({ severity: 'high', finding: `Brute force from ${ip}`, detail: `${stats.failures} failed login attempts. Threshold: ${THRESHOLD}.`, evidence: stats.lines.slice(0, 3) })
    }
    if (stats.successes > 0 && stats.failures >= THRESHOLD) {
      findings.push({ severity: 'high', finding: `Successful login after ${stats.failures} failures from ${ip}`, detail: `IP ${ip} eventually authenticated successfully after ${stats.failures} failures.` })
    }
    if (stats.invalidUsers.length > 0) {
      const unique = [...new Set(stats.invalidUsers)]
      findings.push({ severity: 'medium', finding: `Invalid users from ${ip}`, detail: `Attempted users: ${unique.join(', ')}`, evidence: stats.lines.slice(0, 3) })
    }
    const attackTypes = [...new Set(stats.attacks.map(a => a.type))]
    if (attackTypes.length > 0) {
      findings.push({ severity: 'high', finding: `Web attacks from ${ip}`, detail: attackTypes.join(', '), evidence: stats.attacks.slice(0, 3).map(a => a.line) })
    }
  }

  return { format, findings, totalLines: lines.length, topIps: topIps.map(([ip, s]) => ({ ip, ...s })) }
}

export default function LogAttackDetector({ onAnalysis }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    await new Promise(r => setTimeout(r, 100))
    try {
      const data = analyzeLog(input)
      setResult(data)
      onAnalysis({ tool: 'Log Attack Detector', riskLevel: data.findings.some(f => f.severity === 'high') ? 'high' : data.findings.length > 0 ? 'medium' : 'low', target: `${data.totalLines} lines` })
    } catch {
      setResult({ format: 'unknown', findings: [{ severity: 'info', finding: 'Parse Error', detail: 'Could not analyze the log input.' }], totalLines: 0, topIps: [] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5 sm:p-8">
      <h3 className="text-xl font-semibold text-cyber-white mb-3">Log Attack Detector</h3>
      <p className="text-sm text-cyber-muted mb-8">Paste Linux auth.log/SSH logs or nginx/Apache access logs (combined format). Auto-detects format. Runs fully locally.</p>

      <div className="mb-8">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"Paste log entries, e.g.:\nFailed password for root from 192.168.1.100 port 22 ssh2\nFailed password for admin from 192.168.1.100 port 22 ssh2\nAccepted password for root from 192.168.1.100 port 22 ssh2"}
          className="input-field w-full min-h-[140px] resize-y font-mono text-sm"
          rows={6}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !input.trim()}
        className="btn-primary flex items-center gap-2 disabled:opacity-40 mb-8"
      >
        {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiTerminal className="w-4 h-4" />}
        Detect Attacks
      </button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider">Format</span>
              <p className="text-sm font-bold font-mono text-cyber-cyan uppercase">{result.format}</p>
            </div>
            <div className="p-3 rounded-lg bg-cyber-dark/50 border border-cyber-border/30">
              <span className="text-[10px] text-cyber-muted uppercase tracking-wider">Lines</span>
              <p className="text-sm font-bold font-mono text-cyber-cyan">{result.totalLines}</p>
            </div>
          </div>

          {result.findings.length > 0 ? (
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
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold ${
                        f.severity === 'high' ? 'text-cyber-red' : f.severity === 'medium' ? 'text-cyber-orange' : 'text-cyber-cyan'
                      }`}>{f.finding}</span>
                      <p className="text-xs text-cyber-muted mt-0.5">{f.detail}</p>
                      {f.evidence && f.evidence.length > 0 && (
                        <div className="mt-2 pl-2 border-l border-cyber-border/30">
                          {f.evidence.map((e, j) => <p key={j} className="text-[10px] text-cyber-text font-mono truncate">{e}</p>)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-cyber-green/5 border border-cyber-green/20 text-center">
              <FiCheckCircle className="w-6 h-6 text-cyber-green mx-auto mb-2" />
              <p className="text-sm text-cyber-green">No attack patterns detected</p>
            </div>
          )}
        </motion.div>
      )}

      {!result && (
        <div className="text-center py-8 text-cyber-muted/50">
          <FiTerminal className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Paste log entries to detect attack patterns</p>
        </div>
      )}
    </div>
  )
}
