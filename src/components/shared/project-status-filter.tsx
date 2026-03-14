"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_CONFIG, type ProjectStatus } from "@/types";

const ALL_STATUSES: Array<{ key: ProjectStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  ...( Object.entries(PROJECT_STATUS_CONFIG) as [
    ProjectStatus,
    (typeof PROJECT_STATUS_CONFIG)[ProjectStatus]
  ][]).map(([key, cfg]) => ({ key, label: cfg.label })),
];

interface ProjectStatusFilterProps {
  currentStatus: string;
}

export function ProjectStatusFilter({ currentStatus }: ProjectStatusFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setStatus = useCallback(
    (status: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (status === "all") {
        params.delete("status");
      } else {
        params.set("status", status);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_STATUSES.map(({ key, label }) => {
        const isActive = currentStatus === key;
        const statusCfg =
          key !== "all" ? PROJECT_STATUS_CONFIG[key] : null;

        return (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
              isActive
                ? key === "all"
                  ? "bg-foreground text-background border-foreground"
                  : cn(statusCfg?.color, "border")
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {key !== "all" && statusCfg && (
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isActive ? statusCfg.dot : "bg-muted-foreground"
                )}
              />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
