-- Migration: 001_foundation
-- Creates the core tables for multi-tenant auth: profiles, organizations, organization_members

-- profiles: mirrors auth.users with extra display fields
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- organizations: each agency is one organization
CREATE TABLE public.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- organization_members: maps users to orgs with a role
CREATE TYPE public.member_role AS ENUM ('owner', 'team_member', 'client');

CREATE TABLE public.organization_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             public.member_role NOT NULL DEFAULT 'client',
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_organization_members_user_id    ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org_id     ON public.organization_members(organization_id);
CREATE INDEX idx_organizations_owner_id          ON public.organizations(owner_id);
