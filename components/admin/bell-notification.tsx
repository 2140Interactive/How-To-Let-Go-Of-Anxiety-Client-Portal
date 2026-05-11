"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, MessageCircle, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  projectId: string
  clientName: string
  projectName: string
  preview: string
  createdAt: string
}

interface UnreadData {
  unreadCount: number
  messages: Message[]
}

export function BellNotification() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<UnreadData | null>(null)
  const [loading, setLoading] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/unread-count")
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (err) {
      console.error("Failed to fetch unread count:", err)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Poll every 30 seconds
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [fetchUnreadCount])

  // Refetch on window focus
  useEffect(() => {
    const handleFocus = () => fetchUnreadCount()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [fetchUnreadCount])

  const handleMarkAllRead = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/notifications/mark-all-read", {
        method: "POST",
      })
      if (res.ok) {
        setData({ unreadCount: 0, messages: [] })
        setOpen(false)
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleMessageClick = (message: Message) => {
    router.push(`/admin/project/${message.projectId}?tab=messages`)
    setOpen(false)
  }

  const unreadCount = data?.unreadCount || 0
  const hasUnread = unreadCount > 0

  return (
    <div className="relative">
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

        {/* Badge */}
        {hasUnread && (
          <div className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-16px)] rounded-xl border border-border bg-white shadow-lg">
            {/* Header */}
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                {unreadCount === 0 ? "No new messages" : `${unreadCount} new message${unreadCount !== 1 ? "s" : ""}`}
              </h3>
            </div>

            {/* Messages List */}
            <div className="max-h-96 overflow-y-auto">
              {data?.messages && data.messages.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {data.messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      className="flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#5095A3]/10">
                        <MessageCircle className="h-4 w-4 text-[#5095A3]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">
                          {message.clientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {message.projectName}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {message.preview}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No unread messages
                </div>
              )}
            </div>

            {/* Footer */}
            {unreadCount > 0 && (
              <div className="border-t border-border px-4 py-3">
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs font-medium text-[#5095A3] transition-colors hover:text-[#5095A3]/80 disabled:opacity-50"
                >
                  {loading ? "Marking as read..." : "Mark all as read"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
