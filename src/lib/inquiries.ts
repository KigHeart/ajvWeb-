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
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type { FounderTrack, InquiryLane, PartnerType, TrainingFocus } from '../data/memorandum';
import {
  ADMIN_OWNER_EMAIL,
  db,
  EMAIL_PATTERN,
  handleFirestoreError,
  OperationType,
  PAYLOAD_LIMITS,
  sanitizeWebsiteUrl,
} from './firebase';

export type InquirySubTrack = FounderTrack | TrainingFocus | PartnerType;
export type InquiryStatus = 'new' | 'reviewing' | 'scheduled' | 'archived';

export interface CreateInquiryInput {
  lane: InquiryLane;
  subTrack: InquirySubTrack;
  fullName: string;
  company: string;
  email: string;
  website: string;
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
  message: string;
  status: InquiryStatus;
  notes: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

const INQUIRIES_PATH = 'inquiries';
const ADMINS_PATH = 'admins';

export async function submitInquiry(input: CreateInquiryInput): Promise<{ id: string }> {
  const fullName = input.fullName.trim().slice(0, PAYLOAD_LIMITS.fullNameMax);
  const company = input.company.trim().slice(0, PAYLOAD_LIMITS.companyMax);
  const email = input.email.trim().slice(0, PAYLOAD_LIMITS.emailMax);
  const website = input.lane === 'founder' ? sanitizeWebsiteUrl(input.website) : '';
  const message = input.message.trim().slice(0, PAYLOAD_LIMITS.messageMax);

  if (!fullName || !EMAIL_PATTERN.test(email)) {
    throw new Error('Please enter your name and a valid email address.');
  }

  try {
    const docRef = await addDoc(collection(db, INQUIRIES_PATH), {
      lane: input.lane,
      subTrack: input.subTrack,
      fullName,
      company,
      email,
      website,
      message,
      status: 'new' as InquiryStatus,
      notes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, INQUIRIES_PATH);
  }
}

export async function checkAdminAccess(
  uid: string,
  email: string | null,
  emailVerified: boolean,
): Promise<boolean> {
  if (!uid || !emailVerified) return false;
  if (email?.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase()) {
    return true;
  }

  try {
    const snap = await getDoc(doc(db, ADMINS_PATH, uid));
    return snap.exists();
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
          message: typeof data.message === 'string' ? data.message : '',
          status: (data.status as InquiryStatus) ?? 'new',
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
  status: InquiryStatus,
  notes: string,
): Promise<void> {
  const path = `${INQUIRIES_PATH}/${inquiryId}`;
  try {
    await updateDoc(doc(db, INQUIRIES_PATH, inquiryId), {
      status,
      notes: notes.trim().slice(0, PAYLOAD_LIMITS.notesMax),
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
