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
