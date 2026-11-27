# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Global Default Deny**: Unmatched collections and documents are explicitly denied for all read and write operations.
2. **PII Isolation on Inquiries**: `/inquiries/{inquiryId}` contains submitter names and email addresses (`email`, `fullName`, `message`). Public visitors may **create** a new inquiry, but **never** `get`, `list`, `update`, or `delete` any inquiry. Only verified AJV admins (`isAdmin()`) may read, list, update, or delete inquiries.
3. **Immutable Inquiry Activity Audit Trail**: `/inquiries/{inquiryId}/activity/{activityId}` enforces the Master Gate (`exists(/inquiries/{inquiryId})`), restricts all reads/creates strictly to `isAdmin()` with `actorEmail == request.auth.token.email` and `createdAt == request.time`, and permanently forbids updates or deletes.
4. **Create-Time State Integrity**: Every newly created inquiry MUST start with `status == 'new'`, `stageTag == ''`, `designPartner == ''`, `notes == ''`, `createdAt == request.time`, and `updatedAt == request.time`.
5. **Immutable Audit Fields & Temporal Integrity**: After creation, `createdAt`, `lane`, `subTrack`, `fullName`, `company`, `email`, `website`, `teamSize`, `preferredSession`, and `message` remain immutable; admin triage updates are constrained via `affectedKeys().hasOnly(['status', 'stageTag', 'designPartner', 'notes', 'updatedAt'])` and `updatedAt == request.time`.
6. **Public Briefing Sessions (`briefing_sessions`)**: List/get reads for non-admins strictly require `resource.data.isOpen == true`; closed sessions and all create/update/delete operations are restricted to `isAdmin()`.
7. **Verified Admin Authentication & Team Roster**: Admin privileges require `request.auth != null && request.auth.token.email_verified == true` and match `dejawoot99@gmail.com` or `/admins/{uid}` or `/admin_invites/{verifiedEmail}`. Only the bootstrapped owner may create or revoke `/admins` and `/admin_invites` records.
8. **Public CMS Isolation**: `/public_config/site` is the only publicly readable `get` document (no `list` queries allowed) and holds zero PII, writable only by `isAdmin()`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated List Scrape**: Anonymous user calls `list /inquiries`, `list /admin_invites`, or `list /public_config` -> MUST return `PERMISSION_DENIED`.
2. **Unauthenticated Single Read**: Anonymous user calls `get /inquiries/{id}` or `get /inquiries/{id}/activity/{aid}` -> MUST return `PERMISSION_DENIED`.
3. **Closed Session Scrape**: Non-admin queries `briefing_sessions` with `isOpen == false` -> MUST return `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Public user submits inquiry with extra key `isApproved: true` -> MUST return `PERMISSION_DENIED`.
5. **Status/Pipeline Shortcutting on Create**: Public user submits inquiry with `status: 'scheduled'` or `stageTag: 'Revenue'` -> MUST return `PERMISSION_DENIED`.
6. **Client Timestamp Forgery on Create**: Public user submits `createdAt` in the past instead of `request.time` -> MUST return `PERMISSION_DENIED`.
7. **Unverified Admin Email Spoof**: User with `email: 'dejawoot99@gmail.com'` and `email_verified: false` tries to read `/inquiries` -> MUST return `PERMISSION_DENIED`.
8. **Self-Assigned Admin Escalation**: Non-owner user tries to create `/admins/{theirUid}` or `/admin_invites/{theirEmail}` -> MUST return `PERMISSION_DENIED`.
9. **Resource Poisoning via Oversized String**: Public user submits `message > 2000` chars or `preferredSession > 140` chars -> MUST return `PERMISSION_DENIED`.
10. **Activity Subcollection Tampering**: Admin tries to spoof `actorEmail` as another admin or delete/edit an existing `/activity` entry -> MUST return `PERMISSION_DENIED`.
11. **Invalid Lane Pairing / Malformed Email / Unsafe URL**: Public user submits mismatched `lane` + `subTrack`, invalid `email`, or `website: 'javascript:alert(1)'` -> MUST return `PERMISSION_DENIED`.
12. **Public CMS Tampering**: Unauthenticated or non-admin user tries to write `/public_config/site` or `/briefing_sessions/{id}` -> MUST return `PERMISSION_DENIED`.


## 3. Executable Verification

The cases above are implemented as Firestore Emulator tests in `firestore.rules.test.ts`. Run them with `npm run test:rules`; CI runs this suite before the Pages build. The suite is isolated to the emulator and must never be pointed at production data.

## 4. Additional Production Controls

Firestore rules are necessary but do not provide per-IP rate limiting or prove that a request originated from the intended website. Configure Firebase App Check for the production web app, monitor legitimate traffic, and then enforce App Check for Cloud Firestore in Firebase Console. Until enforcement is enabled, public inquiry creation remains exposed to automated abuse even though document reads and privileged writes are denied.

GitHub Pages serves only the static frontend; it does not run `server.ts`. Do not put secrets in browser code or Vite-exposed variables. Notifications and future agentic actions must run in a separately deployed trusted backend with scoped credentials and deterministic authorization.
