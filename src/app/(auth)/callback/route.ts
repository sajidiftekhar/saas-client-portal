import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles OAuth redirects, magic-link callbacks, and email confirmation.
 * After exchanging the code for a session, creates the organization for
 * new signups (when email confirmation is enabled).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if this user already belongs to an organization.
      // If not, this is a fresh email-confirmed signup — create the org now.
      const { data: orgRows } = await supabase.rpc("get_user_organization");
      const hasOrg = orgRows && orgRows.length > 0;

      if (!hasOrg) {
        const orgName =
          (data.user.user_metadata?.organization_name as string | undefined) ??
          "My Organization";
        await supabase.rpc("create_organization", { org_name: orgName });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — send to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
