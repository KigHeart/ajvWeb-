/**
 * Verification suite specification for the "Dirty Dozen" adversarial payloads
 * documented in security_spec.md against firestore.rules.
 */
export const DIRTY_DOZEN_CASES = [
  { id: 1, name: 'Unauthenticated list scrape on /inquiries, /discovery_orgs, /venture_opportunities, or /public_config', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unauthenticated single get on /inquiries/{id}, /discovery_orgs/{id}, or /venture_opportunities/{id}', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Signed-in non-admin read/write on /discovery_orgs or /venture_opportunities', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow field injection (isApproved: true) on create', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Scorecard criterion overflow (e.g. scoreWtp: 999) on /venture_opportunities', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Orphaned orgId reference on /venture_opportunities', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Unverified admin email spoof (email_verified: false)', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Self-assigned admin escalation in /admins or /admin_invites', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Resource poisoning via oversized message or workflowsSummary', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Path ID poisoning on /inquiries/{badId} or /public_config/other', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Mismatched lane/subTrack, invalid email, or javascript: website URL', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Unauthenticated or non-admin write to /public_config/site', expected: 'PERMISSION_DENIED' },
] as const;
