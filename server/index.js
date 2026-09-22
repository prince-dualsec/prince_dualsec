import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import tls from 'tls';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { fetchNvdFeed } from '../shared/nvdFeed.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3001;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'princeoffesheal@gmail.com';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================================
// CONTACT
// ============================================

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(503).json({ error: 'Email service not configured on server' });
  }

  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  try {
    await transporter.sendMail({
      from: `"${safeName}" <${process.env.SMTP_USER}>`,
      replyTo: email,
      to: CONTACT_EMAIL,
      subject: `[Portfolio Contact] ${safeSubject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nDate: ${new Date().toISOString()}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 8px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; font-weight: bold; color: #555;">Name</td><td style="padding: 8px;">${safeName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #555;">Email</td><td style="padding: 8px;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #555;">Subject</td><td style="padding: 8px;">${safeSubject}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #555;">Date</td><td style="padding: 8px;">${new Date().toLocaleString()}</td></tr>
          </table>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 16px;">
            <h3 style="margin-top: 0; color: #333;">Message</h3>
            <p style="white-space: pre-wrap; color: #555;">${safeMessage}</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 16px;">Reply directly to this email to respond to ${safeName}.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// ============================================
// SECURITY ANALYSIS API ROUTES
// ============================================

// --- Email breach check via XposedOrNot ---
app.get('/api/security/hibp', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email parameter required' });

  try {
    const response = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ status: 'error', message: 'Service temporarily unavailable — rate limited. Please try again later.' });
      }
      return res.status(502).json({ status: 'error', message: 'Service temporarily unavailable — upstream API returned an error.' });
    }

    const data = await response.json();

    if (data.status !== 'success') {
      return res.json({ status: 'ok', breaches: [], message: 'No verified breaches found.' });
    }

    const breachNames = Array.isArray(data.breaches) && data.breaches.length > 0 && Array.isArray(data.breaches[0])
      ? data.breaches[0]
      : Array.isArray(data.breaches) ? data.breaches : [];

    if (breachNames.length === 0) {
      return res.json({ status: 'ok', breaches: [], message: 'No verified breaches found.' });
    }

    res.json({
      status: 'ok',
      breaches: breachNames.map(name => ({
        name,
        date: null,
        description: `Breached in the ${name} data breach.`,
        dataClasses: [],
      })),
    });
  } catch (err) {
    console.error('XposedOrNot error:', err.message);
    if (err.name === 'TimeoutError' || err.cause?.code === 'ABORT_ERR') {
      return res.status(504).json({ status: 'error', message: 'Service temporarily unavailable — request timed out.' });
    }
    res.status(500).json({ status: 'error', message: 'Service temporarily unavailable — could not reach breach database.' });
  }
});

// --- Password breach check via HIBP k-Anonymity ---
app.post('/api/security/password-check', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return res.json({ status: 'pwned', count: parseInt(count.trim(), 10), message: `This password has been seen ${count.trim()} times in data breaches` });
      }
    }

    res.json({ status: 'safe', count: 0, message: 'This password has not been found in known data breaches' });
  } catch (err) {
    console.error('Password check error:', err.message);
    res.status(500).json({ error: 'Failed to check password' });
  }
});

// --- IP Intelligence — IPinfo API ---
const isValidIP = (ip) => {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}$/;
  return ipv4.test(ip) || ipv6.test(ip);
};

app.get('/api/security/ip-intel', async (req, res) => {
  const { ip } = req.query;
  if (!ip || !ip.trim()) {
    return res.status(400).json({ status: 'error', message: 'IP address is required.' });
  }

  const trimmed = ip.trim();
  if (!isValidIP(trimmed)) {
    return res.status(400).json({ status: 'error', message: `Invalid IP address format: "${trimmed}". Please enter a valid IPv4 or IPv6 address.` });
  }

  const IPINFO_TOKEN = process.env.IPINFO_TOKEN;

  try {
    const lookup = (token) => {
      const url = `https://ipinfo.io/${encodeURIComponent(trimmed)}/json${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      return fetch(url, { signal: AbortSignal.timeout(10000) });
    };

    let response = await lookup(IPINFO_TOKEN);
    let usedToken = Boolean(IPINFO_TOKEN);

    // IPinfo serves basic data unauthenticated (rate limited). If the configured
    // token is rejected, fall back to that rather than failing the lookup.
    if (IPINFO_TOKEN && (response.status === 401 || response.status === 403)) {
      console.warn('IPinfo token rejected — falling back to unauthenticated lookup. Check IPINFO_TOKEN in server/.env.');
      response = await lookup(null);
      usedToken = false;
    }

    if (!response.ok) {
      const text = await response.text();
      console.error('IPinfo API error:', response.status, text);
      if (response.status === 429) {
        return res.status(429).json({ status: 'error', message: 'IPinfo rate limit reached. Add a valid IPINFO_TOKEN to server/.env for higher limits.' });
      }
      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({ status: 'error', message: 'IPinfo rejected the request. Check IPINFO_TOKEN in server/.env.' });
      }
      return res.status(502).json({ status: 'error', message: 'Service temporarily unavailable — upstream API returned an error.' });
    }

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ status: 'error', message: data.error.message || 'Invalid IP address or lookup failed.' });
    }

    res.json({
      status: 'ok',
      ip: data.ip || trimmed,
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
      loc: data.loc || null,
      org: data.org || null,
      postal: data.postal || null,
      timezone: data.timezone || null,
      hostname: data.hostname || null,
      company: data.company || null,
      abuse: data.abuse || null,
      authenticated: usedToken,
    });
  } catch (err) {
    console.error('IPinfo error:', err.message);
    if (err.name === 'TimeoutError' || err.cause?.code === 'ABORT_ERR') {
      return res.status(504).json({ status: 'error', message: 'Service temporarily unavailable — request timed out.' });
    }
    res.status(500).json({ status: 'error', message: 'Service temporarily unavailable — could not reach IP intelligence service.' });
  }
});

// --- Domain Intelligence with full DNS records (A, AAAA, MX, NS, TXT) ---
app.get('/api/security/domain-intel', async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: 'Domain parameter required' });

  const cleanDomain = domain.trim().toLowerCase();

  try {
    const dnsTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CNAME'];
    const dnsResults = {};

    const dnsPromises = dnsTypes.map(async (type) => {
      try {
        const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=${type}`, {
          signal: AbortSignal.timeout(8000),
        });
        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
          dnsResults[type] = data.Answer.map(r => ({
            data: r.data,
            ttl: r.TTL,
          }));
        }
      } catch {
        // Skip failed DNS lookups silently
      }
    });

    await Promise.all(dnsPromises);

    const aRecords = dnsResults.A || [];
    const aaaaRecords = dnsResults.AAAA || [];
    const mxRecords = dnsResults.MX || [];
    const nsRecords = dnsResults.NS || [];
    const txtRecords = dnsResults.TXT || [];
    const soaRecords = dnsResults.SOA || [];

    const riskIndicators = [];
    if (mxRecords.length === 0) riskIndicators.push('No MX records found');
    if (nsRecords.length === 0) riskIndicators.push('No NS records found');
    if (aRecords.length === 0 && aaaaRecords.length === 0) riskIndicators.push('No A/AAAA records found');

    const riskLevel = riskIndicators.length > 2 ? 'high' : riskIndicators.length > 0 ? 'medium' : 'low';

    res.json({
      status: 'ok',
      domain: cleanDomain,
      ip: aRecords[0]?.data || null,
      registrar: 'Source unavailable',
      riskLevel,
      created: soaRecords[0]?.data || 'Source unavailable',
      riskIndicators,
      dns: {
        A: aRecords.map(r => r.data),
        AAAA: aaaaRecords.map(r => r.data),
        MX: mxRecords.map(r => r.data),
        NS: nsRecords.map(r => r.data),
        TXT: txtRecords.map(r => r.data),
      },
    });
  } catch (err) {
    console.error('Domain intel error:', err.message);
    res.status(500).json({ error: 'Failed to lookup domain' });
  }
});

// --- URL Security Check with phishing detection heuristics ---
app.post('/api/security/url-check', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    const flags = [];
    let riskScore = 0;

    // Check HTTPS
    if (parsed.protocol !== 'https:') {
      flags.push('Not using HTTPS');
      riskScore += 20;
    }

    // Check for suspicious patterns in domain
    const suspiciousPatterns = [
      { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, flag: 'IP address used instead of domain' },
      { pattern: /login|signin|verify|account|secure|update/i, flag: 'Suspicious keyword in URL' },
      { pattern: /-{3,}/, flag: 'Multiple hyphens in domain' },
      { pattern: /\.(tk|ml|ga|cf|gq|xyz|top|buzz|club)$/i, flag: 'Suspicious TLD' },
      { pattern: /bit\.ly|tinyurl|t\.co|goo\.gl|is\.gd/i, flag: 'URL shortener detected' },
      { pattern: /@/, flag: 'Contains @ symbol (possible credential trick)' },
    ];

    for (const { pattern, flag } of suspiciousPatterns) {
      if (pattern.test(url)) {
        flags.push(flag);
        riskScore += 15;
      }
    }

    // Check for excessive subdomains
    const subdomains = domain.split('.').length;
    if (subdomains > 4) {
      flags.push('Excessive subdomain depth');
      riskScore += 10;
    }

    // Check for encoded characters
    if (/%[0-9a-fA-F]{2}/i.test(parsed.pathname) || /%[0-9a-fA-F]{2}/i.test(parsed.search)) {
      flags.push('Contains URL-encoded characters');
      riskScore += 10;
    }

    // Check path length
    if (parsed.pathname.length > 100) {
      flags.push('Unusually long URL path');
      riskScore += 10;
    }

    // Try to fetch the URL and check response
    let httpStatus = 'Unknown';
    let redirects = 0;
    let finalUrl = url;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      let currentUrl = url;
      let redirectCount = 0;
      const maxRedirects = 5;

      while (redirectCount < maxRedirects) {
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
        });

        httpStatus = `${response.status} ${response.statusText || ''}`.trim();

        if ([301, 302, 303, 307, 308].includes(response.status)) {
          redirectCount++;
          const location = response.headers.get('location');
          if (location) {
            currentUrl = new URL(location, currentUrl).href;
            finalUrl = currentUrl;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      redirects = redirectCount;
      clearTimeout(timeout);

      if (redirects > 3) {
        flags.push('Excessive redirects detected');
        riskScore += 15;
      }

      // Check if redirected to different domain
      const finalDomain = new URL(finalUrl).hostname;
      if (finalDomain !== domain) {
        flags.push(`Redirected to different domain: ${finalDomain}`);
        riskScore += 20;
      }
    } catch {
      httpStatus = 'Connection failed';
      flags.push('Could not connect to URL');
      riskScore += 25;
    }

    const safe = riskScore < 30;
    const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

    res.json({
      status: 'ok',
      safe,
      riskLevel,
      riskScore,
      protocol: parsed.protocol,
      domain,
      httpStatus,
      redirects,
      finalUrl,
      flags,
      message: safe
        ? 'URL appears to be safe based on heuristic analysis.'
        : `URL shows ${flags.length} potential security concern(s). Exercise caution.`,
    });
  } catch {
    res.status(400).json({ error: 'Invalid URL format' });
  }
});

// --- SSL/TLS Certificate Check with real cert parsing ---
app.get('/api/security/ssl-check', async (req, res) => {
  const { host } = req.query;
  if (!host) return res.status(400).json({ error: 'Host parameter required' });

  const cleanHost = host.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  try {
    const cert = await new Promise((resolve, reject) => {
      const socket = tls.connect(443, cleanHost, {
        servername: cleanHost,
        rejectUnauthorized: false,
        timeout: 10000,
      }, () => {
        const peerCert = socket.getPeerCertificate();
        socket.end();
        if (peerCert && peerCert.subject) {
          resolve(peerCert);
        } else {
          reject(new Error('No certificate returned'));
        }
      });

      socket.on('error', reject);
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timed out'));
      });
    });

    const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
    const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
    const now = new Date();
    const daysUntilExpiry = validTo ? Math.floor((validTo - now) / (1000 * 60 * 60 * 24)) : null;

    const isValid = cert.valid_from && cert.valid_to
      ? now >= new Date(cert.valid_from) && now <= new Date(cert.valid_to)
      : false;

    const warnings = [];
    if (daysUntilExpiry !== null && daysUntilExpiry < 30) {
      warnings.push(`Certificate expires in ${daysUntilExpiry} days`);
    }
    if (cert.issuer && (cert.issuer.CN || '').toLowerCase().includes('self-signed')) {
      warnings.push('Self-signed certificate detected');
    }

    res.json({
      status: 'ok',
      valid: isValid,
      issuer: cert.issuer ? [cert.issuer.CN, cert.issuer.O, cert.issuer.C].filter(Boolean).join(', ') : 'Source unavailable',
      subject: cert.subject ? [cert.subject.CN, cert.subject.O, cert.subject.C].filter(Boolean).join(', ') : cleanHost,
      validFrom: cert.valid_from || 'Source unavailable',
      validTo: cert.valid_to || 'Source unavailable',
      daysUntilExpiry,
      serialNumber: cert.serialNumber || 'Source unavailable',
      fingerprint: cert.fingerprint || 'Source unavailable',
      protocol: cert.protocol || 'TLS',
      warnings,
      message: isValid
        ? `SSL certificate is valid${daysUntilExpiry !== null ? ` (expires in ${daysUntilExpiry} days)` : ''}`
        : 'SSL certificate issue detected — connection may not be secure',
    });
  } catch (err) {
    console.error('SSL check error:', err.message);
    res.json({
      status: 'ok',
      valid: false,
      issuer: 'Source unavailable',
      subject: cleanHost,
      validFrom: 'Source unavailable',
      validTo: 'Source unavailable',
      daysUntilExpiry: null,
      serialNumber: 'Source unavailable',
      fingerprint: 'Source unavailable',
      protocol: 'Source unavailable',
      warnings: ['Could not establish SSL connection'],
      message: `Could not verify SSL: ${err.message}`,
    });
  }
});

// --- Security Headers Check ---
app.post('/api/security/headers-check', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
    const headers = Object.fromEntries(response.headers.entries());

    const checks = [
      { name: 'Strict-Transport-Security', status: headers['strict-transport-security'] ? 'good' : 'missing', value: headers['strict-transport-security'], recommendation: 'Add HSTS header to enforce HTTPS' },
      { name: 'Content-Security-Policy', status: headers['content-security-policy'] ? 'good' : 'missing', value: headers['content-security-policy'], recommendation: 'Add CSP header to prevent XSS' },
      { name: 'X-Content-Type-Options', status: headers['x-content-type-options'] === 'nosniff' ? 'good' : 'missing', value: headers['x-content-type-options'], recommendation: 'Add X-Content-Type-Options: nosniff' },
      { name: 'X-Frame-Options', status: headers['x-frame-options'] ? 'good' : 'missing', value: headers['x-frame-options'], recommendation: 'Add X-Frame-Options to prevent clickjacking' },
      { name: 'X-XSS-Protection', status: headers['x-xss-protection'] ? 'warning' : 'missing', value: headers['x-xss-protection'], recommendation: 'Deprecated header — use CSP instead' },
      { name: 'Referrer-Policy', status: headers['referrer-policy'] ? 'good' : 'missing', value: headers['referrer-policy'], recommendation: 'Add Referrer-Policy header' },
      { name: 'Permissions-Policy', status: headers['permissions-policy'] ? 'good' : 'missing', value: headers['permissions-policy'], recommendation: 'Add Permissions-Policy to restrict features' },
    ];

    const good = checks.filter(h => h.status === 'good').length;
    const score = Math.round((good / checks.length) * 100);

    res.json({ score, headers: checks });
  } catch (err) {
    console.error('Headers check error:', err.message);
    res.status(500).json({ error: 'Failed to check headers', message: err.message });
  }
});

// --- CVE Search via NVD API (supports both CVE ID and keyword search) ---
app.get('/api/security/cve', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter required' });

  const trimmed = query.trim();
  const isCVEId = /^CVE-\d{4}-\d{4,}$/i.test(trimmed);

  try {
    let apiUrl;
    if (isCVEId) {
      apiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(trimmed.toUpperCase())}`;
    } else {
      apiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(trimmed)}&resultsPerPage=10`;
    }

    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });

    if (!response.ok) {
      const errText = await response.text();
      console.error('NVD API error:', response.status, errText);
      return res.status(502).json({ status: 'error', message: 'NVD API returned an error. Please try again later.' });
    }

    const data = await response.json();

    if (!data.vulnerabilities || data.vulnerabilities.length === 0) {
      return res.json({ status: 'ok', totalResults: 0, vulnerabilities: [], message: `No vulnerabilities found for "${trimmed}".` });
    }

    const vulnerabilities = data.vulnerabilities.map(v => {
      const cve = v.cve;
      const metric = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || cve.metrics?.cvssMetricV2?.[0];

      // Affected versions from configurations (CPE)
      const affectedProducts = [];
      const configs = cve.configurations || [];
      for (const config of configs) {
        for (const node of config.nodes || []) {
          for (const match of node.cpeMatch || []) {
            if (match.criteria) {
              const parts = match.criteria.split(':');
              const vendor = parts[3] || '';
              const product = parts[4] || '';
              const versionStart = match.versionStartIncluding || match.versionStartExcluding || '';
              const versionEnd = match.versionEndIncluding || match.versionEndExcluding || '';
              const vulnerable = match.vulnerable !== false;

              if (vulnerable && product) {
                let versionRange = '';
                if (versionStart && versionEnd) {
                  versionRange = `${versionStart} to ${versionEnd}`;
                } else if (versionStart) {
                  versionRange = `${versionStart} and later`;
                } else if (versionEnd) {
                  versionRange = `up to ${versionEnd}`;
                } else if (match.version && match.version !== '*' && match.version !== '-') {
                  versionRange = match.version;
                } else {
                  versionRange = 'All versions';
                }

                const existing = affectedProducts.find(p => p.vendor === vendor && p.product === product);
                if (existing) {
                  if (!existing.versions.includes(versionRange)) existing.versions.push(versionRange);
                } else {
                  affectedProducts.push({ vendor, product, versions: [versionRange] });
                }
              }
            }
          }
        }
      }

      // References / external links
      const references = (cve.references || []).map(ref => ({
        url: ref.url,
        source: ref.source || 'NVD',
        tags: ref.tags || [],
      }));

      // Weaknesses / CWE
      const weaknesses = [];
      for (const weak of cve.weaknesses || []) {
        for (const desc of weak.description || []) {
          if (desc.value && desc.value !== 'NVD-CWE-noinfo') {
            weaknesses.push(desc.value);
          }
        }
      }

      return {
        id: cve.id,
        description: cve.descriptions?.[0]?.value || 'Source unavailable',
        cvssScore: metric?.cvssData?.baseScore || null,
        severity: metric?.cvssData?.baseSeverity || (metric?.cvssData?.baseScore >= 9 ? 'CRITICAL' : metric?.cvssData?.baseScore >= 7 ? 'HIGH' : metric?.cvssData?.baseScore >= 4 ? 'MEDIUM' : 'LOW'),
        vectorString: metric?.cvssData?.vectorString || metric?.cvssData?.vector || null,
        published: cve.published?.split('T')[0] || 'Source unavailable',
        lastModified: cve.lastModified?.split('T')[0] || 'Source unavailable',
        weaknesses,
        affectedProducts: affectedProducts.slice(0, 20),
        references: references.slice(0, 15),
        url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
      };
    });

    res.json({
      status: 'ok',
      totalResults: data.totalResults || vulnerabilities.length,
      vulnerabilities,
    });
  } catch (err) {
    console.error('CVE search error:', err.message);
    if (err.name === 'TimeoutError' || err.cause?.code === 'ABORT_ERR') {
      return res.status(504).json({ status: 'error', message: 'NVD API request timed out. Please try again.' });
    }
    res.status(500).json({ status: 'error', message: 'Failed to search CVEs. Please try again later.' });
  }
});

// --- Live CVE feed (recent disclosures from NVD) ---
// NVD allows ~5 requests / 30s unauthenticated, and every visitor hits this,
// so the result is cached process-wide and served stale on upstream failure.
const cveFeedCache = { data: null, fetchedAt: 0, inFlight: null };
const CVE_FEED_TTL = 15 * 60 * 1000;

// The NVD query and shaping live in shared/nvdFeed.js, which the Vercel
// function (api/security/cve-feed.js) and the browser fallback also use.
const loadCveFeed = () => fetchNvdFeed({ apiKey: process.env.NVD_API_KEY });

app.get('/api/security/cve-feed', async (_req, res) => {
  const fresh = Date.now() - cveFeedCache.fetchedAt < CVE_FEED_TTL;
  if (cveFeedCache.data && fresh) {
    return res.json({ ...cveFeedCache.data, cached: true, fetchedAt: cveFeedCache.fetchedAt });
  }

  try {
    // Collapse concurrent misses into one upstream request.
    if (!cveFeedCache.inFlight) {
      cveFeedCache.inFlight = loadCveFeed().finally(() => { cveFeedCache.inFlight = null; });
    }
    const data = await cveFeedCache.inFlight;
    cveFeedCache.data = data;
    cveFeedCache.fetchedAt = Date.now();
    res.json({ ...data, cached: false, fetchedAt: cveFeedCache.fetchedAt });
  } catch (err) {
    console.error('CVE feed error:', err.message);
    if (cveFeedCache.data) {
      // Stale data beats an empty panel.
      return res.json({ ...cveFeedCache.data, cached: true, stale: true, fetchedAt: cveFeedCache.fetchedAt });
    }
    res.status(502).json({ status: 'error', message: 'Could not reach the NVD feed. Please try again shortly.' });
  }
});

// --- Hash Analyzer — Generate MD5, SHA-1, SHA-256, SHA-512 ---
app.post('/api/security/hash-analyze', async (req, res) => {
  const { input, algorithm } = req.body;
  if (!input) return res.status(400).json({ error: 'Input text is required' });

  try {
    const inputStr = String(input);
    const hashes = {
      md5: crypto.createHash('md5').update(inputStr).digest('hex'),
      sha1: crypto.createHash('sha1').update(inputStr).digest('hex'),
      sha256: crypto.createHash('sha256').update(inputStr).digest('hex'),
      sha512: crypto.createHash('sha512').update(inputStr).digest('hex'),
    };

    const inputLength = inputStr.length;
    const byteLength = Buffer.byteLength(inputStr, 'utf8');

    const entropyEstimate = Math.log2(Math.pow(2, Math.ceil(Math.log2(byteLength * 8 || 1)))) || 0;

    const charsetSize = (() => {
      let size = 0;
      if (/[a-z]/.test(inputStr)) size += 26;
      if (/[A-Z]/.test(inputStr)) size += 26;
      if (/[0-9]/.test(inputStr)) size += 10;
      if (/[^A-Za-z0-9]/.test(inputStr)) size += 33;
      return size || 1;
    })();

    const characterAnalysis = {
      lowercase: (inputStr.match(/[a-z]/g) || []).length,
      uppercase: (inputStr.match(/[A-Z]/g) || []).length,
      digits: (inputStr.match(/[0-9]/g) || []).length,
      special: (inputStr.match(/[^A-Za-z0-9]/g) || []).length,
      spaces: (inputStr.match(/\s/g) || []).length,
    };

    const selectedHash = algorithm && hashes[algorithm] ? hashes[algorithm] : null;

    res.json({
      status: 'ok',
      input: inputStr.substring(0, 200),
      inputLength,
      byteLength,
      charsetSize,
      hashes,
      selectedHash,
      characterAnalysis,
      strengthEstimate: charsetSize >= 60 && inputLength >= 16 ? 'strong' : charsetSize >= 30 && inputLength >= 8 ? 'moderate' : 'weak',
      message: 'Hashes generated using Node.js crypto module. These are deterministic — same input always produces same output.',
    });
  } catch (err) {
    console.error('Hash analysis error:', err.message);
    res.status(500).json({ error: 'Failed to generate hashes' });
  }
});

// --- IOC Analyzer — Extract IOCs from text/logs ---
app.post('/api/security/ioc-analyze', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text input is required' });

  try {
    const inputText = String(text);

    const patterns = {
      ipv4: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
      ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
      domain: /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      url: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g,
      md5: /\b[0-9a-fA-F]{32}\b/g,
      sha1: /\b[0-9a-fA-F]{40}\b/g,
      sha256: /\b[0-9a-fA-F]{64}\b/g,
      sha512: /\b[0-9a-fA-F]{128}\b/g,
      cve: /\bCVE-\d{4}-\d{4,}\b/g,
      filePath: /\b(?:[a-zA-Z]:\\|\/)(?:[^\\\/:*?"<>|\s]+[\\\/])*[^\\\/:*?"<>|\s]+\b/g,
      registryKey: /\b(?:HKLM|HKCU|HKCR|HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER)\\[^\s]+/g,
    };

    const results = {};
    const iocsByType = {};
    let totalIOCs = 0;

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = [...new Set(inputText.match(pattern) || [])];
      if (matches.length > 0) {
        const filtered = matches.filter(m => {
          if (type === 'domain') {
            const lower = m.toLowerCase();
            return !['localhost', 'example.com', 'example.org', 'example.net'].includes(lower);
          }
          return true;
        });
        if (filtered.length > 0) {
          results[type] = filtered;
          iocsByType[type] = filtered.length;
          totalIOCs += filtered.length;
        }
      }
    }

    const riskIndicators = [];
    if (results.url) riskIndicators.push('Contains URLs — verify before clicking');
    if (results.ipv4 || results.ipv6) riskIndicators.push('Contains IP addresses — check for malicious infrastructure');
    if (results.md5 || results.sha1 || results.sha256 || results.sha512) riskIndicators.push('Contains file hashes — cross-reference with threat intelligence');
    if (results.cve) riskIndicators.push('References known CVEs — check for active exploitation');
    if (results.filePath || results.registryKey) riskIndicators.push('Contains system artifacts — possible malware indicators');

    const riskLevel = totalIOCs > 10 ? 'high' : totalIOCs > 5 ? 'medium' : totalIOCs > 0 ? 'low' : 'none';

    res.json({
      status: 'ok',
      totalIOCs,
      iocsByType,
      results,
      riskIndicators,
      riskLevel,
      message: totalIOCs > 0
        ? `Extracted ${totalIOCs} IOC(s) across ${Object.keys(results).length} type(s). Review and cross-reference with threat intelligence feeds.`
        : 'No indicators of compromise detected in the provided text.',
    });
  } catch (err) {
    console.error('IOC analysis error:', err.message);
    res.status(500).json({ error: 'Failed to analyze IOCs' });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
