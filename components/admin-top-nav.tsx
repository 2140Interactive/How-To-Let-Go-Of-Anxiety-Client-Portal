"use client"

import Image from "next/image"
import Link from "next/link"
import { UserMenu } from "@/components/user-menu"
import { BellNotification } from "@/components/admin/bell-notification"

interface AdminTopNavProps {
  initials?: string
  photoUrl?: string | null
}

export function AdminTopNav({
  initials = "A",
  photoUrl,
}: AdminTopNavProps) {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-[var(--awyc-primary)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 md:px-6">
          {/* Logo */}
          <Link href="/admin" className="relative flex h-16 w-[280px] shrink-0 items-center">
            <Image
              src="/images/How_to_Let_Go_of_Anxiety_Logo_white.png"
              alt="How To Let Go Of Anxiety"
              fill
              className="object-contain object-left"
              sizes="280px"
              priority
            />
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side */}
          {/* Bell Notification - hidden on mobile */}
          <div className="hidden md:block">
            <BellNotification />
          </div>
          {/* User Menu - hidden on mobile */}
          <div className="hidden md:block">
            <UserMenu initials={initials} photoUrl={photoUrl} settingsHref="/admin/settings" />
          </div>
        </div>
      </div>
      {/* Amber accent line to signal admin mode */}
      <div className="h-[2px] w-full bg-[#D97706]" />
    </header>
  )
}
