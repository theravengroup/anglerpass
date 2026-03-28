# Content Moderation Workflow

## Overview

All user-generated content that is publicly visible goes through a moderation pipeline before it reaches other users. This protects the platform's quality and prevents abuse while keeping the listing process straightforward for landowners and club admins.

---

## What Gets Moderated

| Content Type      | Entity           | Trigger                                |
|-------------------|------------------|----------------------------------------|
| Property listings | `properties`     | New listing or edit to published listing |
| Property photos   | `property_media` | New upload                             |
| Descriptions      | `properties`     | Edit to `description` field            |
| Pricing changes   | `properties`     | Edit to `price_cents` or `pricing_type`|
| Reviews           | `reviews`        | New review submission                  |
| Club descriptions | `memberships`    | New or edited tier description         |

Content that does NOT require moderation:
- Profile display name changes (validated client-side, no public listing impact)
- Booking messages between angler and landowner (private)
- Availability window changes (operational, not content)
- Blackout dates (operational)

---

## State Machine

```
                    +---> Approved ---> Published
                    |
Draft ---> Pending Review
                    |
                    +---> Rejected (with reason)
                              |
                              +---> Draft (author revises, resubmits)
```

### States

| State            | Description                                                   |
|------------------|---------------------------------------------------------------|
| `draft`          | Author is still editing. Not visible to other users.          |
| `pending_review` | Submitted for moderation. Visible only to author and admins.  |
| `approved`       | Passed moderation. Transitions immediately to `published`.    |
| `published`      | Live and visible to all users.                                |
| `rejected`       | Failed moderation. Author sees rejection reason, can revise.  |
| `archived`       | Soft-deleted by author or admin. Not visible.                 |

### Transitions

| From             | To               | Actor        | Notes                            |
|------------------|------------------|--------------|----------------------------------|
| draft            | pending_review   | Author       | Submits for review               |
| pending_review   | approved         | Admin        | Approves content                 |
| pending_review   | rejected         | Admin        | Rejects with reason              |
| approved         | published        | System       | Automatic on approval            |
| rejected         | draft            | Author       | Clicks "Revise" to edit again    |
| published        | pending_review   | System       | Triggered by significant edit    |
| published        | archived         | Author/Admin | Soft delete                      |
| any              | archived         | Admin        | Admin can archive anything       |

---

## Diff Review

When a published listing is edited, the system does not immediately apply changes. Instead:

1. The edit creates an `audit_log` entry with `old_data` (current published state) and `new_data` (proposed changes).
2. The property status changes to `pending_review`.
3. The admin moderation queue shows a diff view: old vs. new for each changed field.
4. On approval, `new_data` is applied to the property and status returns to `published`.
5. On rejection, the property reverts to its `old_data` state and status goes to `rejected`.

This ensures that a published listing is never in a broken or unapproved state. The live version stays up while the edit is in review.

### Audit Log Entry Format

```json
{
  "action": "property.edit_submitted",
  "entity_type": "property",
  "entity_id": "uuid",
  "old_data": {
    "description": "Original description...",
    "price_cents": 15000
  },
  "new_data": {
    "description": "Updated description...",
    "price_cents": 20000
  }
}
```

---

## Approval Queue

The admin console at `/admin/moderation` displays a queue of items in `pending_review` status, ordered by `created_at` (oldest first).

Each queue item shows:
- Entity type and name (e.g., "Property: Smith Ranch on the Madison")
- Submitting user with link to their profile
- Submission date
- Diff view for edits (highlighted changes)
- Full content for new submissions
- Action buttons: Approve, Reject (with reason text field)

### Queue Filters
- By entity type (properties, media, reviews)
- By date range
- By submitting user
- Unreviewed only (default)

---

## Auto-Approve (Future)

To reduce admin burden as the platform scales, certain low-risk edits will be auto-approved:

| Edit Type                     | Auto-Approve? | Rationale                          |
|-------------------------------|---------------|------------------------------------|
| Availability window changes   | Yes           | Operational, not content           |
| Blackout date add/remove      | Yes           | Operational                        |
| Price decrease                | Yes           | Benefits anglers                   |
| Typo-level text edits (<10%)  | Maybe         | Needs NLP diffing, defer to Layer 3|
| New photo upload              | No            | Content risk                       |
| Description rewrite           | No            | Content risk                       |
| Price increase >50%           | No            | Potential abuse                    |

Auto-approved changes still generate an `audit_log` entry for retroactive review.

---

## Rollback Support

Every moderation decision is tracked in `audit_log` with full before/after state. To roll back:

1. Admin finds the approval entry in `audit_log`.
2. System applies `old_data` back to the entity.
3. A new `audit_log` entry is created with action `property.rolled_back`.
4. Property status returns to `pending_review` or `draft` depending on severity.

This is a manual admin action in Layer 2. Automated rollback (e.g., on fraud detection) is deferred to later.

---

## Notification Triggers

| Event                        | Notify              | Channel          |
|------------------------------|----------------------|------------------|
| Content submitted for review | Admin team           | In-app, email    |
| Content approved             | Author               | In-app, email    |
| Content rejected             | Author               | In-app, email    |
| Content rolled back          | Author + admin team  | In-app, email    |

See [notifications.md](./notifications.md) for implementation details.

---

## Implementation Notes

- **Moderation is synchronous for new listings.** A property cannot be published without passing review. There is no grace period or provisional publishing.
- **Edits to published listings are asynchronous.** The current published version stays live while the edit is in review. The author sees a "Pending Review" badge on their dashboard.
- **Rejection reasons are required.** Admins must provide a text explanation when rejecting content. This is stored on the `audit_log` entry and shown to the author.
- **Media moderation is per-item.** Individual photos can be rejected without rejecting the entire listing. The property stays published minus the rejected photo.
