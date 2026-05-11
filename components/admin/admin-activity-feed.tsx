import {
  CheckCircle2,
  FileText,
  ThumbsUp,
  DollarSign,
  PlusCircle,
  MessageSquare,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

interface ActivityProject {
  name: string
  clients: {
    first_name: string
    last_name: string
    company_name: string
  } | null
}

interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  status: string
  created_at: string
  projects: ActivityProject | null
}

interface AdminActivityFeedProps {
  activities: Activity[]
}

const typeConfig: Record<
  string,
  { icon: typeof CheckCircle2; color: string }
> = {
  milestone_completed: { icon: CheckCircle2, color: "text-[var(--awyc-teal-success)]" },
  document_uploaded: { icon: FileText, color: "text-[var(--awyc-primary)]" },
  approval_given: { icon: ThumbsUp, color: "text-[var(--awyc-teal-success)]" },
  payment_received: { icon: DollarSign, color: "text-[var(--awyc-teal-success)]" },
  task_created: { icon: PlusCircle, color: "text-amber-500" },
  message: { icon: MessageSquare, color: "text-[var(--awyc-primary)]" },
}

export function AdminActivityFeed({ activities }: AdminActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Activity (All Projects)
        </h2>
        <p className="py-8 text-center text-sm text-muted-foreground">
          No recent activity across any projects.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Recent Activity (All Projects)
      </h2>
      <div className="relative flex flex-col gap-0">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-[#d4dde0]" />

        {activities.map((activity, index) => {
          const config = typeConfig[activity.type] || typeConfig.message
          const Icon = config.icon
          const isLast = index === activities.length - 1
          const projectName = activity.projects?.name
          const clientName = activity.projects?.clients
            ? `${activity.projects.clients.first_name} ${activity.projects.clients.last_name}`
            : null

          return (
            <div
              key={activity.id}
              className={cn("relative flex gap-4 pl-0", !isLast && "pb-5")}
            >
              {/* Icon circle */}
              <div className="relative z-10 flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full border border-border bg-card">
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-0.5 pt-0.5">
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
