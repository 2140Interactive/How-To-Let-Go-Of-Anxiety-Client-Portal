"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Activity, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  hasMonitoringProjects?: boolean
}

export function MobileNav({
  hasMonitoringProjects = false,
}: MobileNavProps) {
  const pathname = usePathname()

  const tabs = [
    { href: "/dashboard", label: "Home", icon: Home },
    ...(hasMonitoringProjects
      ? [{ href: "/monitoring", label: "Monitor", icon: Activity }]
      : []),
    { href: "/settings", label: "Profile", icon: User },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          const Icon = tab.icon

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive
                  ? "text-[var(--awyc-primary)] font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
