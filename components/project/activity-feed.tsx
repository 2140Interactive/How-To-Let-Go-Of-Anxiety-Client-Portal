"use client"

import { useState } from "react"
import {
  CheckCircle2,
  FileText,
  ThumbsUp,
  DollarSign,
  PlusCircle,
  MessageSquare,
} from "lucide-react"
import { formatRelativeTime, formatStatus } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  status: string
  created_at: string
  project_name?: string | null
}

interface ActivityFeedProps {
  activities: Activity[]
  showProjectName?: boolean
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



function formatStatusText(text: string): string {
  return text.replace(/\b(on_hold|in_progress|not_started|completed|upcoming|blocked|revision|cancelled|active|new|pending|paid|overdue|failed|on_track|behind_schedule|at_risk)\b/g,
    (match) => formatStatus(match)
  )
}

const DEFAULT_VISIBLE = 3

export function ActivityFeed({ activities, showProjectName }: ActivityFeedProps) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = activities.length > DEFAULT_VISIBLE
  const visibleActivities = expanded ? activities : activities.slice(0, DEFAULT_VISIBLE)

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-border border-l-2 border-l-[var(--awyc-primary)] bg-card px-4 py-6 shadow-sm md:px-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </h2>
        <p className="py-8 text-center text-sm text-muted-foreground">
          No recent activity. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border border-l-2 border-l-[var(--awyc-primary)] bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Recent Activity
      </h2>
      <div className="relative flex flex-col gap-0">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-[#d4dde0]" />

        {visibleActivities.map((activity, index) => {
          const config = typeConfig[activity.type] || typeConfig.message
          const Icon = config.icon
          const isLast = index === visibleActivities.length - 1
          // Parse title to extract admin name if present (format: "AdminName: description")
          const colonIndex = activity.title.indexOf(": ")
          const hasAdminPrefix = colonIndex > 0 && colonIndex < 30
          const extractedName = hasAdminPrefix ? activity.title.slice(0, colonIndex) : null
          const adminName = extractedName && extractedName.toLowerCase() !== "null" ? extractedName : null
          const description = hasAdminPrefix ? activity.title.slice(colonIndex + 2) : activity.title
          const projectName = showProjectName ? activity.project_name : null

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
                <p className="text-sm text-foreground">
                  {projectName ? (
                    <>
                      <span className="font-semibold">{projectName}</span>: <span className="italic">{description}</span>
                    </>
                  ) : (
                    <span className="italic">{description}</span>
                  )}
                </p>
                {activity.description && (
                  <p className="text-sm text-muted-foreground">{formatStatusText(activity.description)}</p>
                )}
                {adminName && (
                  <p className="text-xs text-muted-foreground/70">
                    Updated by {adminName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  {formatRelativeTime(activity.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Show Less" : `View All Activity (${activities.length})`}
        </button>
      )}
    </div>
  )
}
