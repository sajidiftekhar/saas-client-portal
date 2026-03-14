# Database and Security Reference

## 1) Purpose

This document is the operational reference for database design and security controls in the Client Portal app.

Use it to:

- understand tenant boundaries
- verify role permissions before shipping features
- add new tables and policies safely

Related documentation:

- System/module architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- RLS test scenarios: [RLS_TEST_PLAN.md](RLS_TEST_PLAN.md)

Source of truth files:

- `supabase/migrations/001_initial_schema.sql`
- `src/types/database.ts`

---

## 2) Security Model at a Glance

- Identity: Supabase Auth users (`auth.users`)
- App profile root: `public.profiles`
- Tenant unit: `public.organizations`
- Membership model: `organization_members` + role enum
- Data isolation: PostgreSQL RLS on all core tables
- Privileged bootstrap: SECURITY DEFINER SQL functions
- App-side protection: authenticated route guards + server-side auth checks

---

## 3) Roles and Access Intent

| Role        | Intended scope                                                      |
| ----------- | ------------------------------------------------------------------- |
| owner       | Full organization administration, member management, project delete |
| team_member | Project creation/update and project member management               |
| client      | Read-only access to assigned projects within own org                |

Notes:

- Role is stored per organization in `organization_members.role`.
- Client access to projects is assignment-based (`project_members`).

---

## 4) Schema Overview

### 4.1 Enums

- `member_role`: `owner`, `team_member`, `client`
- `project_status`: `active`, `review`, `completed`, `on_hold`, `archived`

### 4.2 Core Tables

| Table                  | Purpose                                    | Key columns                                       |
| ---------------------- | ------------------------------------------ | ------------------------------------------------- |
| `profiles`             | App-level user profile mirror of auth user | `id`, `email`, `full_name`, `avatar_url`          |
| `organizations`        | Tenant root record                         | `id`, `name`, `owner_id`                          |
| `organization_members` | User membership and role in a tenant       | `organization_id`, `user_id`, `role`              |
| `projects`             | Organization project records               | `organization_id`, `name`, `status`, `created_by` |
| `project_members`      | Explicit project assignment                | `project_id`, `user_id`                           |

### 4.3 Relationship Rules

- `profiles.id` references `auth.users.id`.
- User FKs in app tables reference `profiles(id)` for join compatibility.
- Uniqueness constraints:
  - `organization_members (organization_id, user_id)`
  - `project_members (project_id, user_id)`

---

## 5) RLS and Policy Matrix

RLS is enabled on all core tables:

- `profiles`
- `organizations`
- `organization_members`
- `projects`
- `project_members`

### 5.1 Effective Permissions by Table

| Table                  | SELECT                                                     | INSERT                  | UPDATE     | DELETE        |
| ---------------------- | ---------------------------------------------------------- | ----------------------- | ---------- | ------------- |
| `profiles`             | self + org mates                                           | system/trigger path     | self only  | no policy     |
| `organizations`        | org member                                                 | bootstrap function path | owner only | no policy     |
| `organization_members` | org member                                                 | owner only              | owner only | owner or self |
| `projects`             | owner/team all org projects; client assigned projects only | owner/team              | owner/team | owner         |
| `project_members`      | users in same org context for project                      | owner/team              | no policy  | owner/team    |

Interpretation:

- Missing action policies effectively block that action for regular clients.
- Access is always constrained by tenant-aware predicates or helper functions.

### 5.2 Policy Mechanism

Policies depend on SECURITY DEFINER helper functions:

- `get_my_organization_id()`
- `get_my_org_role(org_id)`
- `is_project_member(project_id)`
- `project_belongs_to_my_org(project_id)`

Why this pattern:

- avoids recursive policy dependencies
- centralizes authorization logic
- keeps policy conditions readable and reusable

---

## 6) Auth-Linked Database Functions and Triggers

### 6.1 Trigger Function

- `handle_new_user()`
  - Triggered after insert on `auth.users`
  - Creates `public.profiles` row
  - Uses `ON CONFLICT DO NOTHING` for idempotency

### 6.2 Bootstrap / Context Functions

- `create_organization(org_name text) -> uuid`
  - Creates org + inserts caller as owner in one transaction scope
- `get_user_organization() -> table(...)`
  - Returns org id, org name, and role for current caller

Security notes:

- Functions run as SECURITY DEFINER
- `search_path` is pinned to `public`

---

## 7) Application Integration Points

### 7.1 Server-side clients

- `src/lib/supabase/server.ts`
  - `createClient()`: request-scoped, user-context client
  - `createServiceClient()`: service key client for privileged admin operations

### 7.2 Service-role usage

Current service-role usage is limited to invite workflow in settings actions:

- `src/app/(dashboard)/dashboard/settings/actions.ts`
  - calls `auth.admin.inviteUserByEmail`
  - upserts `organization_members` for invited user

Rule:

- service-role calls stay server-only and action-scoped

### 7.3 Server actions enforcing write discipline

Project and settings action modules apply a consistent pattern:

1. input validation (Zod)
2. server-side auth/session resolution
3. mutation
4. path revalidation
5. typed success/error return or redirect

---

## 8) Data Classification and Handling

| Data type     | Examples                      | Handling guidance                                     |
| ------------- | ----------------------------- | ----------------------------------------------------- |
| Identity      | email, full_name, avatar_url  | Do not expose outside tenant context                  |
| Authorization | role, membership rows         | Treat as security-critical; changes should be audited |
| Business data | projects, statuses, due dates | Tenant-scoped by `organization_id`                    |
| Secrets       | service key                   | Server-only; never in client bundle or public env     |

Operational guidance:

- Do not log access tokens or service key values.
- Keep user-facing errors generic for auth failures.

---

## 9) Safe Change Checklist (New Table/Feature)

When adding a table (example: tasks, messages, files):

1. Add table with explicit tenant linkage (`organization_id` or project linkage that resolves tenant)
2. Add indexes for FK and high-frequency filters
3. Enable RLS immediately
4. Add SELECT/INSERT/UPDATE/DELETE policies intentionally (no implicit gaps)
5. Reuse helper functions for role/tenant checks where possible
6. Add or update server actions with Zod validation
7. Verify client role behavior (owner/team/client) using real accounts
8. Update `src/types/database.ts` and this document

---

## 10) Verification Queries (Manual QA)

Use these as scenario checks during development:

- Owner can read/write org projects
- Team member can create/update projects but cannot delete org if restricted
- Client can only read assigned projects
- Cross-tenant reads return zero rows
- Member self-removal works; non-owner cannot remove arbitrary members

If any check fails, inspect both SQL policy predicates and app-side mutation paths.

---

## 11) Current Gaps and Future Hardening

Current functional gaps (feature-level):

- tasks, chat, files, activity are not yet persisted in schema

Security hardening opportunities:

- add explicit audit trail table for role/membership/project access changes
- add automated policy tests in CI for role/tenant matrix regressions
- define key-rotation and incident playbook for service key exposure

---

## 12) Quick Reference

- Migration source: `supabase/migrations/001_initial_schema.sql`
- Generated type contract: `src/types/database.ts`
- Auth callback bootstrap: `src/app/(auth)/callback/route.ts`
- Project write actions: `src/app/(dashboard)/projects/actions.ts`
- Org/member admin actions: `src/app/(dashboard)/dashboard/settings/actions.ts`
