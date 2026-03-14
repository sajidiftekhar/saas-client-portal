-- Migration: 003_auth_trigger_and_org_function
-- 1. Trigger: auto-create a profile row when a new auth user is created
-- 2. Function: create_organization — atomically creates an org and assigns the caller as owner

-- ─── auto-create profile on signup ──────────────────────────────────────────
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

-- ─── create_organization ─────────────────────────────────────────────────────
-- Called from a server action immediately after signup.
-- SECURITY DEFINER lets it bypass RLS to insert the first org + member record.
CREATE OR REPLACE FUNCTION public.create_organization(org_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create the organization
  INSERT INTO public.organizations (name, owner_id)
  VALUES (org_name, auth.uid())
  RETURNING id INTO new_org_id;

  -- Add the caller as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  RETURN new_org_id;
END;
$$;

-- ─── get_user_organization ───────────────────────────────────────────────────
-- Convenience function to fetch the current user's org in one call.
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
