import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, CheckSquare, Upload, Activity, ArrowRight, Plus } from "lucide-react";
import { ProjectCard } from "@/components/shared/project-card";
import { ProjectFormSheet } from "@/components/shared/project-form-sheet";
import type { ProjectWithMembers, MemberRole } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: orgRows } = await supabase.rpc("get_user_organization");
  const org = orgRows?.[0];
  if (!org) redirect("/dashboard");

  // Fetch project count and recent projects in parallel
  const [{ count: projectCount, error: countError }, { data: recentProjectsData, error: projectsError }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.organization_id),
      supabase
        .from("projects")
        .select("*, project_members(*, profiles(*))")
        .eq("organization_id", org.organization_id)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
  if (countError) console.error("[dashboard] project count error:", countError);
  if (projectsError) console.error("[dashboard] recent projects error:", projectsError);

  const recentProjects = (recentProjectsData ?? []) as unknown as ProjectWithMembers[];
  const role = org.role as MemberRole;
  const canCreate = role === "owner" || role === "team_member";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here&apos;s an overview of your organization.
        </p>
      </div>

      {/* Summary widgets */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={String(projectCount ?? 0)}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          href="/dashboard/projects"
        />
        <StatCard
          title="Tasks Due Today"
          value="0"
          icon={<CheckSquare className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Files Uploaded"
          value="0"
          icon={<Upload className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Recent Activity"
          value="—"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Recent projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Projects</h2>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-1">No projects yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Create your first project to start managing tasks, files, and
                communication with your clients.
              </p>
              {canCreate && (
                <ProjectFormSheet
                  organizationId={org.organization_id}
                  trigger={
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Project
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <Card className={href ? "transition-all duration-200 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 cursor-pointer" : "shadow-[var(--shadow-card)]"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
