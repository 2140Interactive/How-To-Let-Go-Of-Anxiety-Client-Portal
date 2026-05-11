import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  highlight?: boolean
  href?: string
}

export function StatCard({ label, value, highlight = false, href }: StatCardProps) {
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-3xl font-bold",
          highlight && ((typeof value === "number" && value > 0) || (typeof value === "string" && value !== "$0"))
            ? "text-red-600"
            : "text-foreground"
        )}
      >
        {value}
      </p>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-xl border border-border bg-card px-4 py-5 text-center shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-5 text-center shadow-sm">
      {content}
    </div>
  )
}
