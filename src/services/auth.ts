import { User, AuthSession } from '../types';

const SESSION_STORAGE_KEY = 'ck_auth_session';
const DEFAULT_MAX_AGE_MINUTES = 120; // 2 jam sesuai ringkasan brainstorming

export const DEFAULT_GOOGLE_USER: User = {
  id: 'usr_google_pulung036',
  email: 'pulungbagas036@gmail.com',
  name: 'Bagas Pulung',
  image_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
};

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
