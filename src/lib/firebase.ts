import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

const recaptchaSiteKey = (
  import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY ||
  ''
).trim();

if (recaptchaSiteKey && typeof window !== 'undefined') {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    console.warn('Firebase App Check could not initialize. Verify the site key, provider, and allowed domain.');
  }
} else if (typeof window !== 'undefined') {
  console.warn('Firebase App Check is not configured. Public Firestore writes remain exposed to automated abuse until App Check is enabled and enforced.');
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_OWNER_EMAIL = 'dejawoot99@gmail.com';

export function isOwnerEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase());
}

export const PAYLOAD_LIMITS = {
  fullNameMax: 120,
  companyMax: 140,
  emailMax: 160,
  websiteMax: 300,
  teamSizeMax: 40,
  messageMax: 2000,
  stageTagMax: 40,
  designPartnerMax: 140,
  notesMax: 2000,
  nextBriefingMax: 120,
  partnerSandboxMax: 160,
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  _path: string | null,
): never {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : 'unknown';
  // Do not log inquiry paths, emails, user IDs, provider data, or raw payloads.
  console.error('Firestore operation failed', { operationType, code });
  throw new Error(`Firestore ${operationType} operation failed.`);
}

export function sanitizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim().slice(0, PAYLOAD_LIMITS.websiteMax);
  if (!trimmed) return '';
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString().slice(0, PAYLOAD_LIMITS.websiteMax);
    }
    return '';
  } catch {
    return '';
  }
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
