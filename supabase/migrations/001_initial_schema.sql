-- =============================================================================
-- Initial Schema — Agency Client Portal (Multi-Tenant SaaS)
-- =============================================================================
-- Consolidated from migrations 001–007.
-- This file represents the full final schema state.
--
-- Tables
--   public.profiles
--   public.organizations
--   public.organization_members
--   public.projects
--   public.project_members
--
-- All user FK columns in public tables reference public.profiles(id)
-- (not auth.users directly) so PostgREST can resolve joins.
-- The one direct auth.users reference remaining is profiles.id itself,
-- which is the root anchor for the entire user identity chain.
-- =============================================================================


-- =============================================================================
-- 1. ENUMS
-- =============================================================================

CREATE TYPE public.member_role AS ENUM ('owner', 'team_member', 'client');

CREATE TYPE public.project_status AS ENUM (
  'active',
  'review',
  'completed',
  'on_hold',
  'archived'
);


-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- profiles: mirrors auth.users with display fields.
-- Populated automatically via handle_new_user() trigger.
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- organizations: each agency is one tenant.
CREATE TABLE public.organizations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  owner_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- organization_members: maps users to orgs with a role.
-- user_id → public.profiles so PostgREST can resolve the join.
CREATE TABLE public.organization_members (
  id               uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          uuid              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role             public.member_role NOT NULL DEFAULT 'client',
  created_at       timestamptz       NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org_id  ON public.organization_members(organization_id);
CREATE INDEX idx_organizations_owner_id       ON public.organizations(owner_id);

-- projects: client engagements belonging to an organization.
-- created_by → public.profiles so PostgREST can resolve the join.
CREATE TABLE public.projects (
  id               uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid                 NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             text                 NOT NULL,
  description      text,
  status           public.project_status NOT NULL DEFAULT 'active',
  due_date         date,
  created_by       uuid                 NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at       timestamptz          NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX idx_projects_created_by      ON public.projects(created_by);

-- project_members: explicitly assigns users to projects.
-- Required for client-scoped visibility (clients only see projects they are added to).
-- user_id → public.profiles so PostgREST can resolve the join.
CREATE TABLE public.project_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id    ON public.project_members(user_id);


-- =============================================================================
-- 3. RLS — ENABLE
-- =============================================================================

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members     ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS
--
-- All RLS policies use these functions instead of inline subqueries.
-- SECURITY DEFINER bypasses the calling policy's own RLS, preventing
-- infinite recursion across tables.
-- =============================================================================

-- Returns the organization_id the current user belongs to (NULL if none).
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Returns the calling user's role within a given org (NULL if not a member).
CREATE OR REPLACE FUNCTION public.get_my_org_role(org_id uuid)
  RETURNS public.member_role
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role
  FROM public.organization_members
  WHERE organization_id = org_id
    AND user_id = auth.uid()
  LIMIT 1;
$$;

-- Returns true if the current user is an explicit member of the given project.
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
      AND user_id    = auth.uid()
  );
$$;

-- Returns true if the given project belongs to the current user's organization.
CREATE OR REPLACE FUNCTION public.project_belongs_to_my_org(p_project_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id              = p_project_id
      AND organization_id = public.get_my_organization_id()
  );
$$;


-- =============================================================================
-- 5. RLS POLICIES
-- =============================================================================

-- ─── profiles ────────────────────────────────────────────────────────────────

CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Read profiles of members in the same organization.
CREATE POLICY "profiles: read org-mates"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.get_my_organization_id()
        AND user_id = profiles.id
    )
  );

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── organizations ────────────────────────────────────────────────────────────

-- Any member of the org can read it.
CREATE POLICY "organizations: read as member"
  ON public.organizations FOR SELECT
  USING (id = public.get_my_organization_id());

-- Only the owner can update org details.
CREATE POLICY "organizations: update as owner"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─── organization_members ─────────────────────────────────────────────────────

-- Any member can read the member list of their org.
CREATE POLICY "org_members: read as member"
  ON public.organization_members FOR SELECT
  USING (organization_id = public.get_my_organization_id());

-- Only the org owner can invite new members.
CREATE POLICY "org_members: insert as owner"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
        AND owner_id = auth.uid()
    )
  );

-- Only the org owner can change roles.
CREATE POLICY "org_members: update as owner"
  ON public.organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.organization_id
        AND owner_id = auth.uid()
    )
  );

-- Org owner can remove anyone; members can remove themselves.
CREATE POLICY "org_members: delete as owner or self"
  ON public.organization_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.organization_id
        AND owner_id = auth.uid()
    )
  );

-- ─── projects ────────────────────────────────────────────────────────────────

-- Owners and team members see all org projects.
-- Clients see only projects they are explicitly added to.
CREATE POLICY "projects_select"
  ON public.projects FOR SELECT
  USING (
    organization_id = public.get_my_organization_id()
    AND (
      public.get_my_org_role(organization_id) IN ('owner', 'team_member')
      OR (
        public.get_my_org_role(organization_id) = 'client'
        AND public.is_project_member(id)
      )
    )
  );

CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.get_my_org_role(organization_id) IN ('owner', 'team_member')
  );

CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.get_my_org_role(organization_id) IN ('owner', 'team_member')
  );

CREATE POLICY "projects_delete"
  ON public.projects FOR DELETE
  USING (
    organization_id = public.get_my_organization_id()
    AND public.get_my_org_role(organization_id) = 'owner'
  );

-- ─── project_members ─────────────────────────────────────────────────────────

CREATE POLICY "project_members_select"
  ON public.project_members FOR SELECT
  USING (
    public.project_belongs_to_my_org(project_id)
    AND (
      public.get_my_org_role(public.get_my_organization_id()) IN ('owner', 'team_member')
      OR (
        public.get_my_org_role(public.get_my_organization_id()) = 'client'
        AND public.is_project_member(project_id)
      )
    )
  );

CREATE POLICY "project_members_insert"
  ON public.project_members FOR INSERT
  WITH CHECK (
    public.project_belongs_to_my_org(project_id)
    AND public.get_my_org_role(public.get_my_organization_id()) IN ('owner', 'team_member')
  );

CREATE POLICY "project_members_delete"
  ON public.project_members FOR DELETE
  USING (
    public.project_belongs_to_my_org(project_id)
    AND public.get_my_org_role(public.get_my_organization_id()) IN ('owner', 'team_member')
  );


-- =============================================================================
-- 6. AUTH FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-create a profile row whenever a new auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomically creates an organization and adds the caller as owner.
-- Called from the signup server action.
-- SECURITY DEFINER lets it bypass RLS for the initial insert.
CREATE OR REPLACE FUNCTION public.create_organization(org_name text)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  INSERT INTO public.organizations (name, owner_id)
  VALUES (org_name, auth.uid())
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  RETURN new_org_id;
END;
$$;

-- Convenience function: returns the current user's org in a single RPC call.
CREATE OR REPLACE FUNCTION public.get_user_organization()
  RETURNS TABLE (
    organization_id   uuid,
    organization_name text,
    role              public.member_role
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    om.role
  FROM public.organization_members om
  JOIN public.organizations o ON o.id = om.organization_id
  WHERE om.user_id = auth.uid()
  LIMIT 1;
END;
$$;
