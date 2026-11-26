# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Global Default Deny**: Unmatched collections and documents are explicitly denied for all read and write operations.
2. **PII Isolation on Inquiries**: `/inquiries/{inquiryId}` contains submitter names and email addresses (`email`, `fullName`, `message`). Public visitors may **create** a new inquiry, but **never** `get`, `list`, `update`, or `delete` any inquiry. Only verified AJV admins (`isAdmin()`) may read, list, update, or delete inquiries.
3. **Create-Time State Integrity**: Every newly created inquiry MUST start with `status == 'new'`, `stageTag == ''`, `designPartner == ''`, `notes == ''`, `createdAt == request.time`, and `updatedAt == request.time`. Visitors cannot pre-set triage states or internal notes.
4. **Immutable Audit Fields & Temporal Integrity**: After creation, `createdAt`, `lane`, `subTrack`, `fullName`, `company`, `email`, `website`, `teamSize`, and `message` remain immutable; admin triage updates are constrained via `affectedKeys().hasOnly(['status', 'stageTag', 'designPartner', 'notes', 'updatedAt'])` and `updatedAt == request.time`.
5. **Bounded Payloads & IDs**: All document IDs must pass `isValidId(id)` (or `isValidEmailId(emailId)` on `/admin_invites`), and every string field enforces explicit `size()` limits and enum/regex checks.
6. **Verified Admin Authentication & Team Roster**: Admin privileges require `request.auth != null && request.auth.token.email_verified == true` and either match the bootstrapped owner email (`dejawoot99@gmail.com`) or exist in `/admins/{uid}` or `/admin_invites/{verifiedEmail}`. Only the bootstrapped owner may create or revoke `/admins` and `/admin_invites` records.
7. **Public CMS Isolation**: `/public_config/site` is the only publicly readable `get` document (no `list` queries allowed) and holds zero PII—strictly limited to `incubationStatus`, `nextBriefingLabel`, `partnerSandboxNote`, and `updatedAt`, writable only by verified admins.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated List Scrape**: Anonymous user calls `list /inquiries` or `list /admin_invites` or `list /public_config` -> MUST return `PERMISSION_DENIED`.
2. **Unauthenticated Single Read**: Anonymous user calls `get /inquiries/{id}` -> MUST return `PERMISSION_DENIED`.
3. **Signed-In Non-Admin Read**: Non-admin signed-in user calls `get` or `list` on `/inquiries` -> MUST return `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Public user submits inquiry with extra key `isApproved: true` -> MUST return `PERMISSION_DENIED` (`hasOnly` rejection).
5. **Status/Pipeline Shortcutting on Create**: Public user submits inquiry with `status: 'scheduled'` or `stageTag: 'Revenue'` -> MUST return `PERMISSION_DENIED`.
6. **Client Timestamp Forgery on Create**: Public user submits `createdAt` in the past instead of `request.time` -> MUST return `PERMISSION_DENIED`.
7. **Unverified Admin Email Spoof**: User with `email: 'dejawoot99@gmail.com'` and `email_verified: false` tries to read `/inquiries` -> MUST return `PERMISSION_DENIED`.
8. **Self-Assigned Admin Escalation**: Non-owner user tries to create `/admins/{theirUid}` or `/admin_invites/{theirEmail}` -> MUST return `PERMISSION_DENIED`.
9. **Resource Poisoning via Oversized String**: Public user submits `message > 2000` chars or `fullName > 120` chars -> MUST return `PERMISSION_DENIED`.
10. **Path ID Poisoning**: Client writes `/inquiries/bad$id` or `/public_config/other` -> MUST return `PERMISSION_DENIED`.
11. **Invalid Lane Pairing / Malformed Email / Unsafe URL**: Public user submits mismatched `lane` + `subTrack`, invalid `email`, or `website: 'javascript:alert(1)'` -> MUST return `PERMISSION_DENIED`.
12. **Public CMS Tampering**: Unauthenticated or non-admin user tries to write `/public_config/site` -> MUST return `PERMISSION_DENIED`.
