-- =============================================================================
-- Seed: Demo Data for Agency Client Portal
-- =============================================================================
-- Run automatically by: supabase db reset --linked
-- Run manually with:    supabase db reset --linked  (or push + run via dashboard)
--
-- Demo accounts (all use password: Demo1234!)
--   owner@demo.com   — Owner
--   member@demo.com  — Team Member
--   client@demo.com  — Client
-- =============================================================================

DO $$
DECLARE
  v_password    text;
  v_owner_id    uuid := gen_random_uuid();
  v_member_id   uuid := gen_random_uuid();
  v_client_id   uuid := gen_random_uuid();
  v_org_id      uuid := gen_random_uuid();
  v_project1_id uuid := gen_random_uuid();
  v_project2_id uuid := gen_random_uuid();
  v_project3_id uuid := gen_random_uuid();
BEGIN

  -- Bcrypt-hash the shared demo password using pgcrypto (available in all Supabase projects)
  v_password := extensions.crypt('Demo1234!', extensions.gen_salt('bf', 10));

  -- ── Auth users ─────────────────────────────────────────────────────────────
  -- Inserting here fires the handle_new_user() trigger, which auto-creates
  -- a row in public.profiles for each user.
  -- GoTrue requires these token columns to be '' (empty string), not NULL.
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
    (
      v_owner_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'owner@demo.com', v_password, now(),
      '', '', '', '', '',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Alex Rivera"}',
      now(), now()
    ),
    (
      v_member_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'member@demo.com', v_password, now(),
      '', '', '', '', '',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Sam Chen"}',
      now(), now()
    ),
    (
      v_client_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'client@demo.com', v_password, now(),
      '', '', '', '', '',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Jordan Taylor"}',
      now(), now()
    );

  -- ── Organization ───────────────────────────────────────────────────────────
  INSERT INTO public.organizations (id, name, owner_id)
  VALUES (v_org_id, 'Acme Agency', v_owner_id);

  -- ── Org members ────────────────────────────────────────────────────────────
  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES
    (v_org_id, v_owner_id,  'owner'),
    (v_org_id, v_member_id, 'team_member'),
    (v_org_id, v_client_id, 'client');

  -- ── Projects ───────────────────────────────────────────────────────────────
  INSERT INTO public.projects (id, organization_id, name, description, status, due_date, created_by) VALUES
    (
      v_project1_id, v_org_id,
      'Website Redesign',
      'Complete overhaul of the client''s marketing website with updated branding and improved UX.',
      'active',
      current_date + 30,
      v_owner_id
    ),
    (
      v_project2_id, v_org_id,
      'Mobile App Development',
      'Cross-platform mobile application for iOS and Android with real-time sync.',
      'review',
      current_date + 60,
      v_member_id
    ),
    (
      v_project3_id, v_org_id,
      'Brand Identity Package',
      'Logo, color palette, typography, and comprehensive brand guidelines document.',
      'completed',
      current_date - 7,
      v_owner_id
    );

  -- ── Project members ────────────────────────────────────────────────────────
  -- Website Redesign — full team including client
  INSERT INTO public.project_members (project_id, user_id) VALUES
    (v_project1_id, v_owner_id),
    (v_project1_id, v_member_id),
    (v_project1_id, v_client_id),
    -- Mobile App — internal team only
    (v_project2_id, v_owner_id),
    (v_project2_id, v_member_id),
    -- Brand Identity — owner + client
    (v_project3_id, v_owner_id),
    (v_project3_id, v_client_id);

END;
$$;
