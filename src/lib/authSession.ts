export interface PortalUser {
  email: string;
  displayName: string;
  role: 'owner' | 'admin';
}

// Held strictly in JS memory (never localStorage or sessionStorage)
let sessionToken: string | null = null;
let sessionUser: PortalUser | null = null;

export function getAuthToken(): string | null {
  return sessionToken;
}

export function getPortalUser(): PortalUser | null {
  return sessionUser;
}

export function setPortalSession(token: string, user: PortalUser): void {
  sessionToken = token;
  sessionUser = user;
}

export function clearPortalSession(): void {
  sessionToken = null;
  sessionUser = null;
}

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra ?? {}) };
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }
  return headers;
}
