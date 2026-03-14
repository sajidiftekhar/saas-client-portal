"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateOrganizationName } from "@/app/(dashboard)/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Organization } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
});
type Values = z.infer<typeof schema>;

export function OrgSettingsForm({
  organization,
}: {
  organization: Organization | null;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: organization?.name ?? "" },
  });

  async function onSubmit(values: Values) {
    if (!organization) return;
    setIsLoading(true);
    const result = await updateOrganizationName(organization.id, values.name);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Organization name updated");
    }
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Organization name</Label>
        <Input id="org-name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
