/**
 * Verification suite specification for the "Dirty Dozen" adversarial payloads
 * documented in security_spec.md against firestore.rules.
 */
export const DIRTY_DOZEN_CASES = [
  { id: 1, name: 'Unauthenticated list scrape on /inquiries, /admin_invites, or /public_config', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unauthenticated read on /inquiries/{id} or /activity/{aid}', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Non-admin list/get of closed briefing_sessions (isOpen == false)', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow field injection (isApproved: true) on create', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Status/stage shortcutting (status: scheduled, stageTag: Revenue) on create', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Client timestamp forgery on create', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Unverified admin email spoof (email_verified: false)', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Self-assigned admin escalation in /admins or /admin_invites', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Resource poisoning via oversized message or preferredSession', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Activity log actorEmail spoof or update/delete attempt', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Mismatched lane/subTrack, invalid email, or javascript: website URL', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Non-admin write to /public_config/site or /briefing_sessions/{id}', expected: 'PERMISSION_DENIED' },
] as const;
