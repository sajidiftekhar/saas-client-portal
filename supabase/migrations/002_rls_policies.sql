-- Migration: 002_rls_policies
-- Enables Row-Level Security and defines policies for org isolation

-- ─── profiles ───────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Users can read profiles of members in the same organization
CREATE POLICY "profiles: read org-mates"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om1
      JOIN public.organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = profiles.id
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── organizations ───────────────────────────────────────────────────────────
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Members can read their organization
CREATE POLICY "organizations: read as member"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
    )
  );

-- Owner can update their organization
CREATE POLICY "organizations: update as owner"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─── organization_members ────────────────────────────────────────────────────
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Members can read the member list of their organization
CREATE POLICY "org_members: read as member"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members self
      WHERE self.organization_id = organization_members.organization_id
        AND self.user_id = auth.uid()
    )
  );

-- Only the org owner can add new members
CREATE POLICY "org_members: insert as owner"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
        AND owner_id = auth.uid()
    )
  );

-- Only the org owner can update roles
CREATE POLICY "org_members: update as owner"
  ON public.organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.organization_id
        AND owner_id = auth.uid()
    )
  );

-- Only the org owner can remove members (and members can remove themselves)
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
