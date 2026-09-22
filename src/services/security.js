import { BACKEND_URL } from './apiBase';
import { fetchNvdFeed } from '../../shared/nvdFeed.js';

/**
 * Live Threat Feed data.
 *
 * 1. Our own endpoint first — the Vercel function in production, the Express
 *    server in development. It is cached for every visitor, so it is fast and
 *    keeps NVD's rate limit out of the picture.
 * 2. If that is unreachable (static hosting, backend not running, function
 *    error), fetch NVD straight from the browser; it allows cross-origin
 *    requests. The feed then still works, just more slowly.
 */
export async function getCVEFeed() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/security/cve-feed`);
    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      const data = await res.json();
      if (data.status === 'ok') return data;
    }
  } catch {
    // Fall through to the direct request.
  }

  try {
    return { ...(await fetchNvdFeed()), direct: true };
  } catch {
    return {
      status: 'error',
      message: 'The NVD vulnerability database is not responding right now. Please try again in a few minutes.',
    };
  }
}

async function sha1Hex(text) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Have I Been Pwned lookup using k-anonymity, done in the browser: only the
 * first 5 characters of the password's SHA-1 hash leave the device, which is
 * what the UI promises. (It used to POST the password itself to the backend,
 * which also meant it never worked on Vercel.)
 *
 * Web Crypto only exists in secure contexts (https or localhost). A phone
 * opening the dev server over plain http on the LAN falls back to the backend.
 */
export async function checkPasswordBreach(password) {
  if (typeof window !== 'undefined' && window.isSecureContext && window.crypto?.subtle) {
    try {
      const hash = await sha1Hex(password);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);

      // Add-Padding pads the response with fake zero-count entries, so its
      // size does not leak which prefix bucket was asked for.
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
      });
      if (!res.ok) throw new Error(`HIBP returned ${res.status}`);

      const text = await res.text();
      for (const line of text.split('\n')) {
        const [hashSuffix, occurrences] = line.split(':');
        if (hashSuffix?.trim() === suffix) {
          const count = parseInt(occurrences, 10) || 0;
          if (count > 0) {
            return { status: 'pwned', count, message: `This password has been seen ${count} times in data breaches` };
          }
          break;
        }
      }
      return { status: 'safe', count: 0, message: 'This password has not been found in known data breaches' };
    } catch {
      return {
        status: 'error',
        message: 'Could not reach the breach database. This does NOT mean the password is safe — please try again.',
      };
    }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/security/password-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { status: 'error', message: data.error || data.message || 'Request failed' };
    }
    return data;
  } catch {
    return { status: 'error', message: 'Breach lookup is unavailable over an insecure (http) connection.' };
  }
}
