# Security Specification: Sarkarpara Welfare Association

## Phase 0: Data Invariants & Zero-Trust Threat Model

### Core Data Invariants:
1. **Administrative Boundary**: Only users recorded in the `/admins/` collection or matching the bootstrapped administrator email (`irfanrahat277234@gmail.com`) can modify member records, create/update official financial transactions, verify payments, generate receipts, or publish announcements.
2. **Financial Integrity**: Ordinary members cannot create, edit, or approve their own payment records or receipts. Payment creation or update requires admin authorization.
3. **Immutability of Historical Transactions**: Completed transactions and issued receipts cannot be silently deleted or overwritten without recording an audit log.
4. **Ordinary Member Self-Access**: Authenticated members can read published announcements and organizational settings. They can access their own member records, personal dues, personal receipts, and create their own payment verification requests (`/payment_requests/`), but cannot modify other members' private records.
5. **Dues Keying**: Monthly dues use the composite key `due_{memberId}_{year}_{month}` and annual dues use `annual_{memberId}_{year}` to strictly prevent duplicate obligations.

---

### The Dirty Dozen Payloads:

1. **Payload 1 (Self-Elevation Attack)**:
   - Target: `setDoc(/admins/{unauthorizedUid})` with `{ role: "super_admin", email: "hacker@test.com" }`
   - Expected Result: `PERMISSION_DENIED` - Normal users cannot grant themselves admin roles.

2. **Payload 2 (Ghost Field Injection / Shadow Update)**:
   - Target: `updateDoc(/members/MEM-0001)` with `{ isSuperAdmin: true, isPrivileged: true }`
   - Expected Result: `PERMISSION_DENIED` - Strict field allowlisting rejects unauthorized keys.

3. **Payload 3 (Direct Due Status Forgery)**:
   - Target: Ordinary member writes `{ status: "paid", amountPaid: 100 }` to `/monthly_dues/due_MEM-0001_2025_01` without admin verification.
   - Expected Result: `PERMISSION_DENIED` - Only authorized officers/admins can mark dues as paid.

4. **Payload 4 (Fake Receipt Generation)**:
   - Target: Ordinary member writes to `/receipts/REC-9999` with `{ amount: 10000, memberId: "MEM-0001" }`.
   - Expected Result: `PERMISSION_DENIED` - Only authorized admins can write official receipts.

5. **Payload 5 (Unauthenticated Reading of All Members)**:
   - Target: `getDocs(collection(db, "members"))` with null auth.
   - Expected Result: `PERMISSION_DENIED` - Requires authentication.

6. **Payload 6 (Other Member Payment Request Tampering)**:
   - Target: User A updates or deletes `/payment_requests/{id}` belonging to User B.
   - Expected Result: `PERMISSION_DENIED` - User can only create and manage their own request when submittedBy matches auth.uid.

7. **Payload 7 (Audit Log Erasure or Modification)**:
   - Target: Any user or admin attempts `deleteDoc(/audit_logs/{logId})` or `updateDoc(...)`.
   - Expected Result: `PERMISSION_DENIED` - Audit logs are append-only; update and delete are forbidden.

8. **Payload 8 (Oversized Payload / Denial of Wallet)**:
   - Target: Member attempts to submit `notes` or `name` of 100KB characters to `/payment_requests/`.
   - Expected Result: `PERMISSION_DENIED` - String length limit (max 300/500 chars) prevents storage bloat.

9. **Payload 9 (Transaction Id / Date Spoofing without Admin Role)**:
   - Target: Ordinary user creates an entry in `/transactions/`.
   - Expected Result: `PERMISSION_DENIED` - Transactions can only be created by admins/treasurers.

10. **Payload 10 (Settings Tampering)**:
    - Target: Normal user overwrites `/settings/general` to change bank or association phone number.
    - Expected Result: `PERMISSION_DENIED` - Only admins can update `/settings/general`.

11. **Payload 11 (Announcement Hijacking)**:
    - Target: Ordinary user publishes an announcement to `/announcements/`.
    - Expected Result: `PERMISSION_DENIED` - Only authorized officers can publish announcements.

12. **Payload 12 (Negative or Invalid Financial Values)**:
    - Target: Negative `amountDue` or negative `amountPaid` written into due records.
    - Expected Result: `PERMISSION_DENIED` - Values must be valid numbers >= 0.
