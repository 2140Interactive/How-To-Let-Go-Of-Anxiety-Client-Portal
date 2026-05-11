"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Send, ChevronUp } from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  project_id: string
  sender_type: "admin" | "client"
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface MessagesTabProps {
  projectId: string
  primaryTeamMemberId: string
}

export function MessagesTab({ projectId, primaryTeamMemberId }: MessagesTabProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const router = useRouter()

  const VISIBLE_COUNT = 5
  const visibleMessages = showAll ? messages : messages.slice(0, VISIBLE_COUNT)
  const hasMore = messages.length > VISIBLE_COUNT

  // Load messages on mount
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/admin/messages/list?projectId=${projectId}`)
        if (!res.ok) throw new Error("Failed to load messages")
        const data = await res.json()
        setMessages(data.messages || [])
      } catch (err) {
        console.error("Error loading messages:", err)
        toast.error("Failed to load messages")
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [projectId])

  // Mark unread client messages as read when tab opens
  useEffect(() => {
    async function markAsRead() {
      try {
        await fetch("/api/admin/messages/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        })
      } catch (err) {
        console.error("Error marking messages as read:", err)
      }
    }

    markAsRead()
  }, [projectId])

  async function handleSendMessage() {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch("/api/admin/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          content: newMessage.trim(),
          adminId: primaryTeamMemberId,
        }),
      })

      if (!res.ok) throw new Error("Failed to send message")

      const data = await res.json()
      setMessages([data.message, ...messages])
      setNewMessage("")
      toast.success("Message sent")
    } catch (err) {
      console.error("Error sending message:", err)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading messages...</div>
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages list */}
      <div id="messages" className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground">No messages yet</div>
        ) : (
          <div className="space-y-4">
            {/* View older / Show recent toggle */}
            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="flex w-full items-center justify-center gap-1 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronUp className={`h-3 w-3 transition-transform ${showAll ? "rotate-180" : ""}`} />
                {showAll
                  ? "Show recent messages only"
                  : `View older messages (${messages.length - VISIBLE_COUNT} more)`}
              </button>
            )}
            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-3 text-sm ${
                  msg.sender_type === "admin"
                    ? "ml-12 bg-blue-50 text-foreground"
                    : "mr-12 bg-muted text-foreground"
                }`}
              >
                <div className="font-semibold text-xs text-muted-foreground mb-1">
                  {msg.sender_type === "admin" ? "You" : "Client"}
                </div>
                <div>{msg.content}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-border p-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="rounded-lg bg-amber-500 px-3 py-2 text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
