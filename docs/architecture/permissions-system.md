# AnglerPass Permissions System — Architecture & Implementation

## Phase 1: Current-State Analysis

### 1.1 Current User Types

| Role | Storage | Description |
|------|---------|-------------|
| `angler` | `profiles.role` | Default signup role. Books fishing days, joins clubs. |
| `landowner` | `profiles.role` | Owns/manages fishing properties. |
| `club_admin` | `profiles.role` | Runs a fishing club. |
| `guide` | `profiles.role` | Licensed fishing guide with separate profile. |
| `admin` | `profiles.role` | Platform operator. Full access. |

Multi-role: `profiles.roles` text array exists (migration 00016) but is rarely checked. The `role` column drives routing and middleware checks.

### 1.2 Current Auth & Authorization Model

**Authentication:**
- Supabase Auth with cookie-based sessions
- `middleware.ts` refreshes sessions and enforces route protection
- Auth callback auto-links pending club memberships by email

**Authorization layers:**
1. **Middleware** — checks `profiles.role` + `suspended_at` for route access
2. **API helpers** — `requireAuth()`, `requireAdmin()`, `requirePropertyOwner()`, `requireClubManager()`
3. **RLS policies** — row-level security on all tables
4. **Admin client** — service-role client bypasses RLS for admin operations

**Key limitation:** All authorization is binary role checks. No granular permissions. Every admin is a super-admin. Club staff have hardcoded capabilities.

### 1.3 Current Booking Flow

- Angler authenticates → selects property → selects club membership → creates booking
- `bookings.angler_id` is always `auth.uid()` (the logged-in user)
- RLS enforces `angler_id = auth.uid()` on INSERT
- No `created_by` column exists
- No ability for anyone else to create a booking on behalf of an angler
- Bookings auto-confirm (no approval workflow from landowner)

### 1.4 Current Club Staff Functionality

Club memberships have three roles: `admin`, `staff`, `member`

**Staff can:**
- View club members
- Invite new members (but not other staff)
- Approve/decline membership applications
- Remove members (but not other staff or the owner)

**Staff cannot:**
- Create bookings for members
- Edit club settings
- Manage other staff
- Access financial data

### 1.5 Current Admin Functionality

All admins have identical, full access:
- User management (role changes, suspension)
- Property moderation queue
- Guide verification/approval
- Review flagging and moderation
- Platform settings management
- Financial analytics and reporting
- Team invitations
- Audit log viewing

### 1.6 Current Delegation/Impersonation

**Does not exist.** No patterns for:
- Acting on behalf of another user
- Delegated account access
- Spouse/partner/assistant access
- Impersonation

### 1.7 Current Audit Logging

`audit_log` table exists with: `actor_id`, `action`, `entity_type`, `entity_id`, `old_data`, `new_data`, `created_at`

Currently logs: role changes, suspensions, moderation actions, settings updates, admin invitations.

**Missing:** `represented_user_id`, `organization_id`, `ip_address`, `reason` fields. No logging of bookings, financial actions, or delegate changes.

---

## Phase 1.8: Gap Analysis

| Capability | Status | Notes |
|-----------|--------|-------|
| User authentication | EXISTS | Supabase Auth, working well |
| Profile roles (5 types) | EXISTS | `profiles.role` column with CHECK constraint |
| Multi-role array | EXISTS | `profiles.roles[]` but underutilized |
| Middleware route protection | EXISTS | Role-based, suspension-aware |
| Admin-only API checks | EXISTS | `requireAdmin()` helper |
| Property ownership checks | EXISTS | `requirePropertyOwner()` |
| Club ownership checks | EXISTS | `requireClubManager()` |
| Club membership roles (admin/staff/member) | EXISTS | In `club_memberships.role` |
| Staff member management | EXISTS | Invite, approve, remove members |
| Audit log table | EXISTS | Basic structure, admin-only |
| RLS on all tables | EXISTS | Well-structured policies |
| Granular permissions (per-action) | MISSING | All checks are role-level |
| Platform role hierarchy | MISSING | All admins are equal |
| Organization-scoped roles | PARTIAL | Club memberships have role but no permission mapping |
| Staff booking on behalf | MISSING | No `created_by` in bookings |
| Angler delegation | MISSING | No delegate model |
| Impersonation logging | MISSING | No represented_user_id in audit |
| Permission matrix enforcement | MISSING | No permissions table or checking logic |
| Club staff financial access | MISSING | No financial role separation |
| Audit log enrichment | SHOULD REFACTOR | Missing scope, reason, IP, represented_user_id |
| `club_memberships.role` values | PARTIAL | Has admin/staff/member but no finer granularity |
| `requireClubManager` helper | SHOULD REFACTOR | Only checks owner_id, ignores staff |
| Booking creation authorization | SHOULD REFACTOR | Hardcoded to `auth.uid()` only |
| Notification preferences | EXISTS | Basic email toggle preferences |
| Stripe Connect per club | EXISTS | DO NOT TOUCH YET |
| Guide verification workflow | EXISTS | DO NOT TOUCH YET |
| Cross-club agreements | EXISTS | DO NOT TOUCH YET |
| Corporate memberships | EXISTS | DO NOT TOUCH YET |
| Review/moderation system | EXISTS | DO NOT TOUCH YET |

---

## Phase 2: Target Authorization Model

### 2.1 Design Principles

1. **Additive, not destructive** — extend existing tables, do not rewrite
2. **Permission checks centralized** — single `authorize()` function, not scattered conditionals
3. **Scope-aware** — platform vs. organization vs. consumer scopes
4. **Audit-complete** — every sensitive action logged with full context
5. **RLS-compatible** — permissions enforced at both application and database levels

### 2.2 Scope Model

```
PLATFORM scope — AnglerPass internal staff
  └── Platform roles: super_admin, ops_admin, support_agent, finance_admin, compliance_admin, readonly_internal

ORGANIZATION scope — clubs, guide businesses, landowner entities
  └── Club roles: club_owner, club_admin, booking_staff, ops_staff, finance_staff, readonly_staff

CONSUMER scope — angler accounts
  └── Angler + delegates: angler (primary), delegate_viewer, delegate_booking_manager
```

### 2.3 How This Maps to Current Code

**Current `profiles.role`** stays as-is for routing/navigation. It answers "what dashboard does this user see?" — not "what can this user do?"

**New `permissions` and `role_permissions`** tables answer "what can this user do?" for platform-level actions.

**Existing `club_memberships.role`** is extended to support finer club roles. The `role` column maps to a set of permissions via `role_permissions`.

**New `angler_delegates`** table handles consumer-scope delegation.

**New `acted_on_behalf_of` column** in bookings tracks staff-created bookings.

### 2.4 Entity Design

#### Existing tables (modified):

**`profiles`** — add: (no changes needed, `role` stays for routing)

**`club_memberships`** — extend `role` CHECK to include: `owner`, `admin`, `booking_staff`, `ops_staff`, `finance_staff`, `readonly_staff`, `member`
- Rename current `admin` → `owner` (for the clubs.owner_id user)
- Keep `staff` as alias for `ops_staff` during migration
- Keep `member` unchanged

**`bookings`** — add: `created_by_user_id`, `on_behalf_of` boolean

**`audit_log`** — add: `represented_user_id`, `organization_id`, `scope`, `ip_address`, `reason`

#### New tables:

**`permissions`** — canonical list of all permissions
```sql
id          text PRIMARY KEY  -- e.g. 'booking.create_on_behalf'
category    text NOT NULL     -- e.g. 'booking', 'club', 'financial'
description text
scope_type  text NOT NULL     -- 'platform', 'organization', 'consumer'
```

**`role_permissions`** — which roles get which permissions
```sql
id          uuid PRIMARY KEY
scope_type  text NOT NULL     -- 'platform' or 'organization'
role        text NOT NULL     -- e.g. 'super_admin', 'club_owner', 'booking_staff'
permission  text NOT NULL REFERENCES permissions(id)
UNIQUE(scope_type, role, permission)
```

**`platform_staff`** — AnglerPass internal staff roles
```sql
id          uuid PRIMARY KEY
user_id     uuid NOT NULL REFERENCES profiles(id) UNIQUE
role        text NOT NULL     -- platform role
granted_by  uuid REFERENCES profiles(id)
granted_at  timestamptz DEFAULT now()
revoked_at  timestamptz       -- NULL = active
```

**`angler_delegates`** — consumer delegation
```sql
id              uuid PRIMARY KEY
angler_id       uuid NOT NULL REFERENCES profiles(id)
delegate_id     uuid NOT NULL REFERENCES profiles(id)
access_level    text NOT NULL  -- 'viewer', 'booking_manager'
invited_email   text
status          text NOT NULL  -- 'pending', 'active', 'revoked'
granted_at      timestamptz DEFAULT now()
revoked_at      timestamptz
UNIQUE(angler_id, delegate_id)
```

---

## Phase 3: Permission Matrix

### 3.1 Permission Definitions

#### Booking Permissions
| Permission | Description | Scope |
|-----------|-------------|-------|
| `booking.view_own` | View own bookings | consumer |
| `booking.view_club` | View all bookings through a club | organization |
| `booking.view_all` | View all bookings platform-wide | platform |
| `booking.create` | Create a booking for self | consumer |
| `booking.create_on_behalf` | Create a booking for another member | organization |
| `booking.modify` | Modify a booking | organization |
| `booking.cancel` | Cancel a booking | organization |
| `booking.override_limits` | Override rod/guest limits | platform |
| `booking.override_blackouts` | Override blackout dates | platform |
| `booking.waive_fees` | Waive platform fees | platform |
| `booking.resend_confirmation` | Resend booking confirmation | organization |

#### Account/Profile Permissions
| Permission | Description | Scope |
|-----------|-------------|-------|
| `profile.view_own` | View own profile | consumer |
| `profile.edit_own` | Edit own profile | consumer |
| `profile.view_members` | View club member profiles | organization |
| `profile.edit_members` | Edit club member details | organization |
| `profile.view_all` | View any profile | platform |
| `profile.edit_all` | Edit any profile | platform |
| `profile.suspend` | Suspend a user | platform |
| `profile.change_role` | Change platform role | platform |

#### Delegate Permissions
| Permission | Description | Scope |
|-----------|-------------|-------|
| `delegate.view` | View own delegates | consumer |
| `delegate.manage` | Add/remove delegates | consumer |
| `delegate.view_principal_bookings` | View principal's bookings | consumer |
| `delegate.create_booking_for_principal` | Create booking for principal | consumer |

#### Club Permissions
| Permission | Description | Scope |
|-----------|-------------|-------|
| `club.edit_settings` | Edit club name, description, rules | organization |
| `club.manage_staff` | Invite/remove staff, assign roles | organization |
| `club.manage_members` | Invite/approve/remove members | organization |
| `club.manage_plans` | Manage membership tiers and fees | organization |
| `club.manage_properties` | Request/manage property access | organization |
| `club.manage_access_instructions` | Edit property access notes | organization |
| `club.view_roster` | View full member roster | organization |

#### Financial Permissions
| Permission | Description | Scope |
|-----------|-------------|-------|
| `financial.view_club_charges` | View club financial data | organization |
| `financial.view_all_charges` | View platform-wide financials | platform |
| `financial.issue_refund` | Issue a refund | platform |
| `financial.adjust_fees` | Adjust booking fees | platform |
| `financial.export_reports` | Export financial CSV reports | platform |
| `financial.manage_payouts` | Manage payout schedules | platform |

#### Messaging Permissions
| Permission | Description | Scope |
|-----------|-------------|-------|
| `messaging.view_trip` | View trip messages | consumer |
| `messaging.send_trip` | Send trip messages | consumer |
| `messaging.send_bulk` | Send bulk notifications | organization |
| `messaging.include_delegates` | Include delegates in threads | organization |

#### Compliance Permissions
| Permission | Description | Scope |
|-----------|-------------|-------|
| `compliance.view_docs` | View verification documents | platform |
| `compliance.approve_docs` | Approve/reject verification | platform |
| `compliance.suspend_user` | Suspend user accounts | platform |
| `compliance.suspend_listing` | Suspend property listings | platform |

#### System Permissions
| Permission | Description | Scope |
|-----------|-------------|-------|
| `system.impersonate` | Impersonate another user | platform |
| `system.unlock_account` | Unlock locked accounts | platform |
| `system.view_audit_logs` | View audit trail | platform |
| `system.modify_config` | Change platform settings | platform |

### 3.2 Role-Permission Assignments

#### Platform Roles

| Permission | super_admin | ops_admin | support_agent | finance_admin | compliance_admin | readonly_internal |
|-----------|:-----------:|:---------:|:-------------:|:-------------:|:----------------:|:-----------------:|
| booking.view_all | x | x | x | x | | x |
| booking.create_on_behalf | x | x | x | | | |
| booking.modify | x | x | x | | | |
| booking.cancel | x | x | x | | | |
| booking.override_limits | x | x | | | | |
| booking.override_blackouts | x | x | | | | |
| booking.waive_fees | x | | | x | | |
| profile.view_all | x | x | x | x | x | x |
| profile.edit_all | x | x | x | | | |
| profile.suspend | x | x | | | x | |
| profile.change_role | x | | | | | |
| financial.view_all_charges | x | x | | x | | x |
| financial.issue_refund | x | | | x | | |
| financial.adjust_fees | x | | | x | | |
| financial.export_reports | x | x | | x | | |
| financial.manage_payouts | x | | | x | | |
| compliance.view_docs | x | x | x | | x | x |
| compliance.approve_docs | x | | | | x | |
| compliance.suspend_user | x | x | | | x | |
| compliance.suspend_listing | x | x | | | x | |
| system.impersonate | x | | | | | |
| system.unlock_account | x | x | x | | | |
| system.view_audit_logs | x | x | | x | x | x |
| system.modify_config | x | | | | | |

#### Organization (Club) Roles

| Permission | club_owner | club_admin | booking_staff | ops_staff | finance_staff | readonly_staff |
|-----------|:----------:|:----------:|:-------------:|:---------:|:-------------:|:--------------:|
| booking.view_club | x | x | x | x | x | x |
| booking.create_on_behalf | x | x | x | | | |
| booking.modify | x | x | x | | | |
| booking.cancel | x | x | x | | | |
| booking.resend_confirmation | x | x | x | | | |
| profile.view_members | x | x | x | x | x | x |
| profile.edit_members | x | x | | x | | |
| club.edit_settings | x | x | | | | |
| club.manage_staff | x | | | | | |
| club.manage_members | x | x | | x | | |
| club.manage_plans | x | x | | | | |
| club.manage_properties | x | x | | | | |
| club.view_roster | x | x | x | x | x | x |
| financial.view_club_charges | x | x | | | x | |
| messaging.send_bulk | x | x | | x | | |

#### Consumer (Delegate) Roles

| Permission | angler (self) | delegate_viewer | delegate_booking_manager |
|-----------|:-------------:|:---------------:|:------------------------:|
| booking.view_own | x | | |
| booking.create | x | | |
| delegate.view | x | | |
| delegate.manage | x | | |
| delegate.view_principal_bookings | | x | x |
| delegate.create_booking_for_principal | | | x |
| messaging.view_trip | x | x | x |

---

## Phase 4: V1 vs V2 Feature Split

### V1 (This Implementation)

- [x] `permissions` reference table with all permission IDs
- [x] `role_permissions` mapping table
- [x] `platform_staff` table for internal AnglerPass roles
- [x] `angler_delegates` table for consumer delegation
- [x] `bookings.created_by_user_id` and `bookings.on_behalf_of` columns
- [x] Enhanced `audit_log` with scope, represented_user_id, organization_id, reason
- [x] Extend `club_memberships.role` CHECK constraint for new club roles
- [x] Central `authorize()` helper function
- [x] `requireClubRole()` API helper
- [x] Staff booking on behalf of angler (API + basic UI)
- [x] Angler delegate management (invite, view, revoke)
- [x] Audit logging for: bookings, on-behalf actions, role changes, delegate changes
- [x] Admin UI for platform staff role management
- [x] Club UI for staff role assignment

### V2 (Deferred)

- [ ] Per-user permission overrides (`membership_permission_overrides`)
- [ ] Household/family account structures
- [ ] Advanced shared inboxes for delegates
- [ ] Temporary role elevation with time-based expiry
- [ ] Property-specific exception permissions
- [ ] Approval chains for high-risk actions
- [ ] Impersonation UI (platform super-admin acting as another user)
- [ ] IP-based audit logging
- [ ] 2FA/MFA for admin accounts
- [ ] Rate limiting on admin actions

---

## Phase 5: Migration Plan

### Migration 00042: Permissions Foundation

**Strategy:** Fully additive. No existing columns dropped. No existing data modified destructively.

1. Create `permissions` table with all permission definitions
2. Create `role_permissions` table with role-permission mappings
3. Create `platform_staff` table
4. Create `angler_delegates` table
5. Add `created_by_user_id` and `on_behalf_of` columns to `bookings`
6. Add `represented_user_id`, `organization_id`, `scope`, `reason` columns to `audit_log`
7. Extend `club_memberships.role` CHECK constraint to include new roles
8. Backfill: current admin users get `super_admin` platform_staff records
9. Backfill: `bookings.created_by_user_id` = `bookings.angler_id` for existing bookings
10. Add RLS policies for new tables
11. Add indexes for performance

**Rollback safety:** All changes are additive columns or new tables. Dropping the migration would not affect existing functionality.

---

## Phase 6: Test Plan

### Platform Staff Permissions
- [ ] Super admin can access all admin functions
- [ ] Ops admin can manage users but not change platform config
- [ ] Support agent can view but not issue refunds
- [ ] Finance admin can issue refunds but not suspend users
- [ ] Read-only internal can view but not modify anything

### Club Role Boundaries
- [ ] Club owner can manage staff and members
- [ ] Club admin can manage members but not staff
- [ ] Booking staff can create bookings on behalf but not edit club settings
- [ ] Ops staff can manage members but not create bookings
- [ ] Finance staff can view financials but not manage members
- [ ] Read-only staff can view but not modify

### On-Behalf-Of Booking
- [ ] Booking staff can select a club member and book for them
- [ ] Booking is owned by the angler, created_by records the staff member
- [ ] Audit log captures the on-behalf-of relationship
- [ ] Notifications go to both the angler and the staff member
- [ ] Angler sees the booking in their dashboard
- [ ] Staff member name visible in booking details

### Angler Delegation
- [ ] Angler can invite a delegate by email
- [ ] Delegate viewer can see bookings but not modify
- [ ] Delegate booking manager can create bookings for the angler
- [ ] Delegate-created bookings show "created by [delegate]"
- [ ] Angler can revoke delegate access
- [ ] Revoked delegate loses access immediately

### Audit Logging
- [ ] All booking creation/modification/cancellation logged
- [ ] On-behalf-of actions log both actor and represented user
- [ ] Role changes logged with old/new values
- [ ] Delegate changes logged
- [ ] Fee waivers and refunds logged with reason

### Regression
- [ ] Existing booking flow works unchanged for self-bookings
- [ ] Existing club member management works
- [ ] Existing admin panel works
- [ ] Existing middleware route protection works
- [ ] Existing RLS policies not broken

---

## Phase 7: Implementation Checklist

1. [x] Write migration SQL
2. [x] Create permission constants in TypeScript
3. [x] Build `authorize()` helper
4. [x] Build `requireClubRole()` helper
5. [x] Build `auditLog()` helper
6. [x] Update booking API for on-behalf-of
7. [x] Create delegate management API
8. [x] Update club member API for new roles
9. [x] Build platform staff management API
10. [x] UI: Staff booking on behalf
11. [x] UI: Delegate management
12. [x] UI: Club staff role assignment
13. [x] UI: Platform staff management (admin)
