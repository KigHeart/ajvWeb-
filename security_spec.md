# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Global Default Deny**: Unmatched collections and documents are explicitly denied for all read and write operations.
2. **PII Isolation on Inquiries**: `/inquiries/{inquiryId}` contains submitter names and email addresses (`email`, `fullName`, `message`). Public visitors may **create** a new inquiry, but **never** `get`, `list`, `update`, or `delete` any inquiry. Only verified AJV admins (`isAdmin()`) may read, list, update, or delete inquiries.
3. **Create-Time State Integrity**: Every newly created inquiry MUST start with `status == 'new'`, `notes == ''`, `createdAt == request.time`, and `updatedAt == request.time`. Visitors cannot pre-set `status: 'scheduled'` or inject internal notes.
4. **Immutable Audit Fields & Temporal Integrity**: After creation, `createdAt`, `lane`, `subTrack`, `fullName`, `company`, `email`, `website`, and `message` cannot be altered arbitrarily; admin triage updates are strictly constrained via `affectedKeys().hasOnly(['status', 'notes', 'updatedAt'])` and `updatedAt == request.time`.
5. **Bounded Payloads & IDs**: All document IDs must pass `isValidId(id)` (`^[a-zA-Z0-9_-]+$`, `<= 128` chars), and every string field enforces explicit `size()` limits and enum/regex checks.
6. **Verified Admin Authentication**: Admin privileges require `request.auth != null && request.auth.token.email_verified == true` and either match the bootstrapped owner email (`dejawoot99@gmail.com`) or exist in `/admins/{request.auth.uid}`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated List Scrape**: Anonymous user calls `list /inquiries` -> MUST return `PERMISSION_DENIED`.
2. **Unauthenticated Single Read**: Anonymous user calls `get /inquiries/{id}` -> MUST return `PERMISSION_DENIED`.
3. **Signed-In Non-Admin Read**: Non-admin signed-in user calls `get` or `list` on `/inquiries` -> MUST return `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Public user submits inquiry with extra key `isApproved: true` -> MUST return `PERMISSION_DENIED` (`hasOnly` rejection).
5. **Status Skipping on Create**: Public user submits inquiry with `status: 'scheduled'` instead of `'new'` -> MUST return `PERMISSION_DENIED`.
6. **Client Timestamp Forgery on Create**: Public user submits `createdAt` in the past instead of `request.time` -> MUST return `PERMISSION_DENIED`.
7. **Unverified Admin Email Spoof**: User with `email: 'dejawoot99@gmail.com'` and `email_verified: false` tries to read `/inquiries` -> MUST return `PERMISSION_DENIED`.
8. **Self-Assigned Admin Escalation**: Non-admin user tries to create `/admins/{theirUid}` with `role: 'admin'` -> MUST return `PERMISSION_DENIED`.
9. **Resource Poisoning via Oversized String**: Public user submits `message` with `> 2000` characters or `fullName > 120` chars -> MUST return `PERMISSION_DENIED`.
10. **Path ID Poisoning**: Client writes `/inquiries/bad$id` or 200-char doc ID -> MUST return `PERMISSION_DENIED` (`isValidId`).
11. **Invalid Enum Lane/SubTrack**: Public user submits `lane: 'vip'` or mismatched `email: 'not-an-email'` -> MUST return `PERMISSION_DENIED`.
12. **Admin Update Value Poisoning / Immutable Tampering**: Admin attempts to overwrite `createdAt` or inject `status: 'hacked'` -> MUST return `PERMISSION_DENIED` (`isValidInquiry` + `affectedKeys().hasOnly`).
