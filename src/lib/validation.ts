export const ADMIN_OWNER_EMAIL = 'dejawoot99@gmail.com';

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
