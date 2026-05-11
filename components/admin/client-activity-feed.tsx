import Link from "next/link"
import {
  CheckCircle2,
  FileText,
  ThumbsUp,
  DollarSign,
  MessageSquare,
  ArrowRight,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

interface ActivityProject {
  name: string
  id?: string
  clients: {
    first_name: string
    last_name: string
    company_name: string
  } | null
}

interface Activity {
  id: string
  project_id: string
  type: string
  title: string
  description: string | null
  created_at: string
  projects: ActivityProject | null
}

function getTabForType(type: string): string {
  switch (type) {
    case "document_uploaded":
      return "files"
    case "payment_received":
      return "payments"
    case "task_created":
    case "task_completed":
    case "approval_given":
      return "tasks"
    case "milestone_completed":
    case "milestone_started":
      return "milestones"
    default:
      return "activity"
  }
}

interface ClientActivityFeedProps {
  activities: Activity[]
}

const typeConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  milestone_completed: { icon: CheckCircle2, color: "text-[var(--awyc-teal-success)]" },
  document_uploaded: { icon: FileText, color: "text-[var(--awyc-primary)]" },
  approval_given: { icon: ThumbsUp, color: "text-[var(--awyc-teal-success)]" },
  payment_received: { icon: DollarSign, color: "text-[var(--awyc-teal-success)]" },
  message: { icon: MessageSquare, color: "text-[var(--awyc-primary)]" },
}

function isWithin48Hours(dateStr: string): boolean {
  const created = new Date(dateStr)
  const now = new Date()
  return now.getTime() - created.getTime() < 48 * 60 * 60 * 1000
}

export function ClientActivityFeed({ activities }: ClientActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-border border-l-2 border-l-[var(--awyc-teal-success)] bg-card px-4 py-6 shadow-sm md:px-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {"What's New from Clients"}
        </h2>
        <p className="flex flex-1 items-center justify-center py-6 text-center text-sm text-muted-foreground">
          {"No new client activity. You'll see uploads, approvals, and payments here."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border border-l-2 border-l-[var(--awyc-teal-success)] bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {"What's New from Clients"}
      </h2>
      <div className="flex flex-col gap-4">
        {activities.map((activity) => {
          const config = typeConfig[activity.type] || typeConfig.message
          const Icon = config.icon
          const isNew = isWithin48Hours(activity.created_at)
          const projectName = activity.projects?.name
          const clientName = activity.projects?.clients
            ? `${activity.projects.clients.first_name} ${activity.projects.clients.last_name}`
            : null

          const tab = getTabForType(activity.type)
          const href = `/admin/project/${activity.project_id}?tab=${tab}`

          return (
            <Link
              key={activity.id}
              href={href}
              className="group -mx-3 flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
            >
              {/* Unread dot or spacer */}
              <div className="flex h-5 w-3 shrink-0 items-center justify-center">
                {isNew && (
                  <span className="h-2 w-2 rounded-full bg-[var(--awyc-teal-success)]" />
                )}
              </div>

              {/* Icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                {(projectName || clientName) && (
                  <p className="text-xs text-muted-foreground">
                    {[projectName, clientName ? `(${clientName})` : null]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.created_at)}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
