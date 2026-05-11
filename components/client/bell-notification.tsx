"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Bell, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

function getNotificationHref(projectId: string, type: string): string {
  const base = `/project/${projectId}`
  switch (type) {
    case "task":
      return `${base}#action-items`
    case "document":
      return `${base}#files`
    case "payment":
      return `${base}#payments`
    case "message":
      return `${base}#messages`
    case "milestone":
    default:
      return base
  }
}

interface Notification {
  id: string
  title: string
  type: string
  projectName: string
  projectId: string
  createdAt: string
}

interface NotificationResponse {
  unreadCount: number
  notifications: Notification[]
}

export function ClientBellNotification() {
  const [authId, setAuthId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const hasUnread = unreadCount > 0

  async function fetchNotifications() {
    if (!authId) return

    try {
      setLoading(true)
      const res = await fetch(`/api/client/notifications/unread-count?authId=${authId}`)
      if (!res.ok) throw new Error("Failed to fetch notifications")

      const data: NotificationResponse = await res.json()
      setUnreadCount(data.unreadCount)
      setNotifications(data.notifications)
    } catch (err) {
      console.error("Error fetching notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAllRead() {
    if (!authId || notifications.length === 0) return

    try {
      const res = await fetch("/api/client/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authId,
          notificationIds: notifications.map((n) => n.id),
        }),
      })

      if (!res.ok) throw new Error("Failed to mark as read")

      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error("Error marking as read:", err)
    }
  }

  // Get auth ID on mount
  useEffect(() => {
    async function getAuthId() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        setAuthId(user.id)
      }
    }
    getAuthId()
  }, [])

  // Initial fetch and polling
  useEffect(() => {
    if (!authId) return

    fetchNotifications()

    // Poll every 30 seconds
    pollIntervalRef.current = setInterval(fetchNotifications, 30000)

    // Refetch on window focus
    const handleFocus = () => fetchNotifications()
    window.addEventListener("focus", handleFocus)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      window.removeEventListener("focus", handleFocus)
    }
  }, [authId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" data-tour="bell">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center transition-colors",
          hasUnread
            ? "text-white"
            : "text-white/70 hover:text-white"
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 max-h-96 rounded-xl border border-border bg-card shadow-lg overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <button
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-muted-foreground">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-muted-foreground">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <a
                    key={notif.id}
                    href={getNotificationHref(notif.projectId, notif.type)}
                    onClick={async () => {
                      setOpen(false)
                      // Mark this notification as read on click
                      try {
                        await fetch("/api/client/notifications/mark-read", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            authId,
                            notificationIds: [notif.id],
                          }),
                        })
                        setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
                        setUnreadCount((prev) => Math.max(0, prev - 1))
                      } catch (err) {
                        console.error("Error marking notification as read:", err)
                      }
                    }}
                    className="block px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notif.projectName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2 bg-muted/30">
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[var(--awyc-primary)] hover:text-[var(--awyc-primary)]/80 transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
