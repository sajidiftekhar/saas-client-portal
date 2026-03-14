"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/types";

// Base path for this module's routes
const PROJECTS_PATH = "/projects";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["active", "review", "completed", "on_hold", "archived"]),
  due_date: z.string().nullable().optional(),
  organization_id: z.string().uuid(),
});

const updateProjectSchema = projectSchema.extend({
  id: z.string().uuid(),
});

const projectIdSchema = z.object({
  id: z.string().uuid(),
});

const projectMemberSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult = { error: string } | { success: true };
type ActionResultWithId = { error: string } | { success: true; id: string };

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createProject(values: {
  name: string;
  description?: string | null;
  status: ProjectStatus;
  due_date?: string | null;
  organization_id: string;
}): Promise<ActionResultWithId> {
  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...parsed.data,
      created_by: user.id,
      due_date: parsed.data.due_date || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Auto-add creator as project member so they can access it
  await supabase
    .from("project_members")
    .insert({ project_id: data.id, user_id: user.id });

  revalidatePath(PROJECTS_PATH);
  revalidatePath("/dashboard");

  return { success: true, id: data.id };
}

export async function updateProject(values: {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  due_date?: string | null;
  organization_id: string;
}): Promise<ActionResult> {
  const parsed = updateProjectSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { id, ...fields } = parsed.data;

  const { error } = await supabase
    .from("projects")
    .update({ ...fields, due_date: fields.due_date || null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(PROJECTS_PATH);
  revalidatePath(`${PROJECTS_PATH}/${id}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteProject(values: { id: string }): Promise<never> {
  const parsed = projectIdSchema.safeParse(values);
  if (!parsed.success) redirect("/projects");

  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", parsed.data.id);

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  redirect("/projects");
}

export async function addProjectMember(values: {
  project_id: string;
  user_id: string;
}): Promise<ActionResult> {
  const parsed = projectMemberSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .insert(parsed.data);

  if (error) {
    // 23505 = unique_violation (already a member)
    if (error.code === "23505") return { error: "User is already a member" };
    return { error: error.message };
  }

  revalidatePath(`/projects/${parsed.data.project_id}`);
  return { success: true };
}

export async function removeProjectMember(values: {
  project_id: string;
  user_id: string;
}): Promise<ActionResult> {
  const parsed = projectMemberSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", parsed.data.project_id)
    .eq("user_id", parsed.data.user_id);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${parsed.data.project_id}`);
  return { success: true };
}
