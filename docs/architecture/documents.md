# Documents & E-Signature Architecture

## Overview

AnglerPass manages legal documents that users must review and sign before accessing properties, joining clubs, or completing certain bookings. Documents are stored in Supabase Storage, versioned, and signatures are captured with a full audit trail.

---

## Document Types

| Type           | Scope              | Required Before            | Who Signs    |
|----------------|--------------------|----------------------------|-------------|
| Liability waiver | Property-specific | First booking at property  | Angler      |
| Fishing regulations | Property-specific | Each booking (acknowledge) | Angler   |
| Access agreement | Property-specific | First booking at property  | Angler      |
| Club bylaws    | Club-specific       | Club membership approval   | Angler      |
| Platform TOS   | Platform-wide       | Account creation           | All users   |
| Landowner agreement | Platform-wide  | Property listing creation  | Landowner   |

### Document Lifecycle

```
Upload/Create ---> Active (current version)
                      |
                      +---> New version uploaded ---> Previous version archived
                                                        |
                                                        +---> Existing signatures still valid
                                                              for the version they signed
```

---

## Storage

### Supabase Storage Buckets

| Bucket            | Access                          | Contents                   |
|-------------------|---------------------------------|----------------------------|
| `documents`       | Authenticated read, admin write | Document files (PDF, DOCX) |
| `signatures`      | Private (service-role only)     | Signature images           |

### File Organization

```
documents/
  platform/
    tos-v1.pdf
    tos-v2.pdf
    landowner-agreement-v1.pdf
  properties/
    {property_id}/
      liability-waiver-v1.pdf
      access-agreement-v1.pdf
      fishing-regulations-v1.pdf
  clubs/
    {club_profile_id}/
      bylaws-v1.pdf
```

### Storage Policies

- Documents are publicly readable by authenticated users (they need to review before signing).
- Only admins and the document owner (landowner/club admin) can upload or replace documents.
- Signature images are never publicly accessible. They are only used for audit/legal purposes and accessed via service-role.

---

## Version Tracking

Each document has a `version` integer that increments on update. The `documents` table stores each version as a separate row:

```
documents
  id: uuid
  type: text
  title: text
  storage_path: text
  version: int
  property_id: uuid (nullable)
  membership_id: uuid (nullable)
  requires_signature: boolean
  is_current: boolean        -- only one version is current per (type, property_id/membership_id)
  created_at: timestamptz
  created_by: uuid           -- who uploaded this version
```

When a new version is uploaded:
1. The existing `is_current = true` row is set to `is_current = false`.
2. A new row is inserted with `version = previous + 1` and `is_current = true`.
3. Existing signatures remain linked to the version they signed. They are NOT invalidated.
4. New bookings or memberships require signing the current version.

### When Re-Signing Is Required

Some document types require re-signing when a new version is published:

| Document Type       | Re-Sign on New Version? | Notes                                    |
|---------------------|------------------------|------------------------------------------|
| Liability waiver    | Yes                    | Legal liability changes require fresh signature |
| Fishing regulations | Yes                    | Regulations may change seasonally         |
| Access agreement    | No                     | One-time, unless landowner flags it       |
| Club bylaws         | No                     | Grandfathered unless club requires re-sign |
| Platform TOS        | Yes                    | Users prompted on next login              |

---

## E-Signature Flow

### In-App Signing (Layer 2)

For most documents, AnglerPass uses a built-in signature capture:

1. User is presented with the document to review (PDF viewer or rendered text).
2. User checks an "I have read and agree" checkbox.
3. User draws their signature on a canvas (touch-friendly for mobile).
4. On submit, the system:
   - Saves the signature image to the `signatures` bucket
   - Creates a `document_signatures` row with timestamp, IP address, and document version
   - Logs the event in `audit_log`
   - Unblocks the gated action (booking or membership)

### External E-Signature (Future/Optional)

For high-value or legally complex documents, integration with DocuSign or HelloSign:

1. Admin uploads document and marks it for external signature.
2. System creates a signing request via DocuSign API.
3. Signer receives an email with a link to sign in DocuSign.
4. DocuSign webhook notifies AnglerPass when signed.
5. Signed document is downloaded and stored in Supabase Storage.
6. `document_signatures` row is created with the DocuSign envelope ID.

This is deferred to Layer 3 unless a specific landowner or legal requirement demands it sooner.

---

## Gating Logic

Documents gate specific actions. The system checks signature status before allowing the action to proceed:

### Before First Booking at a Property

```typescript
async function canBook(anglerId: string, propertyId: string): Promise<boolean> {
  const requiredDocs = await getRequiredDocuments(propertyId);
  const signedDocs = await getSignedDocuments(anglerId, propertyId);

  return requiredDocs.every(doc =>
    signedDocs.some(signed =>
      signed.document_id === doc.id &&
      signed.document_version === doc.version
    )
  );
}
```

If the angler has not signed all required documents, the booking form shows a "Documents Required" step before the payment step.

### Before Club Membership

Club bylaws must be signed before the membership application is submitted. The membership form includes the document review and signature step inline.

### On Login (Platform TOS)

If the platform TOS has a newer version than what the user last signed, they see a modal on their next dashboard visit requiring them to review and accept the new terms before proceeding.

---

## Audit Trail

Every signature event is recorded in two places:

1. **`document_signatures` table**: The primary record linking user, document, version, timestamp, and IP.
2. **`audit_log` table**: A backup record with `action = 'document.signed'`, `entity_type = 'document'`, and the full signature metadata in `new_data`.

### Data Retained

| Field           | Purpose                                     |
|-----------------|---------------------------------------------|
| `signer_id`     | Who signed                                  |
| `document_id`   | Which document                              |
| `signed_at`     | When (timestamptz)                          |
| `ip_address`    | Signer's IP at time of signing              |
| `user_agent`    | Browser/device info                         |
| `signature_data`| Reference to signature image in storage     |
| `document_version` | Which version they signed                |

Signature records are never deleted, even if the user deletes their account. They are anonymized (signer_id nullified) per GDPR data-deletion requests, but the signature record itself is retained for the landowner's legal protection.

---

## Implementation Notes

- **PDF rendering.** Documents are displayed using `react-pdf` or an iframe embed for PDFs stored in Supabase Storage. For simple agreements, plain text/markdown rendering is sufficient.
- **Mobile signature capture.** The signature canvas uses an HTML5 Canvas element with touch event handlers. Libraries like `react-signature-canvas` provide a ready-made solution.
- **Document templates.** Landowners can upload custom documents or use AnglerPass-provided templates. Templates are pre-populated with property name, dates, and party information using merge fields.
- **Bulk signing.** If a landowner updates their liability waiver, anglers with upcoming bookings are notified and must re-sign before their booking date. The system sends reminders at 7 days and 1 day before the booking.
