import { redirect, notFound } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  MessageSquare,
  FolderOpen,
  Activity,
  Pencil,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ProjectFormSheet } from "@/components/shared/project-form-sheet";
import { ProjectMembersPanel } from "@/components/shared/project-members-panel";
import { DeleteProjectButton } from "@/components/shared/delete-project-button";
import type {
  MemberRole,
  OrganizationMemberWithProfile,
  ProjectWithMembers,
  ProjectStatus,
} from "@/types";
import { PROJECT_STATUS_CONFIG } from "@/types";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

// ─── Placeholder tab content ─────────────────────────────────────────────────

function ComingSoonTab({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center mt-4">
      <Icon className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs">{description}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orgRows } = await supabase.rpc("get_user_organization");
  const org = orgRows?.[0];
  if (!org) redirect("/dashboard");

  // Fetch project with members + their profiles
  const { data: projectData, error } = await supabase
    .from("projects")
    .select("*, project_members(*, profiles(*))")
    .eq("id", id)
    .eq("organization_id", org.organization_id)
    .single();

  if (error || !projectData) notFound();

  const project = projectData as unknown as ProjectWithMembers;

  // Fetch all org members for the members management panel
  const { data: orgMembersData } = await supabase
    .from("organization_members")
    .select("*, profiles(*)")
    .eq("organization_id", org.organization_id)
    .order("created_at");

  const orgMembers = (orgMembersData ?? []) as unknown as OrganizationMemberWithProfile[];

  const role = org.role as MemberRole;
  const canEdit = role === "owner" || role === "team_member";
  const canDelete = role === "owner";
  const canManageMembers = role === "owner" || role === "team_member";

  const statusConfig = PROJECT_STATUS_CONFIG[project.status as ProjectStatus];
  const formattedDate = formatDate(project.due_date);
  const overdue = isOverdue(project.due_date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <a
            href="/projects"
            className="hover:text-foreground transition-colors"
          >
            Projects
          </a>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[280px]">
            {project.name}
          </span>
        </div>

        {/* Title row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              {/* Status badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  statusConfig.color
                )}
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)}
                />
                {statusConfig.label}
              </span>
            </div>

            {project.description && (
              <p className="text-muted-foreground text-sm max-w-2xl">
                {project.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {formattedDate && (
                <span
                  className={cn(
                    "flex items-center gap-1.5",
                    overdue ? "text-destructive font-medium" : ""
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {overdue ? "Overdue · " : "Due "}
                  {formattedDate}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Created{" "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(project.created_at))}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <ProjectFormSheet
                organizationId={org.organization_id}
                project={project}
                trigger={
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                }
              />
            )}
            {canDelete && (
              <DeleteProjectButton
                projectId={project.id}
                projectName={project.name}
              />
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full justify-start border-b rounded-none pb-0 h-auto gap-0">
          <TabsTrigger value="overview" className="rounded-none pb-3 px-4">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-none pb-3 px-4">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-none pb-3 px-4">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="files" className="rounded-none pb-3 px-4">
            <FolderOpen className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-none pb-3 px-4">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Project details card */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground mb-0.5">Status</dt>
                      <dd>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                            statusConfig.color
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              statusConfig.dot
                            )}
                          />
                          {statusConfig.label}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground mb-0.5">Due Date</dt>
                      <dd
                        className={cn(
                          "font-medium",
                          overdue ? "text-destructive" : ""
                        )}
                      >
                        {formattedDate ?? (
                          <span className="text-muted-foreground font-normal">
                            Not set
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground mb-0.5">Created</dt>
                      <dd className="font-medium">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(project.created_at))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground mb-0.5">Members</dt>
                      <dd className="font-medium">
                        {project.project_members.length}
                      </dd>
                    </div>
                  </dl>

                  {project.description && (
                    <>
                      <Separator />
                      <div>
                        <dt className="text-muted-foreground text-sm mb-1">
                          Description
                        </dt>
                        <dd className="text-sm leading-relaxed whitespace-pre-wrap">
                          {project.description}
                        </dd>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Members panel */}
            <div>
              <Card>
                <CardContent className="pt-5">
                  <ProjectMembersPanel
                    projectId={project.id}
                    projectMembers={project.project_members}
                    orgMembers={orgMembers}
                    currentUserId={user.id}
                    canManage={canManageMembers}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tasks (placeholder) */}
        <TabsContent value="tasks">
          <ComingSoonTab
            icon={CheckSquare}
            title="Tasks — Coming Soon"
            description="Create and assign tasks, track progress, and manage deadlines for this project."
          />
        </TabsContent>

        {/* Chat (placeholder) */}
        <TabsContent value="chat">
          <ComingSoonTab
            icon={MessageSquare}
            title="Chat — Coming Soon"
            description="Communicate in real time with your team and clients directly in this project."
          />
        </TabsContent>

        {/* Files (placeholder) */}
        <TabsContent value="files">
          <ComingSoonTab
            icon={FolderOpen}
            title="Files — Coming Soon"
            description="Upload documents, designs, and contracts and share them with your team and clients."
          />
        </TabsContent>

        {/* Activity (placeholder) */}
        <TabsContent value="activity">
          <ComingSoonTab
            icon={Activity}
            title="Activity Feed — Coming Soon"
            description="See a full audit trail of everything that happens in this project."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
