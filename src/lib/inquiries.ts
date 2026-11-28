import type { FounderTrack, InquiryLane, PartnerType, TrainingFocus } from '../data/memorandum';
import {
  authHeaders,
  clearPortalSession,
  setPortalSession,
  type PortalUser,
} from './authSession';
import { EMAIL_PATTERN, PAYLOAD_LIMITS, sanitizeWebsiteUrl } from './validation';

export type InquirySubTrack = FounderTrack | TrainingFocus | PartnerType;
export type InquiryStatus = 'new' | 'reviewing' | 'scheduled' | 'archived';
export type TeamSizeOption = '' | '1-10 leaders' | '11-30 leaders' | '30+ leaders';
export type StageTag =
  | ''
  | 'Concept'
  | 'MVP'
  | 'Revenue'
  | 'Pilot Ready'
  | 'Credit Pool'
  | 'Cohort';
export type IncubationStatus = 'Open' | 'By Intro' | 'Waitlist';

export interface CreateInquiryInput {
  lane: InquiryLane;
  subTrack: InquirySubTrack;
  fullName: string;
  company: string;
  email: string;
  website: string;
  teamSize: TeamSizeOption;
  message: string;
  honeypot?: string;
}

export interface InquiryRecord {
  id: string;
  lane: InquiryLane;
  subTrack: InquirySubTrack;
  fullName: string;
  company: string;
  email: string;
  website: string;
  teamSize: TeamSizeOption;
  message: string;
  status: InquiryStatus;
  stageTag: StageTag;
  designPartner: string;
  notes: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface TeamMemberRecord {
  id: string;
  email: string;
  displayName: string;
  addedBy: string;
  createdAt: Date | null;
}

export interface SiteConfig {
  incubationStatus: IncubationStatus;
  nextBriefingLabel: string;
  partnerSandboxNote: string;
  updatedAt?: Date | null;
}

export interface AuthStatus {
  envPasscodeConfigured: boolean;
  ownerClaimed: boolean;
  ownerEmailHint: string;
}

export interface AdminHealthStatus {
  ok: boolean;
  database: string;
  emailAlertsConfigured: boolean;
  webhookAlertsConfigured: boolean;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  incubationStatus: 'Open',
  nextBriefingLabel: 'Monthly executive briefings · Nairobi & Virtual',
  partnerSandboxNote: 'Pilot sandbox slots open for banks and AI model providers',
};

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data: unknown = await res.json().catch(() => null);
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return fallback;
}

function isStaticHosting(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');
}

export async function submitInquiry(input: CreateInquiryInput): Promise<{ id: string }> {
  const fullName = input.fullName.trim().slice(0, PAYLOAD_LIMITS.fullNameMax);
  const company = input.company.trim().slice(0, PAYLOAD_LIMITS.companyMax);
  const email = input.email.trim().slice(0, PAYLOAD_LIMITS.emailMax);
  const website = input.lane === 'founder' ? sanitizeWebsiteUrl(input.website) : '';
  const teamSize: TeamSizeOption = input.lane === 'training' ? input.teamSize : '';
  const message = input.message.trim().slice(0, PAYLOAD_LIMITS.messageMax);

  if (!fullName || !EMAIL_PATTERN.test(email)) {
    throw new Error('Please enter your name and a valid email address.');
  }

  const res = await fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lane: input.lane,
      subTrack: input.subTrack,
      fullName,
      company,
      email,
      website,
      teamSize,
      message,
      websiteUrl: input.honeypot ?? '',
    }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Unable to submit inquiry right now.'));
  }

  const result = (await res.json().catch(() => ({}))) as { id?: string };
  return { id: typeof result.id === 'string' ? result.id : '' };
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  if (isStaticHosting()) {
    return { envPasscodeConfigured: false, ownerClaimed: true, ownerEmailHint: '' };
  }
  const res = await fetch('/api/auth/status');
  if (!res.ok) {
    throw new Error('Unable to reach server authentication.');
  }
  return (await res.json()) as AuthStatus;
}

export async function claimPortalPassword(input: {
  displayName: string;
  email: string;
  password: string;
}): Promise<PortalUser> {
  const res = await fetch('/api/auth/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Failed to set portal password.'));
  }
  const data = (await res.json()) as { token: string; user: PortalUser };
  setPortalSession(data.token, data.user);
  return data.user;
}

export async function loginPortal(input: {
  email?: string;
  password: string;
}): Promise<PortalUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Invalid password or email.'));
  }
  const data = (await res.json()) as { token: string; user: PortalUser };
  setPortalSession(data.token, data.user);
  return data.user;
}

export function logoutPortal(): void {
  clearPortalSession();
}

export async function fetchInquiries(): Promise<InquiryRecord[]> {
  const res = await fetch('/api/inquiries', { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Unable to load inquiries.'));
  }
  const data = (await res.json()) as {
    items: Array<
      Omit<InquiryRecord, 'createdAt' | 'updatedAt'> & {
        createdAt: string;
        updatedAt: string;
      }
    >;
  };
  return (data.items ?? []).map((item) => ({
    ...item,
    createdAt: parseIsoDate(item.createdAt),
    updatedAt: parseIsoDate(item.updatedAt),
  }));
}

export async function updateInquiryTriage(
  inquiryId: string,
  updates: {
    status: InquiryStatus;
    stageTag: StageTag;
    designPartner: string;
    notes: string;
  },
): Promise<void> {
  const res = await fetch(`/api/inquiries/${encodeURIComponent(inquiryId)}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      status: updates.status,
      stageTag: updates.stageTag,
      designPartner: updates.designPartner.trim().slice(0, PAYLOAD_LIMITS.designPartnerMax),
      notes: updates.notes.trim().slice(0, PAYLOAD_LIMITS.notesMax),
    }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Failed to save inquiry updates.'));
  }
}

export async function deleteInquiry(inquiryId: string): Promise<void> {
  const res = await fetch(`/api/inquiries/${encodeURIComponent(inquiryId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Failed to delete inquiry.'));
  }
}

export async function fetchTeamMembers(): Promise<TeamMemberRecord[]> {
  const res = await fetch('/api/team', { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Unable to load team members.'));
  }
  const data = (await res.json()) as {
    items: Array<Omit<TeamMemberRecord, 'createdAt'> & { createdAt: string }>;
  };
  return (data.items ?? []).map((m) => ({
    ...m,
    createdAt: parseIsoDate(m.createdAt),
  }));
}

export async function addTeamMember(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<TeamMemberRecord> {
  const res = await fetch('/api/team', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Unable to add team member.'));
  }
  const data = (await res.json()) as {
    item: Omit<TeamMemberRecord, 'createdAt'> & { createdAt: string };
  };
  return { ...data.item, createdAt: parseIsoDate(data.item.createdAt) };
}

export async function removeTeamMember(memberId: string): Promise<void> {
  const res = await fetch(`/api/team/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Unable to remove team member.'));
  }
}

export async function fetchAdminHealth(): Promise<AdminHealthStatus> {
  const res = await fetch('/api/admin/health', { headers: authHeaders() });
  if (!res.ok) {
    throw new Error('Unable to inspect server health.');
  }
  return (await res.json()) as AdminHealthStatus;
}

export async function fetchSiteConfig(): Promise<SiteConfig> {
  if (isStaticHosting()) {
    return DEFAULT_SITE_CONFIG;
  }
  try {
    const res = await fetch('/api/site-config');
    if (!res.ok) return DEFAULT_SITE_CONFIG;
    const data = (await res.json()) as {
      incubationStatus?: IncubationStatus;
      nextBriefingLabel?: string;
      partnerSandboxNote?: string;
      updatedAt?: string;
    };
    return {
      incubationStatus: data.incubationStatus ?? DEFAULT_SITE_CONFIG.incubationStatus,
      nextBriefingLabel: data.nextBriefingLabel?.trim() || DEFAULT_SITE_CONFIG.nextBriefingLabel,
      partnerSandboxNote:
        data.partnerSandboxNote?.trim() || DEFAULT_SITE_CONFIG.partnerSandboxNote,
      updatedAt: parseIsoDate(data.updatedAt),
    };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  const res = await fetch('/api/site-config', {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      incubationStatus: config.incubationStatus,
      nextBriefingLabel: config.nextBriefingLabel.trim().slice(0, PAYLOAD_LIMITS.nextBriefingMax),
      partnerSandboxNote: config.partnerSandboxNote.trim().slice(0, PAYLOAD_LIMITS.partnerSandboxMax),
    }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, 'Failed to update live site configuration.'));
  }
}

function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function exportInquiriesToCsv(items: InquiryRecord[]): void {
  const headers = [
    'Reference',
    'Created At',
    'Lane',
    'Sub-Track',
    'Status',
    'Stage Tag',
    'Full Name',
    'Organisation',
    'Email',
    'Website',
    'Leadership Size',
    'Design Partner',
    'Message',
    'Notes',
  ];

  const rows = items.map((item) => [
    item.id.slice(0, 8).toUpperCase(),
    item.createdAt ? item.createdAt.toISOString() : '',
    item.lane,
    item.subTrack,
    item.status,
    item.stageTag,
    item.fullName,
    item.company,
    item.email,
    item.website,
    item.teamSize,
    item.designPartner,
    item.message,
    item.notes,
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r) => r.map((cell) => escapeCsvCell(cell ?? '')).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `ajentir-inquiries-${stamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
