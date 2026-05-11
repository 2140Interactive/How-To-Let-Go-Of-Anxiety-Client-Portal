"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { PaymentElementDialog } from "@/components/payment/payment-element-dialog"

interface Payment {
  id: string
  amount: number
  status: "paid" | "pending" | "overdue" | "failed"
  due_date: string | null
  paid_at: string | null
  description: string | null
}

interface InvoicesPaymentsProps {
  payments: Payment[]
  projectId: string
  investment?: {
    total_value: number
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014"
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number)
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${monthNames[month - 1]} ${day}, ${year}`
}

const statusConfig: Record<Payment["status"], { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Pending", className: "bg-gray-100 text-gray-600" },
  overdue: { label: "Overdue", className: "bg-red-50 text-red-700" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700" },
}

export function InvoicesPayments({ payments, projectId, investment }: InvoicesPaymentsProps) {
  const router = useRouter()
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null)
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())

  // Calculate financial metrics
  const contractValue = investment?.total_value || 0
  const totalBilled = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const balanceDue = totalBilled - totalPaid
  const additionalBilled = totalBilled > contractValue

  const handlePaymentSuccess = (paymentId: string) => {
    setPaidIds(prev => new Set([...prev, paymentId]))
    setPayingPayment(null)
    setTimeout(() => router.refresh(), 100)
  }

  const getDisplayStatus = (payment: Payment) => {
    if (paidIds.has(payment.id)) return "paid"
    return payment.status
  }

  const sortedPayments = [...payments].sort((a, b) => {
    const dateA = a.due_date ? a.due_date.split('T')[0] : ''
    const dateB = b.due_date ? b.due_date.split('T')[0] : ''
    return dateB.localeCompare(dateA) // Descending order
  })

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Payment Activity
        </h2>
        <p className="py-4 text-center text-sm text-muted-foreground">
          No payment records yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Payment Activity
      </h2>

      {/* Summary cards - 4 columns */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border/50 bg-background p-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">Contract Value</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(contractValue)}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background p-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">Total Billed</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(totalBilled)}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background p-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background p-3 text-center">
          <p className="text-xs font-medium text-muted-foreground">Balance Due</p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(balanceDue)}
          </p>
        </div>
      </div>

      {/* Note if additional services billed */}
      {additionalBilled && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-700">
            Additional services billed beyond original contract ({formatCurrency(totalBilled - contractValue)})
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sortedPayments.map((payment) => {
          const displayStatus = getDisplayStatus(payment)
          const status = statusConfig[displayStatus]
          const canPay = displayStatus === "pending" || displayStatus === "overdue"
          return (
            <div
              key={payment.id}
              className="flex flex-col gap-2 rounded-lg border border-border px-3 py-3"
            >
              {/* Mobile: stacked layout, Desktop: row layout */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {payment.description || "Payment"}
                  </span>
                  <span
                    className={cn(
                      "inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      status.className
                    )}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatCurrency(Number(payment.amount))}
                  </span>
                  {canPay && (
                    <button
                      type="button"
                      onClick={() => setPayingPayment(payment)}
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-medium text-white transition-colors hover:bg-amber-600"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>Due: {formatDate(payment.due_date)}</span>
                {(payment.paid_at || paidIds.has(payment.id)) && (
                  <span>Paid: {paidIds.has(payment.id) ? "Just now" : formatDate(payment.paid_at)}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {payingPayment && (
        <PaymentElementDialog
          projectId={projectId}
          paymentId={payingPayment.id}
          amount={Number(payingPayment.amount)}
          description={payingPayment.description || "Payment"}
          onClose={() => setPayingPayment(null)}
          onSuccess={() => handlePaymentSuccess(payingPayment.id)}
        />
      )}
    </div>
  )
}
