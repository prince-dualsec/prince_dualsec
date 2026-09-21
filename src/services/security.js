import { BACKEND_URL } from './apiBase';

export async function getCVEFeed() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/security/cve-feed`);
    const data = await res.json();
    if (!res.ok) {
      return { status: 'error', message: data.message || 'Feed unavailable.' };
    }
    return data;
  } catch {
    return { status: 'error', message: 'Backend server unreachable — start it with npm run dev:server.' };
  }
}

export async function checkPasswordBreach(password) {
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
    return { status: 'error', message: 'Backend server unreachable.' };
  }
}
