// Maps raw database enum values to human-readable labels.
// Used everywhere a status is displayed to users (activity logs, badges, notifications, emails).
const PROJECT_STATUS_LABELS: Record<string, string> = {
  new: "New",
  active: "Active",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  completed: "Completed",
}

const MILESTONE_STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
  revision: "Under Revision",
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  failed: "Failed",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  check: "Check",
  cash: "Cash",
  other: "Other",
}

const HEALTH_STATUS_LABELS: Record<string, string> = {
  on_track: "On Track",
  behind_schedule: "Behind Schedule",
  at_risk: "At Risk",
}

/**
 * Formats a raw database status enum value into a human-readable label.
 * Covers project, milestone, payment, payment method, and health statuses.
 * Falls back to title-casing the raw value with underscores replaced by spaces.
 */
export function formatStatus(raw: string | null | undefined): string {
  if (!raw) return ""
  const lookup =
    PROJECT_STATUS_LABELS[raw] ??
    MILESTONE_STATUS_LABELS[raw] ??
    PAYMENT_STATUS_LABELS[raw] ??
    PAYMENT_METHOD_LABELS[raw] ??
    HEALTH_STATUS_LABELS[raw]
  if (lookup) return lookup
  // Fallback: replace underscores with spaces and title-case each word
  return raw
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours === 1) return "1 hour ago"
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  const weeks = Math.floor(diffDays / 7)
  if (diffDays < 30) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  // Parse date parts directly to avoid timezone shifts
  const [year, month, day] = dateString.split("T")[0].split("-").map(Number)
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]
  return `${monthNames[month - 1]} ${day}, ${year}`
}
