import { Calendar, Mail } from "lucide-react"

interface TeamContactProps {
  teamMember: {
    name: string
    role: string
    email: string
    phone: string | null
    photo_url: string | null
    scheduling_url: string | null
  }
}

export function TeamContact({ teamMember }: TeamContactProps) {
  const initials = teamMember.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-5 shadow-sm md:px-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Your How To Let Go Of Anxiety Team
      </h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Avatar + Info */}
        <div className="flex items-center gap-3">
          {teamMember.photo_url ? (
            <img
              src={teamMember.photo_url}
              alt={teamMember.name}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--awyc-primary)] text-sm font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">{teamMember.name}</p>
            <p className="text-xs text-muted-foreground">{teamMember.role}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {teamMember.scheduling_url && (
            <a
              href={teamMember.scheduling_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:h-9"
            >
              <Calendar className="h-4 w-4" />
              Schedule Call
            </a>
          )}
          <a
            href={`mailto:${teamMember.email}?subject=Question about my project`}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--awyc-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--awyc-primary-dark)] sm:h-9"
          >
            <Mail className="h-4 w-4" />
            Send Message
          </a>
        </div>
      </div>
    </div>
  )
}
