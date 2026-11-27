import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type { FounderTrack, InquiryLane, PartnerType, TrainingFocus } from '../data/memorandum';
import {
  db,
  EMAIL_PATTERN,
  handleFirestoreError,
  isOwnerEmail,
  OperationType,
  PAYLOAD_LIMITS,
  sanitizeWebsiteUrl,
} from './firebase';

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
  preferredSession?: string;
  message: string;
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
  preferredSession: string;
  message: string;
  status: InquiryStatus;
  stageTag: StageTag;
  designPartner: string;
  notes: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AdminInviteRecord {
  email: string;
  displayName: string;
  role: 'admin';
  addedBy: string;
  createdAt: Date | null;
}

export interface SiteConfig {
  incubationStatus: IncubationStatus;
  nextBriefingLabel: string;
  partnerSandboxNote: string;
  updatedAt?: Date | null;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  incubationStatus: 'Open',
  nextBriefingLabel: 'Monthly executive briefings · Nairobi & Virtual',
  partnerSandboxNote: 'Pilot sandbox slots open for banks and AI model providers',
};

const INQUIRIES_PATH = 'inquiries';
const ADMINS_PATH = 'admins';
const INVITES_PATH = 'admin_invites';
const PUBLIC_CONFIG_COLLECTION = 'public_config';
const PUBLIC_CONFIG_DOC = 'site';

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

  let createdId = '';
  try {
    const docRef = await addDoc(collection(db, INQUIRIES_PATH), {
      lane: input.lane,
      subTrack: input.subTrack,
      fullName,
      company,
      email,
      website,
      teamSize,
      preferredSession: (input.preferredSession ?? '').trim().slice(0, 140),
      message,
      status: 'new' as InquiryStatus,
      stageTag: '' as StageTag,
      designPartner: '',
      notes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    createdId = docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, INQUIRIES_PATH);
  }

  // Notifications are intentionally not sent from the public browser client.
  // Use a trusted Firestore-triggered backend when server-side delivery is deployed.

  return { id: createdId };
}

export async function checkAdminAccess(
  uid: string,
  email: string | null,
  emailVerified: boolean,
): Promise<boolean> {
  if (!uid || !emailVerified) return false;
  if (isOwnerEmail(email)) return true;

  try {
    const uidSnap = await getDoc(doc(db, ADMINS_PATH, uid));
    if (uidSnap.exists()) return true;

    if (email) {
      const inviteSnap = await getDoc(doc(db, INVITES_PATH, email.toLowerCase()));
      return inviteSnap.exists();
    }
    return false;
  } catch {
    return false;
  }
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  return null;
}

export function subscribeToInquiries(
  onData: (items: InquiryRecord[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, INQUIRIES_PATH), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: InquiryRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          lane: (data.lane as InquiryLane) ?? 'founder',
          subTrack: (data.subTrack as InquirySubTrack) ?? 'investment',
          fullName: typeof data.fullName === 'string' ? data.fullName : '',
          company: typeof data.company === 'string' ? data.company : '',
          email: typeof data.email === 'string' ? data.email : '',
          website: typeof data.website === 'string' ? data.website : '',
          teamSize: (data.teamSize as TeamSizeOption) ?? '',
          preferredSession: typeof data.preferredSession === 'string' ? data.preferredSession : '',
          message: typeof data.message === 'string' ? data.message : '',
          status: (data.status as InquiryStatus) ?? 'new',
          stageTag: (data.stageTag as StageTag) ?? '',
          designPartner: typeof data.designPartner === 'string' ? data.designPartner : '',
          notes: typeof data.notes === 'string' ? data.notes : '',
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, INQUIRIES_PATH);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
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
  const path = `${INQUIRIES_PATH}/${inquiryId}`;
  try {
    await updateDoc(doc(db, INQUIRIES_PATH, inquiryId), {
      status: updates.status,
      stageTag: updates.stageTag,
      designPartner: updates.designPartner.trim().slice(0, PAYLOAD_LIMITS.designPartnerMax),
      notes: updates.notes.trim().slice(0, PAYLOAD_LIMITS.notesMax),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInquiry(inquiryId: string): Promise<void> {
  const path = `${INQUIRIES_PATH}/${inquiryId}`;
  try {
    await deleteDoc(doc(db, INQUIRIES_PATH, inquiryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToAdminInvites(
  onData: (items: AdminInviteRecord[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, INVITES_PATH), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdminInviteRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          email: typeof data.email === 'string' ? data.email : d.id,
          displayName: typeof data.displayName === 'string' ? data.displayName : '',
          role: 'admin',
          addedBy: typeof data.addedBy === 'string' ? data.addedBy : '',
          createdAt: toDate(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, INVITES_PATH);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export async function addAdminInvite(
  rawEmail: string,
  rawName: string,
  addedByEmail: string,
): Promise<void> {
  const email = rawEmail.trim().toLowerCase().slice(0, PAYLOAD_LIMITS.emailMax);
  const displayName = rawName.trim().slice(0, PAYLOAD_LIMITS.fullNameMax);

  if (!EMAIL_PATTERN.test(email) || !displayName) {
    throw new Error('Please enter a valid name and email address.');
  }

  const path = `${INVITES_PATH}/${email}`;
  try {
    await setDoc(doc(db, INVITES_PATH, email), {
      email,
      displayName,
      role: 'admin',
      addedBy: addedByEmail.trim().toLowerCase().slice(0, PAYLOAD_LIMITS.emailMax),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeAdminInvite(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const path = `${INVITES_PATH}/${normalized}`;
  try {
    await deleteDoc(doc(db, INVITES_PATH, normalized));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchSiteConfig(): Promise<SiteConfig> {
  const path = `${PUBLIC_CONFIG_COLLECTION}/${PUBLIC_CONFIG_DOC}`;
  try {
    const snap = await getDoc(doc(db, PUBLIC_CONFIG_COLLECTION, PUBLIC_CONFIG_DOC));
    if (!snap.exists()) {
      return DEFAULT_SITE_CONFIG;
    }
    const data = snap.data();
    return {
      incubationStatus:
        (data.incubationStatus as IncubationStatus) || DEFAULT_SITE_CONFIG.incubationStatus,
      nextBriefingLabel:
        typeof data.nextBriefingLabel === 'string' && data.nextBriefingLabel.trim()
          ? data.nextBriefingLabel
          : DEFAULT_SITE_CONFIG.nextBriefingLabel,
      partnerSandboxNote:
        typeof data.partnerSandboxNote === 'string' && data.partnerSandboxNote.trim()
          ? data.partnerSandboxNote
          : DEFAULT_SITE_CONFIG.partnerSandboxNote,
      updatedAt: toDate(data.updatedAt),
    };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  const path = `${PUBLIC_CONFIG_COLLECTION}/${PUBLIC_CONFIG_DOC}`;
  try {
    await setDoc(doc(db, PUBLIC_CONFIG_COLLECTION, PUBLIC_CONFIG_DOC), {
      incubationStatus: config.incubationStatus,
      nextBriefingLabel: config.nextBriefingLabel.trim().slice(0, PAYLOAD_LIMITS.nextBriefingMax),
      partnerSandboxNote: config.partnerSandboxNote.trim().slice(0, PAYLOAD_LIMITS.partnerSandboxMax),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
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
