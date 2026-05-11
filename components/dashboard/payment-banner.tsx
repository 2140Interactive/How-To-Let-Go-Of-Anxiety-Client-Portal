"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, AlertCircle } from "lucide-react"
import { PaymentElementDialog } from "@/components/payment/payment-element-dialog"

interface PendingPayment {
  id: string
  project_id: string
  amount: number
  status: string
  due_date: string | null
  project_name: string | null
}

interface PaymentBannerProps {
  pendingPayments: PendingPayment[]
}

function getPaymentDueDateStatus(dueDate: string | null) {
  if (!dueDate) return null
  const [year, month, day] = dueDate.split("T")[0].split("-").map(Number)
  const due = Date.UTC(year, month - 1, day)
  const now = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  )
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const formatted = `${monthNames[month - 1]} ${day}, ${year}`

  if (diffDays < 0)
    return { label: formatted, isOverdue: true }
  if (diffDays === 0)
    return { label: formatted, isOverdue: false, isDueToday: true }
  return { label: formatted, isOverdue: false, isDueToday: false }
}

export function PaymentBanner({ pendingPayments }: PaymentBannerProps) {
  const router = useRouter()
  const [payingPayment, setPayingPayment] = useState<PendingPayment | null>(null)
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())

  // Filter out any payments we just paid locally
  const activePendingPayments = pendingPayments.filter(p => !paidIds.has(p.id))

  if (activePendingPayments.length === 0) return null

  const handlePaymentSuccess = (paymentId: string) => {
    setPaidIds(prev => new Set([...prev, paymentId]))
    setPayingPayment(null)
    setTimeout(() => router.refresh(), 100)
  }

  // Calculate total pending amount
  const totalPending = activePendingPayments.reduce((sum, p) => sum + p.amount, 0)

  // Get the most urgent payment (earliest due date)
  const urgentPayment = activePendingPayments.sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.split('T')[0].localeCompare(b.due_date.split('T')[0])
  })[0]

  const urgentStatus = urgentPayment.due_date ? getPaymentDueDateStatus(urgentPayment.due_date) : null
  const hasOverdue = activePendingPayments.some(p => {
    if (!p.due_date) return false
    const status = getPaymentDueDateStatus(p.due_date)
    return status?.isOverdue
  })

  return (
    <>
      <div
        className={`rounded-xl border p-4 ${
          hasOverdue
            ? "border-red-200 bg-red-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-full p-2 ${
                hasOverdue ? "bg-red-100" : "bg-amber-100"
              }`}
            >
              {hasOverdue ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CreditCard className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  hasOverdue ? "text-red-900" : "text-amber-900"
                }`}
              >
                {activePendingPayments.length === 1
                  ? `Payment Due${hasOverdue ? " - Overdue" : ""}`
                  : `${activePendingPayments.length} Payments Due`}
              </h3>
              <p
                className={`text-sm ${
                  hasOverdue ? "text-red-700" : "text-amber-700"
                }`}
              >
                {activePendingPayments.length === 1 ? (
                  <>
                    ${urgentPayment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    {urgentStatus && ` — ${urgentStatus.label}`}
                    {urgentPayment.project_name && (
                      <span className="hidden sm:inline"> for {urgentPayment.project_name}</span>
                    )}
                  </>
                ) : (
                  <>Total: ${totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}</>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPayingPayment(urgentPayment)}
            className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors ${
              hasOverdue
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Pay Now
          </button>
        </div>
      </div>

      {payingPayment && (
        <PaymentElementDialog
          projectId={payingPayment.project_id}
          paymentId={payingPayment.id}
          amount={payingPayment.amount}
          description={payingPayment.project_name ? `Payment for ${payingPayment.project_name}` : "Payment"}
          onClose={() => setPayingPayment(null)}
          onSuccess={() => handlePaymentSuccess(payingPayment.id)}
        />
      )}
    </>
  )
}
