"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { key: "milestones", label: "Milestones" },
  { key: "tasks", label: "Tasks" },
  { key: "activity", label: "Activity" },
  { key: "files", label: "Files" },
  { key: "payments", label: "Payments" },
  { key: "messages", label: "Messages" },
  { key: "settings", label: "Settings" },
] as const

export type TabKey = (typeof tabs)[number]["key"]

export function ProjectTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = (searchParams.get("tab") as TabKey) || "milestones"

  function handleTabChange(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="overflow-x-auto border-b border-border">
      <nav className="flex gap-0" aria-label="Project tabs">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleTabChange(key)}
            className={cn(
              "cursor-pointer shrink-0 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === key
                ? "border-b-2 border-amber-500 text-amber-600"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
