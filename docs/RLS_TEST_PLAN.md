# RLS Test Plan

## 1) Goal

Validate that Row-Level Security (RLS) enforces:

- strict tenant isolation
- correct role-based permissions (`owner`, `team_member`, `client`)
- assignment-based client visibility for projects

This plan is designed for repeatable manual QA before release and as a basis for future automated policy tests.

Related docs:

- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- DB/security reference: [DATABASE_SECURITY_REFERENCE.md](DATABASE_SECURITY_REFERENCE.md)

---

## 2) Scope

Covered tables and policies:

- `profiles`
- `organizations`
- `organization_members`
- `projects`
- `project_members`

Covered function behavior relevant to policy evaluation:

- `get_my_organization_id()`
- `get_my_org_role(org_id)`
- `is_project_member(project_id)`
- `project_belongs_to_my_org(project_id)`

Out of scope:

- service-role behavior (bypasses RLS by design)
- future domains not yet present (`tasks`, `chat`, `files`, `activity`)

---

## 3) Test Environment Prerequisites

- Latest migration applied from `supabase/migrations/001_initial_schema.sql`
- RLS enabled on all scope tables
- Test users and org fixture created
- Ability to run authenticated requests as each test user (via app UI and/or token-based SQL/API tests)

Recommended fixture identities:

- Org A: `owner_a`, `team_a`, `client_a`, `client_a_unassigned`
- Org B: `owner_b`, `team_b`, `client_b`

Recommended fixture data:

- Org A projects:
  - `proj_a1` assigned to `team_a` + `client_a`
  - `proj_a2` assigned to `team_a` only
- Org B project:
  - `proj_b1` assigned to `team_b` + `client_b`

---

## 4) Expected Permission Matrix

Legend:

- ✅ allowed
- ❌ denied
- ➖ not applicable / no direct policy path

### 4.1 `profiles`

| Action                   | owner | team_member | client | Cross-tenant expectation |
| ------------------------ | ----- | ----------- | ------ | ------------------------ |
| SELECT own profile       | ✅    | ✅          | ✅     | N/A                      |
| SELECT same-org profile  | ✅    | ✅          | ✅     | only same org            |
| SELECT other-org profile | ❌    | ❌          | ❌     | always denied            |
| UPDATE own profile       | ✅    | ✅          | ✅     | own row only             |
| UPDATE another profile   | ❌    | ❌          | ❌     | always denied            |
| DELETE                   | ❌    | ❌          | ❌     | no delete policy         |

### 4.2 `organizations`

| Action                  | owner | team_member | client | Cross-tenant expectation    |
| ----------------------- | ----- | ----------- | ------ | --------------------------- |
| SELECT own org          | ✅    | ✅          | ✅     | own org only                |
| SELECT other org        | ❌    | ❌          | ❌     | always denied               |
| UPDATE org              | ✅    | ❌          | ❌     | owner-only                  |
| INSERT org row directly | ❌    | ❌          | ❌     | via bootstrap function flow |
| DELETE org              | ❌    | ❌          | ❌     | no delete policy            |

### 4.3 `organization_members`

| Action                              | owner | team_member | client | Cross-tenant expectation |
| ----------------------------------- | ----- | ----------- | ------ | ------------------------ |
| SELECT member list (own org)        | ✅    | ✅          | ✅     | own org only             |
| INSERT member                       | ✅    | ❌          | ❌     | owner-only               |
| UPDATE member role                  | ✅    | ❌          | ❌     | owner-only               |
| DELETE another member               | ✅    | ❌          | ❌     | owner-only               |
| DELETE self membership              | ✅    | ✅          | ✅     | self-only path applies   |
| Any action on other org memberships | ❌    | ❌          | ❌     | always denied            |

### 4.4 `projects`

| Action                  | owner | team_member | client        | Cross-tenant expectation |
| ----------------------- | ----- | ----------- | ------------- | ------------------------ |
| SELECT own-org projects | ✅    | ✅          | assigned only | no other-org rows        |
| INSERT project          | ✅    | ✅          | ❌            | own org only             |
| UPDATE project          | ✅    | ✅          | ❌            | own org only             |
| DELETE project          | ✅    | ❌          | ❌            | owner-only               |

Client-specific assertions:

- client can read assigned project (`proj_a1`) ✅
- client cannot read unassigned project in same org (`proj_a2`) ❌

### 4.5 `project_members`

| Action                                  | owner | team_member | client | Cross-tenant expectation |
| --------------------------------------- | ----- | ----------- | ------ | ------------------------ |
| SELECT memberships for own-org projects | ✅    | ✅          | ✅\*   | no other-org rows        |
| INSERT membership                       | ✅    | ✅          | ❌     | own-org projects only    |
| DELETE membership                       | ✅    | ✅          | ❌     | own-org projects only    |
| UPDATE membership row                   | ❌    | ❌          | ❌     | no update policy         |

`*` Clients can only observe rows for projects visible under project-level policy logic.

---

## 5) Core Test Scenarios

Run all scenarios for both positive and negative assertions.

### Scenario A: Tenant Isolation

1. Authenticate as `owner_a`.
2. Attempt reads on all scoped tables filtered to Org B ids.
3. Expected: zero rows returned.
4. Repeat with `team_a` and `client_a`.

Pass criteria:

- no cross-tenant data leakage on any scoped table.

### Scenario B: Owner Privileges

1. Authenticate as `owner_a`.
2. Insert/update/delete `projects` in Org A.
3. Insert/update/delete `organization_members` in Org A.
4. Update `organizations.name` for Org A.

Pass criteria:

- all above operations succeed for owner in own org.

### Scenario C: Team Member Boundaries

1. Authenticate as `team_a`.
2. Insert and update project in Org A.
3. Attempt project delete.
4. Attempt org name update.
5. Attempt role change in `organization_members`.

Pass criteria:

- project insert/update succeed
- project delete denied
- org/member-admin mutations denied

### Scenario D: Client Assignment Gating

1. Authenticate as `client_a` (assigned only to `proj_a1`).
2. Query projects in Org A.
3. Verify `proj_a1` visible.
4. Verify `proj_a2` hidden.
5. Attempt any project insert/update/delete.

Pass criteria:

- assigned project visible
- unassigned project hidden
- all project mutations denied

### Scenario E: Self-Removal Semantics

1. Authenticate as `team_a`.
2. Delete own `organization_members` row.
3. Attempt to delete another member row.

Pass criteria:

- self-delete succeeds
- deleting others is denied

### Scenario F: No Implicit Write Paths

For each role (`owner`, `team_member`, `client`):

1. Attempt disallowed actions where policy is absent (for example `UPDATE project_members`, `DELETE organizations`, `DELETE profiles`).
2. Ensure operation fails.

Pass criteria:

- all absent-policy writes are denied.

---

## 6) Suggested Execution Workflow (Per Release)

1. Seed fixtures (Org A + Org B + users + assignments).
2. Run Scenario A first (quick leak detection).
3. Run role scenarios B/C/D.
4. Run edge scenarios E/F.
5. Record results in a test report table or release checklist.

Minimum release gate:

- any tenant-isolation failure = release blocker
- any role-escalation success = release blocker

---

## 7) Regression Checklist for Schema Changes

When introducing new table(s):

1. Confirm tenant linkage column exists and is indexed.
2. Confirm RLS is enabled.
3. Add explicit policies for all required actions.
4. Add at least one cross-tenant negative test.
5. Add role-based positive/negative tests for owner/team/client.
6. Add assignment-based test if client partial visibility is needed.
7. Update this document’s matrix.

---

## 8) Common Failure Signals and Debug Order

If a test fails unexpectedly:

1. Verify the acting user’s org membership and role row.
2. Verify assignment rows in `project_members`.
3. Re-check helper function outputs for current auth context.
4. Re-read policy predicate for the target action.
5. Confirm the operation is using user-context client (not service-role).

---

## 9) Optional Automation Path

To automate this plan later:

- add SQL-based policy tests in CI (for example pgTAP or scripted SQL assertions)
- run tests against an ephemeral Supabase project per PR
- fail CI on any permission drift from this matrix

Current implementation in this repo:

- SQL assertion script: `supabase/tests/rls_test_plan.sql`
- The script seeds deterministic fixtures, runs scenarios A-F under authenticated role/JWT context switching, and ends with `ROLLBACK` so it is repeatable.

Local execution (manual):

1. Start local Supabase stack.
2. Open SQL editor for the local database (or connect with psql as `postgres`).
3. Execute `supabase/tests/rls_test_plan.sql`.
4. Confirm `NOTICE: RLS test plan scenarios A-F passed.` appears.

CI-friendly command in this repo:

- `pnpm run rls:test:ci`
- Combined CI verification (lint + RLS): `pnpm run verify:ci`

Local pre-commit enforcement:

- Husky pre-commit hook runs `pnpm run verify:ci`
- Install hooks after dependency install with `pnpm run prepare`

---

## 10) Ownership

Recommended owners:

- Primary: backend/security owner
- Reviewers: feature owner touching schema + app owner for auth paths

Review cadence:

- update this plan whenever policies, roles, or scoped tables change
