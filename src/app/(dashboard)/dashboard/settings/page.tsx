import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrgSettingsForm } from "@/components/shared/org-settings-form";
import { MemberList } from "@/components/shared/member-list";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: orgRows } = await supabase.rpc("get_user_organization");
  const org = orgRows?.[0];

  if (!org) redirect("/dashboard");

  // Only owners can access settings
  if (org.role !== "owner") redirect("/dashboard");

  const { data: orgDetails } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", org.organization_id)
    .single();

  const { data: members } = await supabase
    .from("organization_members")
    .select("*, profiles(*)")
    .eq("organization_id", org.organization_id)
    .order("created_at");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your organization and team members.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Organization</h2>
        <OrgSettingsForm organization={orgDetails} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Team Members</h2>
        <MemberList
          members={members ?? []}
          organizationId={org.organization_id}
          currentUserId={user.id}
        />
      </section>
    </div>
  );
}
