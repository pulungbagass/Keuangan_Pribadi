import { User, AuthSession } from '../types';

const SESSION_STORAGE_KEY = 'ck_auth_session';
const DEFAULT_MAX_AGE_MINUTES = 120; // 2 jam

// Helper to decode Google JWT ID Token from Google Identity Services (GSI)
export function decodeGoogleCredential(credential: string): { sub: string; email: string; name: string; picture?: string } | null {
  try {
    const parts = credential.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      sub: parsed.sub || '',
      email: parsed.email || '',
      name: parsed.name || parsed.email?.split('@')[0] || '',
      picture: parsed.picture || '',
    };
  } catch (err) {
    console.warn('Failed to decode Google credential', err);
    return null;
  }
}

// Helper: encode base64url
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate JWT token representation
export function createJWTToken(user: User, durationMinutes: number = DEFAULT_MAX_AGE_MINUTES): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + durationMinutes * 60;
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    picture: user.image_url,
    iat,
    exp,
    iss: 'catatan-keuangan-auth',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(`mock_sig_${user.id}_${iat}_catatankeuangan`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function saveSession(user: User, durationMinutes: number = DEFAULT_MAX_AGE_MINUTES): AuthSession {
  const token = createJWTToken(user, durationMinutes);
  const issuedAt = Date.now();
  const expiresAt = issuedAt + durationMinutes * 60 * 1000;

  const session: AuthSession = {
    token,
    user,
    issuedAt,
    expiresAt,
    maxAgeMinutes: durationMinutes,
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session to localStorage', err);
  }

  return session;
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);

    // Verify expiry
    if (Date.now() >= session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function extendSession(minutesToAdd: number = 60): AuthSession | null {
  const current = getStoredSession();
  if (!current) return null;

  const newExpiresAt = Math.max(Date.now(), current.expiresAt) + minutesToAdd * 60 * 1000;
  const updatedSession: AuthSession = {
    ...current,
    expiresAt: newExpiresAt,
    maxAgeMinutes: Math.round((newExpiresAt - current.issuedAt) / (60 * 1000)),
    token: createJWTToken(current.user, Math.round((newExpiresAt - Date.now()) / (60 * 1000))),
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
  } catch (err) {
    console.error('Failed to update session', err);
  }

  return updatedSession;
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear session', err);
  }
}
