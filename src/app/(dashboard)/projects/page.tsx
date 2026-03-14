import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/shared/project-card";
import { ProjectFormSheet } from "@/components/shared/project-form-sheet";
import { ProjectStatusFilter } from "@/components/shared/project-status-filter";
import type { ProjectStatus, ProjectWithMembers } from "@/types";

const VALID_STATUSES: ProjectStatus[] = [
  "active",
  "review",
  "completed",
  "on_hold",
  "archived",
];

interface ProjectsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { status: rawStatus } = await searchParams;
  const activeStatus: ProjectStatus | "all" =
    rawStatus && (VALID_STATUSES as string[]).includes(rawStatus)
      ? (rawStatus as ProjectStatus)
      : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orgRows } = await supabase.rpc("get_user_organization");
  const org = orgRows?.[0];
  if (!org) redirect("/dashboard");

  const canCreate =
    org.role === "owner" || org.role === "team_member";

  // Build query
  let query = supabase
    .from("projects")
    .select("*, project_members(*, profiles(*))")
    .eq("organization_id", org.organization_id)
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data: projects, error: projectsError } = await query;
  if (projectsError) console.error("[projects page] query error:", projectsError);
  const typedProjects = (projects ?? []) as unknown as ProjectWithMembers[];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {typedProjects.length === 0
              ? activeStatus === "all"
                ? "No projects yet — create your first one."
                : `No ${activeStatus.replace("_", " ")} projects.`
              : `${typedProjects.length} project${typedProjects.length !== 1 ? "s" : ""}${
                  activeStatus !== "all"
                    ? ` · ${activeStatus.replace("_", " ")}`
                    : ""
                }`}
          </p>
        </div>

        {canCreate && (
          <ProjectFormSheet
            organizationId={org.organization_id}
            trigger={
              <Button className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            }
          />
        )}
      </div>

      {/* Status filter */}
      <Suspense fallback={<Skeleton className="h-8 w-80" />}>
        <ProjectStatusFilter currentStatus={activeStatus} />
      </Suspense>

      {/* Project grid */}
      {typedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold text-lg mb-1">
            {activeStatus === "all" ? "No projects yet" : "No projects found"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            {activeStatus === "all"
              ? "Create your first project to start managing tasks, files, and communication."
              : `There are no projects with status "${activeStatus.replace("_", " ")}". Try a different filter.`}
          </p>
          {canCreate && activeStatus === "all" && (
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
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {typedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
