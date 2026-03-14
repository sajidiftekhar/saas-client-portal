import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile + org info
  const [{ data: profile }, { data: orgRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.rpc("get_user_organization"),
  ]);

  const org = orgRows?.[0] ?? null;

  return (
    <SidebarProvider>
      <DashboardSidebar organizationName={org?.organization_name ?? "My Org"} role={org?.role ?? "owner"} />
      <SidebarInset>
        <DashboardHeader user={user} profile={profile} />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
