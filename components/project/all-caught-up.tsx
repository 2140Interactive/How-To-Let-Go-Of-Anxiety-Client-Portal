import { CheckCircle2 } from "lucide-react"

interface AllCaughtUpProps {
  currentPhaseName: string
  statusNote?: string | null
  hasStarted?: boolean
}

export function AllCaughtUp({ currentPhaseName, statusNote, hasStarted = true }: AllCaughtUpProps) {
  const title = hasStarted ? "All Caught Up" : "All Set"
  const message = hasStarted
    ? statusNote
      ? `Nothing needed from you right now. ${statusNote}`
      : `Nothing needed from you right now. We're working on ${currentPhaseName} and will reach out when we need you.`
    : "We're getting everything ready on our end. We'll notify you when there's something to review."

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--awyc-teal-success)]"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--awyc-teal-success)]">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
