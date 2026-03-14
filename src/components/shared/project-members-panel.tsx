"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addProjectMember,
  removeProjectMember,
} from "@/app/(dashboard)/projects/actions";
import type {
  MemberRole,
  OrganizationMemberWithProfile,
  ProjectMemberWithProfile,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  team_member: "Team Member",
  client: "Client",
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectMembersPanelProps {
  projectId: string;
  projectMembers: ProjectMemberWithProfile[];
  /** All org members (to populate the "Add member" dropdown) */
  orgMembers: OrganizationMemberWithProfile[];
  currentUserId: string;
  canManage: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectMembersPanel({
  projectId,
  projectMembers,
  orgMembers,
  currentUserId,
  canManage,
}: ProjectMembersPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Org members not yet on this project
  const projectMemberUserIds = new Set(projectMembers.map((m) => m.user_id));
  const eligibleToAdd = orgMembers.filter(
    (om) => !projectMemberUserIds.has(om.user_id)
  );

  function handleAdd() {
    if (!selectedUserId) return;
    startTransition(async () => {
      const result = await addProjectMember({
        project_id: projectId,
        user_id: selectedUserId,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Member added");
        setSelectedUserId("");
        setAddOpen(false);
      }
    });
  }

  function handleRemove(userId: string) {
    setRemovingId(userId);
    startTransition(async () => {
      const result = await removeProjectMember({
        project_id: projectId,
        user_id: userId,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Member removed");
      }
      setRemovingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Members ({projectMembers.length})
        </h3>
        {canManage && eligibleToAdd.length > 0 && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Member
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[360px]">
              <DialogHeader>
                <DialogTitle>Add Project Member</DialogTitle>
                <DialogDescription>
                  Select an organization member to add to this project.
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                <Select
                  value={selectedUserId}
                  onValueChange={(v) => { if (v !== null) setSelectedUserId(v); }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a member…" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleToAdd.map((om) => (
                      <SelectItem key={om.user_id} value={om.user_id}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">
                            {om.profiles?.full_name ?? om.profiles?.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · {ROLE_LABELS[om.role]}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!selectedUserId || isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Member list */}
      {projectMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <ul className="space-y-2">
          {projectMembers.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const orgMember = orgMembers.find(
              (om) => om.user_id === member.user_id
            );
            const displayName =
              member.profiles?.full_name ?? member.profiles?.email ?? "Unknown";
            const role = orgMember?.role;

            return (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 bg-muted/40"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={member.profiles?.avatar_url ?? undefined}
                  />
                  <AvatarFallback className="text-xs font-medium">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {displayName}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  {member.profiles?.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.profiles.email}
                    </p>
                  )}
                </div>

                {role && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {ROLE_LABELS[role]}
                  </Badge>
                )}

                {canManage && !isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.user_id)}
                    disabled={removingId === member.user_id || isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    aria-label={`Remove ${displayName}`}
                  >
                    {removingId === member.user_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
