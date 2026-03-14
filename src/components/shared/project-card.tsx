"use client";

import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PROJECT_STATUS_CONFIG, type ProjectWithMembers } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: ProjectWithMembers;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];
  const members = project.project_members ?? [];
  const visibleMembers = members.slice(0, 3);
  const overflowCount = Math.max(0, members.length - 3);
  const overdue = isOverdue(project.due_date);
  const formattedDate = formatDate(project.due_date);

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <Card className="h-full transition-all duration-200 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 rounded-xl border cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {project.name}
            </h3>
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                statusConfig.color
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)} />
              {statusConfig.label}
            </span>
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {project.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            {/* Member avatars */}
            <div className="flex items-center gap-1.5">
              {members.length > 0 ? (
                <div className="flex -space-x-2">
                  {visibleMembers.map((m) => (
                    <Avatar
                      key={m.id}
                      className="h-7 w-7 border-2 border-background ring-0"
                    >
                      <AvatarImage src={m.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] font-medium">
                        {getInitials(m.profiles?.full_name ?? m.profiles?.email)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {overflowCount > 0 && (
                    <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                      +{overflowCount}
                    </div>
                  )}
                </div>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  No members
                </span>
              )}
            </div>

            {/* Due date */}
            {formattedDate && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  overdue
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {overdue ? "Overdue · " : ""}
                {formattedDate}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
