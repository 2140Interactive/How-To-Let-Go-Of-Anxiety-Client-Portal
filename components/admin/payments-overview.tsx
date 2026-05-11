"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils/format"

interface Payment {
  id: string
  amount: number
  status: string
  due_date: string | null
  paid_at: string | null
  project_id: string
  projects: {
    name: string
    id: string
    clients: {
      first_name: string
      last_name: string
    }
  }
}

interface PaymentsOverviewProps {
  payments: Payment[]
}

type FilterMode = "outstanding" | "all"

const statusBadge: Record<string, { label: string; className: string }> = {
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
}

function sortPayments(payments: Payment[]): Payment[] {
  const priorityOrder: Record<string, number> = { overdue: 0, pending: 1, failed: 2, paid: 3 }
  return [...payments].sort((a, b) => {
    // Pending/overdue first, then paid
    const aPriority = priorityOrder[a.status] ?? 2
    const bPriority = priorityOrder[b.status] ?? 2
    if (aPriority !== bPriority) return aPriority - bPriority
    // Within the same status group, sort by due date descending
    if (a.due_date && b.due_date) {
      return new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
    }
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1
    return 0
  })
}

export function PaymentsOverview({ payments }: PaymentsOverviewProps) {
  const [filter, setFilter] = useState<FilterMode>("outstanding")

  const filtered =
    filter === "outstanding"
      ? payments.filter((p) => p.status === "pending" || p.status === "overdue")
      : payments

  const sorted = sortPayments(filtered)

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Payments Overview
        </h2>
        <div className="flex gap-1 rounded-full bg-muted p-0.5">
          {(["outstanding", "all"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === mode
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode === "outstanding" ? "Outstanding" : "All"}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {filter === "outstanding"
            ? "All payments current. No outstanding invoices."
            : "No payment records found."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((payment) => {
            const clientName = `${payment.projects.clients.first_name} ${payment.projects.clients.last_name}`
            const isOverdue =
              payment.status === "overdue" ||
              (payment.status !== "paid" && payment.due_date && new Date(payment.due_date) < new Date())
            const badge = isOverdue
              ? statusBadge.overdue
              : statusBadge[payment.status] || statusBadge.pending

            return (
              <Link
                key={payment.id}
                href={`/admin/project/${payment.project_id}?tab=payments`}
                className="group flex min-w-0 items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-[var(--awyc-primary)]">
                    {clientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.projects.name}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-bold text-foreground">
                  {formatCurrency(Number(payment.amount))}
                </span>

                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    badge.className
                  )}
                >
                  {badge.label}
                </span>

                {payment.due_date && (
                  <span
                    className={cn(
                      "shrink-0 text-xs",
                      isOverdue ? "font-medium text-red-600" : "text-muted-foreground"
                    )}
                  >
                    {formatDate(payment.due_date)}
                  </span>
                )}

                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
