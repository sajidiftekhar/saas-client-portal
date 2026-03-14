import type { Database } from "./database";

export type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type OrganizationMember =
  Database["public"]["Tables"]["organization_members"]["Row"];
export type MemberRole = "owner" | "team_member" | "client";

export type OrganizationMemberWithProfile = OrganizationMember & {
  profiles: Profile;
};

// ─── Projects ────────────────────────────────────────────────
export type ProjectStatus =
  | "active"
  | "review"
  | "completed"
  | "on_hold"
  | "archived";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember =
  Database["public"]["Tables"]["project_members"]["Row"];

export type ProjectMemberWithProfile = ProjectMember & {
  profiles: Profile;
};

export type ProjectWithMembers = Project & {
  project_members: ProjectMemberWithProfile[];
};

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "[background-color:var(--status-active-bg)] [color:var(--status-active-text)] [border-color:var(--status-active-border)]",
    dot: "[background-color:var(--status-active-dot)]",
  },
  review: {
    label: "In Review",
    color: "[background-color:var(--status-review-bg)] [color:var(--status-review-text)] [border-color:var(--status-review-border)]",
    dot: "[background-color:var(--status-review-dot)]",
  },
  completed: {
    label: "Completed",
    color: "[background-color:var(--status-completed-bg)] [color:var(--status-completed-text)] [border-color:var(--status-completed-border)]",
    dot: "[background-color:var(--status-completed-dot)]",
  },
  on_hold: {
    label: "On Hold",
    color: "[background-color:var(--status-on-hold-bg)] [color:var(--status-on-hold-text)] [border-color:var(--status-on-hold-border)]",
    dot: "[background-color:var(--status-on-hold-dot)]",
  },
  archived: {
    label: "Archived",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};
