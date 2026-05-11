"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { formatRelativeTime, formatStatus } from "@/lib/utils/format"
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
  created_at: string
  projects: ActivityProject | null
}

interface TeamActivityLogProps {
  activities: Activity[]
}

function formatStatusText(text: string): string {
  return text.replace(/\b(on_hold|in_progress|not_started|completed|upcoming|blocked|revision|cancelled|active|new|pending|paid|overdue|failed|on_track|behind_schedule|at_risk)\b/g,
    (match) => formatStatus(match)
  )
}

const DEFAULT_VISIBLE = 3

export function TeamActivityLog({ activities }: TeamActivityLogProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const hasMore = activities.length > DEFAULT_VISIBLE
  const visibleActivities = expanded ? activities : activities.slice(0, DEFAULT_VISIBLE)

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-full items-center justify-between px-4 text-left md:px-6"
      >
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Activity Log
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 py-4 md:px-6">
          {activities.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No recent team activity.
            </p>
          ) : (
            <div className="flex flex-col">
              {visibleActivities.map((activity, index) => {
                const projectName = activity.projects?.name
                const client = activity.projects?.clients
                const clientName = client ? `${client.first_name} ${client.last_name}` : null
                // Parse title to extract admin name if present (format: "AdminName: description")
                const colonIndex = activity.title.indexOf(": ")
                const hasAdminPrefix = colonIndex > 0 && colonIndex < 30
                const extractedName = hasAdminPrefix ? activity.title.slice(0, colonIndex) : null
                const adminName = extractedName && extractedName.toLowerCase() !== "null" ? extractedName : null
                const description = hasAdminPrefix ? activity.title.slice(colonIndex + 2) : activity.title

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-start justify-between gap-3 py-2 px-2 rounded",
                      index % 2 === 0 && "bg-muted/30"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        {clientName && projectName ? (
                          <>
                            <span className="font-semibold">{clientName}</span> / <span className="font-semibold">{projectName}</span>: <span className="italic">{description}</span>
                          </>
                        ) : projectName ? (
                          <>
                            <span className="font-semibold">{projectName}</span>: <span className="italic">{description}</span>
                          </>
                        ) : (
                          description
                        )}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {formatStatusText(activity.description)}
                        </p>
                      )}
                      {adminName && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Updated by {adminName}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 pt-0.5 text-xs text-muted-foreground/70">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
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
      )}
    </div>
  )
}
