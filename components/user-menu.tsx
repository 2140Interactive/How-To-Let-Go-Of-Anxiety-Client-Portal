"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Settings, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserMenuProps {
  initials?: string
  photoUrl?: string | null
  settingsHref?: string
}

export function UserMenu({ initials = "?", photoUrl, settingsHref = "/settings" }: UserMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/30"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt="Your avatar"
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-popover p-1 shadow-lg"
          role="menu"
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              router.push(settingsHref)
            }}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent"
            role="menuitem"
            onClick={async () => {
              setOpen(false)
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push("/login")
            }}
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
