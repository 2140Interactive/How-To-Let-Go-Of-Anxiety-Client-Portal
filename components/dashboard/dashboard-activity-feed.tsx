"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  FileText,
  DollarSign,
  PlusCircle,
  MessageSquare,
  PlayCircle,
} from "lucide-react"
import { formatRelativeTime, formatStatus } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

function getActivityHref(type: string, projectId: string): string | null {
  if (type === "document_uploaded") return `/project/${projectId}#files`
  if (type === "payment_received") return `/project/${projectId}#payments`
  return null
}

interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  created_at: string
  project_id: string
  project_name: string | null
}

interface DashboardActivityFeedProps {
  activities: Activity[]
}

const typeConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  milestone_completed: { icon: CheckCircle2, color: "text-emerald-500" },
  milestone_started: { icon: PlayCircle, color: "text-blue-500" },
  payment_received: { icon: DollarSign, color: "text-amber-500" },
  document_uploaded: { icon: FileText, color: "text-violet-500" },
  task_created: { icon: PlusCircle, color: "text-teal-500" },
  message: { icon: MessageSquare, color: "text-sky-500" },
}

const DEFAULT_VISIBLE = 3

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(startOfWeek.getDate() - today.getDay())

  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (activityDate.getTime() >= today.getTime()) return "Today"
  if (activityDate.getTime() >= yesterday.getTime()) return "Yesterday"
  if (activityDate.getTime() >= startOfWeek.getTime()) return "Earlier This Week"
  return "Older"
}

function groupActivities(activities: Activity[]): { label: string; items: Activity[] }[] {
  const order = ["Today", "Yesterday", "Earlier This Week", "Older"]
  const groups: Record<string, Activity[]> = {}

  for (const activity of activities) {
    const group = getDateGroup(activity.created_at)
    if (!groups[group]) groups[group] = []
    groups[group].push(activity)
  }

  return order
    .filter((label) => groups[label]?.length > 0)
    .map((label) => ({ label, items: groups[label] }))
}

export function DashboardActivityFeed({ activities }: DashboardActivityFeedProps) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = activities.length > DEFAULT_VISIBLE
  const visibleActivities = expanded ? activities : activities.slice(0, DEFAULT_VISIBLE)
  const groups = groupActivities(visibleActivities)

  if (activities.length === 0) {
    return (
      <div data-tour="recent-activity" className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </h3>
        <p className="text-sm text-muted-foreground">No recent activity to show.</p>
      </div>
    )
  }

  return (
    <div data-tour="recent-activity" className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recent Activity
      </h3>
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-medium text-muted-foreground/70">{group.label}</p>
            <div className="flex flex-col gap-0">
              {group.items.map((activity, index) => {
                const config = typeConfig[activity.type] || typeConfig.message
                const Icon = config.icon
                const isLast = index === group.items.length - 1

                // Extract admin name from title (e.g., "Andreas Marcel: Project created" -> adminName = "Andreas Marcel")
                const colonIndex = activity.title.indexOf(": ")
                const hasAdminPrefix = colonIndex > 0 && colonIndex < 30
                const extractedName = hasAdminPrefix ? activity.title.slice(0, colonIndex) : null
                const adminName = extractedName && extractedName.toLowerCase() !== "null" ? extractedName : null
                const description = hasAdminPrefix ? activity.title.slice(colonIndex + 2) : activity.title

                const href = getActivityHref(activity.type, activity.project_id)
                const content = (
                  <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
                    <p className="text-xs font-medium text-muted-foreground">
                      {activity.project_name}
                    </p>
                    <p className="text-sm text-foreground">
                      <span className="italic">{description}</span>
                    </p>
                    {activity.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activity.description.replace(/\b(on_hold|in_progress|not_started|completed|upcoming|blocked|revision|cancelled|active|new|pending|paid|overdue|failed|on_track|behind_schedule|at_risk)\b/g, (m) => formatStatus(m))}
                      </p>
                    )}
                    {adminName && (
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        Updated by {adminName}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                )

                return (
                  <div key={activity.id} className="flex gap-3">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/50",
                          config.color
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-border" />}
                    </div>
                    {/* Content */}
                    {href ? (
                      <Link href={href} className={cn("flex-1 pb-4", isLast && "pb-0")}>
                        <p className="text-xs font-medium text-muted-foreground">
                          {activity.project_name}
                        </p>
                        <p className="text-sm text-foreground">
                          <span className="italic">{description}</span>
                        </p>
                        {activity.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {activity.description.replace(/\b(on_hold|in_progress|not_started|completed|upcoming|blocked|revision|cancelled|active|new|pending|paid|overdue|failed|on_track|behind_schedule|at_risk)\b/g, (m) => formatStatus(m))}
                          </p>
                        )}
                        {adminName && (
                          <p className="mt-0.5 text-xs text-muted-foreground/70">
                            Updated by {adminName}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground/60">
                          {formatRelativeTime(activity.created_at)}
                        </p>
                      </Link>
                    ) : (
                      content
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Show Less" : `View All Activity (${activities.length})`}
        </button>
      )}
    </div>
  )
}
