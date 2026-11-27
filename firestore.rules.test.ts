import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-ajentir-security';
let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function validInquiry(overrides: Record<string, unknown> = {}) {
  return {
    lane: 'founder',
    subTrack: 'investment',
    fullName: 'Test Founder',
    company: 'Example Ltd',
    email: 'founder@example.com',
    website: '',
    teamSize: '',
    preferredSession: '',
    message: 'A concise test inquiry.',
    status: 'new',
    stageTag: '',
    designPartner: '',
    notes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

test('public visitor can create a schema-complete inquiry', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(db, 'inquiries', 'public_inquiry_1'), validInquiry()));
});

test('public inquiry without preferredSession is rejected', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  const payload = validInquiry();
  delete (payload as Record<string, unknown>).preferredSession;
  await assertFails(setDoc(doc(db, 'inquiries', 'missing_session_1'), payload));
});

test('lane and sub-track combinations are validated as a pair', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(setDoc(
    doc(db, 'inquiries', 'invalid_pair_1'),
    validInquiry({ lane: 'founder', subTrack: 'bank' }),
  ));
});

test('anonymous visitors cannot list private inquiries', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDocs(collection(db, 'inquiries')));
});

test('unverified owner email cannot use the bootstrap admin grant', async () => {
  const db = testEnv.authenticatedContext('owner', {
    email: 'dejawoot99@gmail.com',
    email_verified: false,
  }).firestore();
  await assertFails(getDocs(collection(db, 'inquiries')));
});

test('verified bootstrap owner can list inquiries', async () => {
  const db = testEnv.authenticatedContext('owner', {
    email: 'dejawoot99@gmail.com',
    email_verified: true,
  }).firestore();
  await assertSucceeds(getDocs(collection(db, 'inquiries')));
});

test('UID admin record cannot grant access when its email belongs to another identity', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'admins', 'attacker_uid'), {
      email: 'different-person@example.com',
      displayName: 'Seeded record',
      role: 'admin',
      createdAt: new Date(),
    });
  });
  const db = testEnv.authenticatedContext('attacker_uid', {
    email: 'attacker@example.com',
    email_verified: true,
  }).firestore();
  await assertFails(getDocs(collection(db, 'inquiries')));
});

test('invite record with a non-admin role cannot grant access', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'admin_invites', 'invitee@example.com'), {
      email: 'invitee@example.com',
      displayName: 'Invitee',
      role: 'viewer',
      addedBy: 'owner@example.com',
      createdAt: new Date(),
    });
  });
  const db = testEnv.authenticatedContext('invitee_uid', {
    email: 'invitee@example.com',
    email_verified: true,
  }).firestore();
  await assertFails(getDocs(collection(db, 'inquiries')));
});
