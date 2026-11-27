# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Global Default Deny**: Unmatched collections and documents are explicitly denied for all read and write operations.
2. **PII & Proprietary IP Isolation**:
   - `/inquiries/{inquiryId}` contains submitter PII (`email`, `fullName`, `message`): public visitors may `create`, never read or modify; only `isAdmin()` may read, list, update, or delete.
   - `/discovery_orgs/{orgId}` and `/venture_opportunities/{oppId}` contain proprietary workflow intelligence, customer pain data, and internal 100-point venture scorecards: **strictly `isAdmin()` only** for all operations (`get`, `list`, `create`, `update`, `delete`).
3. **Create-Time State Integrity**: Every newly created inquiry MUST start with `status == 'new'`, `stageTag == ''`, `designPartner == ''`, `notes == ''`, `createdAt == request.time`, and `updatedAt == request.time`.
4. **Relational & Scoring Integrity**:
   - On `/venture_opportunities/{oppId}`, if `orgId != ''`, the referenced `/discovery_orgs/{orgId}` document MUST exist (`exists(...)`), preventing orphaned records.
   - All seven scorecard criteria (`scoreSeverity`, `scoreRepeatability`, `scoreWtp`, `scoreAgentic`, `scoreScalability`, `scoreFeasibility`, `scoreFit`) must be integers strictly within their declared criterion maxima (`0..15`, `0..15`, `0..20`, `0..15`, `0..15`, `0..10`, `0..10`).
5. **Immutable Audit Fields & Temporal Integrity**: `createdAt` is immutable on update across all collections, and `updatedAt == request.time` is enforced on creates and updates.
6. **Verified Admin Authentication & Team Roster**: Admin privileges require `request.auth != null && request.auth.token.email_verified == true` and either match `dejawoot99@gmail.com` or exist in `/admins/{uid}` or `/admin_invites/{verifiedEmail}`.
7. **Public CMS Isolation**: `/public_config/site` is the only publicly readable `get` document (no `list` queries allowed) and holds zero PII.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated List Scrape**: Anonymous user calls `list` on `/inquiries`, `/discovery_orgs`, `/venture_opportunities`, `/admin_invites`, or `/public_config` -> MUST return `PERMISSION_DENIED`.
2. **Unauthenticated Single Read**: Anonymous user calls `get` on `/inquiries/{id}`, `/discovery_orgs/{id}`, or `/venture_opportunities/{id}` -> MUST return `PERMISSION_DENIED`.
3. **Signed-In Non-Admin Read/Write on Discovery OS**: Non-admin authenticated user attempts to read or create `/discovery_orgs` or `/venture_opportunities` -> MUST return `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Public user submits inquiry with extra key `isApproved: true` -> MUST return `PERMISSION_DENIED`.
5. **Scorecard Overflow Attack**: Admin or rogue payload attempts to write `scoreWtp: 999` on `/venture_opportunities` -> MUST return `PERMISSION_DENIED`.
6. **Orphaned Opportunity Reference**: Payload specifies non-existent `orgId: 'fake-org'` on `/venture_opportunities` -> MUST return `PERMISSION_DENIED`.
7. **Unverified Admin Email Spoof**: User with `email: 'dejawoot99@gmail.com'` and `email_verified: false` tries to read `/inquiries` or `/discovery_orgs` -> MUST return `PERMISSION_DENIED`.
8. **Self-Assigned Admin Escalation**: Non-owner user tries to create `/admins/{theirUid}` or `/admin_invites/{theirEmail}` -> MUST return `PERMISSION_DENIED`.
9. **Resource Poisoning via Oversized String**: Public user submits `message > 2000` chars or `workflowsSummary > 3000` chars -> MUST return `PERMISSION_DENIED`.
10. **Path ID Poisoning**: Client writes `/inquiries/bad$id` or `/public_config/other` -> MUST return `PERMISSION_DENIED`.
11. **Invalid Lane Pairing / Malformed Email / Unsafe URL**: Public user submits mismatched `lane` + `subTrack`, invalid `email`, or `website: 'javascript:alert(1)'` -> MUST return `PERMISSION_DENIED`.
12. **Public CMS Tampering**: Unauthenticated or non-admin user tries to write `/public_config/site` -> MUST return `PERMISSION_DENIED`.
