import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate, formatStatus } from "@/lib/utils/format"

interface Project {
  id: string
  name: string
  status: string
  health_status: string
  estimated_end_date: string | null
  progress_percentage: number
  current_milestone_name: string
}

interface Client {
  id: string
  first_name: string
  last_name: string
  company_name: string
  projects: Project[]
}

interface ClientProjectListProps {
  clients: Client[]
}

const statusBadge: Record<string, { label: string; className: string }> = {
  new: {
    label: "New",
    className: "bg-[var(--awyc-primary)]/10 text-[var(--awyc-primary)]",
  },
  active: {
    label: "Active",
    className: "bg-[var(--awyc-teal-success)]/10 text-[var(--awyc-teal-success)]",
  },
  complete: {
    label: "Complete",
    className: "bg-muted text-muted-foreground",
  },
}

const healthDot: Record<string, string> = {
  on_track: "bg-[var(--awyc-teal-success)]",
  behind_schedule: "bg-amber-500",
  at_risk: "bg-red-500",
}

const healthLabel: Record<string, string> = {
  on_track: "On Track",
  behind_schedule: "Behind",
  at_risk: "At Risk",
}

export function ClientProjectList({ clients }: ClientProjectListProps) {
  // Flatten all projects with their client info
  const allProjects = clients.flatMap((client) =>
    client.projects.map((project) => ({
      ...project,
      clientName: `${client.first_name} ${client.last_name}`,
      companyName: client.company_name,
    }))
  )

  if (allProjects.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Clients & Projects
        </h2>
        <p className="py-8 text-center text-sm text-muted-foreground">
          No clients yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Clients & Projects
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {allProjects.map((project) => {
          const badge = statusBadge[project.status] || { label: formatStatus(project.status), className: "bg-muted text-muted-foreground" }

          return (
            <div
              key={project.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              {/* Client info */}
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-semibold text-foreground">
                  {project.clientName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {project.companyName}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <h4 className="text-lg font-semibold leading-tight text-balance text-foreground">
                  {project.name}
                </h4>
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
                    {project.progress_percentage}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[var(--awyc-teal-success)] transition-all duration-500"
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Current phase */}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Current Phase
                </span>
                <span className="text-sm font-medium text-foreground">
                  {project.current_milestone_name}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                {project.estimated_end_date && (
                  <span className="text-xs text-muted-foreground">
                    Est. completion: {formatDate(project.estimated_end_date)}
                  </span>
                )}
                <Link
                  href={`/admin/project/${project.id}`}
                  className="ml-auto flex items-center gap-1 text-sm font-medium text-[var(--awyc-primary)] transition-colors hover:text-[var(--awyc-primary-dark)]"
                >
                  View Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
