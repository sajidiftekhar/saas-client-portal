"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Update organization name ────────────────────────────────────────────────
const updateOrgSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2),
});

export async function updateOrganizationName(
  organizationId: string,
  name: string
) {
  const parsed = updateOrgSchema.safeParse({ organizationId, name });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.organizationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// ─── Invite user ─────────────────────────────────────────────────────────────
const inviteSchema = z.object({
  email: z.string().email(),
  organizationId: z.string().uuid(),
  role: z.enum(["team_member", "client"]),
});

export async function inviteTeamMember(
  organizationId: string,
  email: string,
  role: "team_member" | "client"
) {
  const parsed = inviteSchema.safeParse({ email, organizationId, role });
  if (!parsed.success) return { error: "Invalid input" };

  const serviceClient = await createServiceClient();

  // Invite via Supabase Auth admin API
  const { data: inviteData, error: inviteError } =
    await serviceClient.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { organization_id: parsed.data.organizationId, role: parsed.data.role },
    });

  if (inviteError) return { error: inviteError.message };

  // Pre-insert member record so the invited user lands in the right org on first login
  const { error: memberError } = await serviceClient
    .from("organization_members")
    .upsert(
      {
        organization_id: parsed.data.organizationId,
        user_id: inviteData.user.id,
        role: parsed.data.role,
      },
      { onConflict: "organization_id,user_id" }
    );

  if (memberError) return { error: memberError.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Update member role ───────────────────────────────────────────────────────
export async function updateMemberRole(
  memberId: string,
  role: "team_member" | "client"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Remove member ────────────────────────────────────────────────────────────
export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
