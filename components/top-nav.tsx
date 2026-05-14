"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HelpCircle } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { ClientBellNotification } from "@/components/client/bell-notification"
import { useTour } from "@/components/tour/tour-provider"
import { cn } from "@/lib/utils"

interface TopNavProps {
  initials?: string
  photoUrl?: string | null
  hasMonitoringProjects?: boolean
}

export function TopNav({
  initials = "?",
  photoUrl,
  hasMonitoringProjects = false,
}: TopNavProps) {
  const pathname = usePathname()
  const { startTour, isTourActive } = useTour()

  const navLinks = [
    ...(hasMonitoringProjects
      ? [{ href: "/monitoring", label: "Live Systems" }]
      : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--awyc-primary)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 md:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="relative flex h-16 w-[280px] shrink-0 items-center">
          <Image
            src="/images/How_to_Let_Go_of_Anxiety_Logo.png"
            alt="How To Let Go Of Anxiety"
            fill
            className="object-contain object-left"
            sizes="280px"
            priority
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white",
                  isActive && "text-white"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side - Tour Help, Notifications and User Menu */}
        {/* Tour Help Icon - hidden on mobile, hidden while tour is active */}
        {!isTourActive && (
          <button
            onClick={startTour}
            className="hidden md:flex items-center justify-center text-white/70 transition-colors hover:text-white focus:outline-none"
            aria-label="Start guided tour"
            title="Take a tour"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        )}
        {/* Bell Notification - hidden on mobile */}
        <div className="hidden md:block">
          <ClientBellNotification />
        </div>
        {/* User Menu - hidden on mobile */}
        <div className="hidden md:block">
          <UserMenu initials={initials} photoUrl={photoUrl} settingsHref="/settings" />
        </div>
      </div>
    </header>
  )
}
