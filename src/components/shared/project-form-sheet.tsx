"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject, updateProject } from "@/app/(dashboard)/projects/actions";
import { PROJECT_STATUS_CONFIG, type Project } from "@/types";
import { DatePicker } from "@/components/ui/date-picker";

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  status: z.enum(["active", "review", "completed", "on_hold", "archived"]),
  due_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectFormSheetProps {
  organizationId: string;
  /** When provided the sheet operates in edit mode */
  project?: Project;
  trigger: React.ReactElement;
  onSuccess?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectFormSheet({
  organizationId,
  project,
  trigger,
  onSuccess,
}: ProjectFormSheetProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = !!project;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "active",
      due_date: project?.due_date ?? "",
    },
  });

  const statusValue = watch("status");
  const dueDateValue = watch("due_date");

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      description: values.description || null,
      due_date: values.due_date || null,
      organization_id: organizationId,
    };

    const result = isEdit
      ? await updateProject({ ...payload, id: project!.id })
      : await createProject(payload);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Project updated" : "Project created");
    setOpen(false);
    reset();

    if (!isEdit) {
      const { id } = result as { success: true; id: string };
      onSuccess?.(id);
      router.push(`/projects/${id}`);
    } else {
      onSuccess?.(project!.id);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset({
        name: project?.name ?? "",
        description: project?.description ?? "",
        status: project?.status ?? "active",
        due_date: project?.due_date ?? "",
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={trigger} />

      <SheetContent className="data-[side=right]:sm:max-w-[580px] flex flex-col gap-0 p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b gap-1">
          <SheetTitle className="text-xl font-semibold">
            {isEdit ? "Edit Project" : "New Project"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {isEdit
              ? "Update the project details below."
              : "Fill in the details to create a new project."}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="px-6 py-6 space-y-5 flex-1">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Website Redesign"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Optional — what is this project about?"
                  rows={4}
                  className="resize-none"
                  {...register("description")}
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Status + Due date side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Select
                    value={statusValue}
                    onValueChange={(val) =>
                      setValue("status", val as FormValues["status"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(PROJECT_STATUS_CONFIG) as [
                          keyof typeof PROJECT_STATUS_CONFIG,
                          (typeof PROJECT_STATUS_CONFIG)[keyof typeof PROJECT_STATUS_CONFIG],
                        ][]
                      ).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="due_date" className="text-sm font-medium">Due Date</Label>
                  <DatePicker
                    id="due_date"
                    value={dueDateValue ?? ""}
                    onChange={(val) =>
                      setValue("due_date", val, { shouldValidate: true })
                    }
                    placeholder="Pick a date"
                  />
                  {errors.due_date && (
                    <p className="text-xs text-destructive">
                      {errors.due_date.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky footer actions */}
            <div className="flex justify-end gap-2 border-t px-6 py-4 bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Save Changes" : "Create Project"}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
