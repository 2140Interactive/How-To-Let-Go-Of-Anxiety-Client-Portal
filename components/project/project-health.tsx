import { cn } from "@/lib/utils"

interface ProjectHealthProps {
  status: "on_track" | "behind_schedule" | "at_risk"
  daysRemaining: number | null
}

const statusConfig = {
  on_track: {
    label: "On Track",
    dotClass: "bg-[var(--awyc-teal-success)]",
    textClass: "text-[var(--awyc-teal-success)]",
  },
  behind_schedule: {
    label: "Behind Schedule",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600",
  },
  at_risk: {
    label: "At Risk",
    dotClass: "bg-red-500",
    textClass: "text-red-600",
  },
}

export function ProjectHealth({ status, daysRemaining }: ProjectHealthProps) {
  const config = statusConfig[status]

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Project Health
      </h2>

      <div className="flex items-center gap-2">
        <div className={cn("h-2.5 w-2.5 rounded-full", config.dotClass)} />
        <span className={cn("text-sm font-semibold", config.textClass)}>
          {config.label}
        </span>
      </div>

      {daysRemaining !== null && (
        <p
          className={cn(
            "mt-2 text-sm",
            daysRemaining < 0 ? "text-red-600 font-medium" : "text-muted-foreground"
          )}
        >
          {daysRemaining < 0
            ? `Overdue by ${Math.abs(daysRemaining)} days`
            : `${daysRemaining} days until estimated completion`}
        </p>
      )}
    </div>
  )
}
