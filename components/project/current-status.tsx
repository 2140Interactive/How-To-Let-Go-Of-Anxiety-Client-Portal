interface CurrentStatusProps {
  milestoneName: string
  statusNote?: string | null
  updatedAt?: string | null
}

export function CurrentStatus({ milestoneName, statusNote }: CurrentStatusProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {"What's Happening Now"}
      </h2>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-foreground">
          Current Phase: {milestoneName}
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          {statusNote ||
            "Work is in progress on this phase. Check the activity feed below for recent updates."}
        </p>
      </div>
    </div>
  )
}
