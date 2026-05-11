import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatStatus } from "@/lib/utils/format"

interface ProjectCardProps {
  id: string
  name: string
  status: string
  progressPercentage: number
  currentMilestoneName: string
  estimatedEndDate: string | null
  showClientSuffix?: boolean
}

function getStatusBadge(status: string) {
  switch (status) {
    case "new":
      return {
        label: "New",
        className: "bg-[var(--awyc-primary-light)]/10 text-[var(--awyc-primary-light)]",
      }
    case "active":
      return {
        label: "Active",
        className: "bg-[var(--awyc-teal-success)]/10 text-[var(--awyc-teal-success)]",
      }
    case "complete":
      return {
        label: "Complete",
        className: "bg-muted text-muted-foreground",
      }
    default:
      return {
        label: formatStatus(status),
        className: "bg-muted text-muted-foreground",
      }
  }
}

export function ProjectCard({
  id,
  name,
  status,
  progressPercentage,
  currentMilestoneName,
  estimatedEndDate,
  showClientSuffix = false,
}: ProjectCardProps) {
  const badge = getStatusBadge(status)

  // Strip " - Client Name" suffix on client-facing views
  const displayName = showClientSuffix ? name : name.replace(/ - [^-]+$/, "")

  const formattedDate = estimatedEndDate
    ? new Date(estimatedEndDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <div data-tour="project-card" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground leading-tight text-balance">
          {displayName}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">
            {progressPercentage}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--awyc-teal-success)] transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Current milestone */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Current Phase
        </span>
        <span className="text-sm font-medium text-foreground">
          {currentMilestoneName}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {formattedDate && (
          <span className="text-xs text-muted-foreground">
            Est. completion: {formattedDate}
          </span>
        )}
        <Link
          href={`/project/${id}`}
          className="ml-auto flex items-center gap-1 text-sm font-medium text-[var(--awyc-primary)] transition-colors hover:text-[var(--awyc-primary-dark)]"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
