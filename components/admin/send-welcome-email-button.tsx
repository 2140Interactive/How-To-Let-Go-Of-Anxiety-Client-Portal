"use client"

import { useState } from "react"
import { Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SendWelcomeEmailButtonProps {
  projectId: string
  welcomeEmailSentAt: string | null
}

export function SendWelcomeEmailButton({
  projectId,
  welcomeEmailSentAt,
}: SendWelcomeEmailButtonProps) {
  const [sending, setSending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const isFirstSend = !welcomeEmailSentAt
  const buttonLabel = isFirstSend ? "Send Welcome Email" : "Resend Welcome Email"
  const buttonClass = isFirstSend
    ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "border border-border text-foreground hover:bg-muted"

  async function handleSend() {
    setSending(true)
    try {
      const res = await fetch("/api/admin/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to send email")
      }

      toast.success("Welcome email sent successfully")
      setShowConfirm(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Send welcome email?</span>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      disabled={sending}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50 ${buttonClass}`}
    >
      <Mail className="h-4 w-4" />
      {buttonLabel}
    </button>
  )
}
