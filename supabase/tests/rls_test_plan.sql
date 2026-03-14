-- RLS Test Plan Implementation
--
-- This script executes scenarios A-F from docs/RLS_TEST_PLAN.md against deterministic fixtures.
--
-- How to run (local):
--   1) Start local Supabase stack.
--   2) Execute this SQL as the postgres role (SQL editor or psql).
--
-- Behavior:
-- - Seeds test-only fixtures inside a transaction.
-- - Runs RLS assertions under role=authenticated with different JWT sub claims.
-- - Rolls back at the end so no fixture data is persisted.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.assert_eq(label text, actual bigint, expected bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'Assertion failed (%): expected %, got %', label, expected, actual;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.assert_true(label text, condition boolean)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT condition THEN
    RAISE EXCEPTION 'Assertion failed (%): condition is false', label;
  END IF;
END;
$$;

DO $$
DECLARE
  owner_a uuid := '00000000-0000-0000-0000-0000000000a1';
  team_a uuid := '00000000-0000-0000-0000-0000000000a2';
  client_a uuid := '00000000-0000-0000-0000-0000000000a3';
  client_a_unassigned uuid := '00000000-0000-0000-0000-0000000000a4';
  owner_b uuid := '00000000-0000-0000-0000-0000000000b1';
  team_b uuid := '00000000-0000-0000-0000-0000000000b2';
  client_b uuid := '00000000-0000-0000-0000-0000000000b3';
  invite_a uuid := '00000000-0000-0000-0000-0000000000a5';

  org_a uuid := '10000000-0000-0000-0000-0000000000a1';
  org_b uuid := '10000000-0000-0000-0000-0000000000b1';

  proj_a1 uuid := '20000000-0000-0000-0000-0000000000a1';
  proj_a2 uuid := '20000000-0000-0000-0000-0000000000a2';
  proj_b1 uuid := '20000000-0000-0000-0000-0000000000b1';

  v_password text;
BEGIN
  v_password := extensions.crypt('RlsPlan123!', extensions.gen_salt('bf', 10));

  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at,
    confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at, updated_at
  ) VALUES
    (owner_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner_a+rls@test.local', v_password, now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"full_name":"Owner A"}', now(), now()),
    (team_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'team_a+rls@test.local', v_password, now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"full_name":"Team A"}', now(), now()),
    (client_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client_a+rls@test.local', v_password, now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"full_name":"Client A"}', now(), now()),
    (client_a_unassigned, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client_a_unassigned+rls@test.local', v_password, now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"full_name":"Client A Unassigned"}', now(), now()),
    (owner_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner_b+rls@test.local', v_password, now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"full_name":"Owner B"}', now(), now()),
    (team_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'team_b+rls@test.local', v_password, now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"full_name":"Team B"}', now(), now()),
    (client_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client_b+rls@test.local', v_password, now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"full_name":"Client B"}', now(), now()),
    (invite_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'invite_a+rls@test.local', v_password, now(), '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{"full_name":"Invite A"}', now(), now());

  INSERT INTO public.organizations (id, name, owner_id)
  VALUES
    (org_a, 'Org A', owner_a),
    (org_b, 'Org B', owner_b);

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES
    (org_a, owner_a, 'owner'),
    (org_a, team_a, 'team_member'),
    (org_a, client_a, 'client'),
    (org_a, client_a_unassigned, 'client'),
    (org_b, owner_b, 'owner'),
    (org_b, team_b, 'team_member'),
    (org_b, client_b, 'client');

  INSERT INTO public.projects (id, organization_id, name, description, status, due_date, created_by)
  VALUES
    (proj_a1, org_a, 'proj_a1', 'Assigned to team_a + client_a', 'active', current_date + 14, owner_a),
    (proj_a2, org_a, 'proj_a2', 'Assigned to team_a only', 'active', current_date + 21, owner_a),
    (proj_b1, org_b, 'proj_b1', 'Org B project', 'active', current_date + 14, owner_b);

  INSERT INTO public.project_members (project_id, user_id)
  VALUES
    (proj_a1, owner_a),
    (proj_a1, team_a),
    (proj_a1, client_a),
    (proj_a2, owner_a),
    (proj_a2, team_a),
    (proj_b1, owner_b),
    (proj_b1, team_b),
    (proj_b1, client_b);
END;
$$;

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.role" = 'authenticated';

DO $$
DECLARE
  owner_a uuid := '00000000-0000-0000-0000-0000000000a1';
  team_a uuid := '00000000-0000-0000-0000-0000000000a2';
  client_a uuid := '00000000-0000-0000-0000-0000000000a3';
  client_a_unassigned uuid := '00000000-0000-0000-0000-0000000000a4';
  owner_b uuid := '00000000-0000-0000-0000-0000000000b1';
  team_b uuid := '00000000-0000-0000-0000-0000000000b2';
  client_b uuid := '00000000-0000-0000-0000-0000000000b3';
  invite_a uuid := '00000000-0000-0000-0000-0000000000a5';

  org_a uuid := '10000000-0000-0000-0000-0000000000a1';
  org_b uuid := '10000000-0000-0000-0000-0000000000b1';

  proj_a1 uuid := '20000000-0000-0000-0000-0000000000a1';
  proj_a2 uuid := '20000000-0000-0000-0000-0000000000a2';

  actor uuid;
  c bigint;
  affected bigint;
  temp_project uuid;
  denied boolean;
BEGIN
  -- Scenario A: tenant isolation.
  FOREACH actor IN ARRAY ARRAY[owner_a, team_a, client_a]
  LOOP
    PERFORM set_config('request.jwt.claim.sub', actor::text, true);

    SELECT count(*) INTO c FROM public.profiles WHERE id IN (owner_b, team_b, client_b);
    PERFORM pg_temp.assert_eq('A/profiles cross-tenant hidden', c, 0);

    SELECT count(*) INTO c FROM public.organizations WHERE id = org_b;
    PERFORM pg_temp.assert_eq('A/organizations cross-tenant hidden', c, 0);

    SELECT count(*) INTO c FROM public.organization_members WHERE organization_id = org_b;
    PERFORM pg_temp.assert_eq('A/org_members cross-tenant hidden', c, 0);

    SELECT count(*) INTO c FROM public.projects WHERE organization_id = org_b;
    PERFORM pg_temp.assert_eq('A/projects cross-tenant hidden', c, 0);

    SELECT count(*) INTO c
    FROM public.project_members pm
    JOIN public.projects p ON p.id = pm.project_id
    WHERE p.organization_id = org_b;
    PERFORM pg_temp.assert_eq('A/project_members cross-tenant hidden', c, 0);
  END LOOP;

  -- Scenario B: owner privileges.
  PERFORM set_config('request.jwt.claim.sub', owner_a::text, true);

  INSERT INTO public.projects (organization_id, name, status, created_by)
  VALUES (org_a, 'owner temp project', 'active', owner_a)
  RETURNING id INTO temp_project;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('B/owner insert project', affected, 1);

  UPDATE public.projects
  SET name = 'owner temp project updated'
  WHERE id = temp_project;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('B/owner update project', affected, 1);

  DELETE FROM public.projects WHERE id = temp_project;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('B/owner delete project', affected, 1);

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_a, invite_a, 'client');
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('B/owner insert member', affected, 1);

  UPDATE public.organization_members
  SET role = 'team_member'
  WHERE organization_id = org_a
    AND user_id = invite_a;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('B/owner update member role', affected, 1);

  DELETE FROM public.organization_members
  WHERE organization_id = org_a
    AND user_id = invite_a;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('B/owner delete member', affected, 1);

  UPDATE public.organizations
  SET name = 'Org A Renamed by Owner'
  WHERE id = org_a;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('B/owner update organization', affected, 1);

  -- Scenario C: team_member boundaries.
  PERFORM set_config('request.jwt.claim.sub', team_a::text, true);

  INSERT INTO public.projects (organization_id, name, status, created_by)
  VALUES (org_a, 'team temp project', 'review', team_a)
  RETURNING id INTO temp_project;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('C/team insert project', affected, 1);

  UPDATE public.projects
  SET description = 'updated by team member'
  WHERE id = temp_project;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('C/team update project', affected, 1);

  DELETE FROM public.projects WHERE id = temp_project;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('C/team delete denied', affected, 0);

  UPDATE public.organizations
  SET name = 'should not change'
  WHERE id = org_a;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('C/team org update denied', affected, 0);

  UPDATE public.organization_members
  SET role = 'owner'
  WHERE organization_id = org_a
    AND user_id = client_a;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('C/team role change denied', affected, 0);

  -- Scenario D: client assignment gating.
  PERFORM set_config('request.jwt.claim.sub', client_a::text, true);

  SELECT count(*) INTO c FROM public.projects WHERE id = proj_a1;
  PERFORM pg_temp.assert_eq('D/client assigned project visible', c, 1);

  SELECT count(*) INTO c FROM public.projects WHERE id = proj_a2;
  PERFORM pg_temp.assert_eq('D/client unassigned project hidden', c, 0);

  SELECT count(*) INTO c
  FROM public.project_members
  WHERE project_id = proj_a1;
  PERFORM pg_temp.assert_true('D/client sees assigned project memberships', c > 0);

  SELECT count(*) INTO c
  FROM public.project_members
  WHERE project_id = proj_a2;
  PERFORM pg_temp.assert_eq('D/client unassigned project memberships hidden', c, 0);

  denied := false;
  BEGIN
    INSERT INTO public.projects (organization_id, name, status, created_by)
    VALUES (org_a, 'client forbidden insert', 'active', client_a);
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      denied := true;
  END;
  PERFORM pg_temp.assert_true('D/client insert denied', denied);

  UPDATE public.projects
  SET name = 'client should not update'
  WHERE id = proj_a1;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('D/client update denied', affected, 0);

  DELETE FROM public.projects WHERE id = proj_a1;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('D/client delete denied', affected, 0);

  -- Scenario E: self-removal semantics.
  PERFORM set_config('request.jwt.claim.sub', team_a::text, true);

  DELETE FROM public.organization_members
  WHERE organization_id = org_a
    AND user_id = team_a;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('E/team self-delete succeeds', affected, 1);

  DELETE FROM public.organization_members
  WHERE organization_id = org_a
    AND user_id = client_a;
  GET DIAGNOSTICS affected = ROW_COUNT;
  PERFORM pg_temp.assert_eq('E/team delete others denied', affected, 0);

  PERFORM set_config('request.jwt.claim.sub', owner_a::text, true);
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_a, team_a, 'team_member');

  -- Scenario F: no implicit write paths.
  FOREACH actor IN ARRAY ARRAY[owner_a, team_a, client_a]
  LOOP
    PERFORM set_config('request.jwt.claim.sub', actor::text, true);

    UPDATE public.project_members
    SET user_id = user_id
    WHERE project_id = proj_a1
      AND user_id = client_a;
    GET DIAGNOSTICS affected = ROW_COUNT;
    PERFORM pg_temp.assert_eq('F/project_members update denied', affected, 0);

    DELETE FROM public.organizations WHERE id = org_a;
    GET DIAGNOSTICS affected = ROW_COUNT;
    PERFORM pg_temp.assert_eq('F/organizations delete denied', affected, 0);

    DELETE FROM public.profiles WHERE id = actor;
    GET DIAGNOSTICS affected = ROW_COUNT;
    PERFORM pg_temp.assert_eq('F/profiles delete denied', affected, 0);
  END LOOP;

  PERFORM set_config('request.jwt.claim.sub', client_a_unassigned::text, true);
  SELECT count(*) INTO c FROM public.projects WHERE organization_id = org_a;
  PERFORM pg_temp.assert_eq('D/client_unassigned sees no org projects', c, 0);

  RAISE NOTICE 'RLS test plan scenarios A-F passed.';
END;
$$;

ROLLBACK;
