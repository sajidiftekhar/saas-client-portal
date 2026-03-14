"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  inviteTeamMember,
  updateMemberRole,
  removeMember,
} from "@/app/(dashboard)/dashboard/settings/actions";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, UserPlus } from "lucide-react";
import type { OrganizationMember, Profile, MemberRole } from "@/types";

type MemberWithProfile = OrganizationMember & { profiles: Profile };

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["team_member", "client"]),
});
type InviteValues = z.infer<typeof inviteSchema>;

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  team_member: "Team Member",
  client: "Client",
};

function roleBadgeVariant(
  role: MemberRole
): "default" | "secondary" | "outline" {
  if (role === "owner") return "default";
  if (role === "team_member") return "secondary";
  return "outline";
}

function InviteDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "client" },
  });

  async function onSubmit(values: InviteValues) {
    setIsLoading(true);
    const result = await inviteTeamMember(
      organizationId,
      values.email,
      values.role
    );
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Invite sent to ${values.email}`);
      reset();
      setOpen(false);
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite member
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invite link to a new teammate or client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              defaultValue="client"
              onValueChange={(v) =>
                setValue("role", v as "team_member" | "client")
              }
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team_member">Team Member</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MemberList({
  members,
  organizationId,
  currentUserId,
}: {
  members: MemberWithProfile[];
  organizationId: string;
  currentUserId: string;
}) {
  async function handleRoleChange(memberId: string, role: "team_member" | "client") {
    const result = await updateMemberRole(memberId, role);
    if (result.error) toast.error(result.error);
    else toast.success("Role updated");
  }

  async function handleRemove(memberId: string) {
    const result = await removeMember(memberId);
    if (result.error) toast.error(result.error);
    else toast.success("Member removed");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteDialog organizationId={organizationId} />
      </div>

      <div className="divide-y rounded-md border">
        {members.map((member) => {
          const profile = member.profiles;
          const displayName = profile?.full_name ?? profile?.email ?? "Unknown";
          const initials = displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const isCurrentUser = member.user_id === currentUserId;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={profile?.avatar_url ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={roleBadgeVariant(member.role)}>
                  {ROLE_LABELS[member.role]}
                </Badge>

                {/* Don't show menu for the owner themselves */}
                {member.role !== "owner" && (
                  <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      />
                    }
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Member actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change role</DropdownMenuLabel>
                      <DropdownMenuItem
                        disabled={member.role === "team_member"}
                        onClick={() =>
                          handleRoleChange(member.id, "team_member")
                        }
                      >
                        Team Member
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={member.role === "client"}
                        onClick={() => handleRoleChange(member.id, "client")}
                      >
                        Client
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleRemove(member.id)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
