"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CreditCard } from "lucide-react"
import { PaymentElementDialog } from "@/components/payment/payment-element-dialog"

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
    return { label: formatted, isDueToday: true, isOverdue: false }
  return { label: formatted, isOverdue: false, isDueToday: false }
}

interface ProjectPaymentAlertBannerProps {
  projectId: string
  paymentId: string
  dueAmount: number
  dueDate?: string | null
}

export function ProjectPaymentAlertBanner({
  projectId,
  paymentId,
  dueAmount,
  dueDate,
}: ProjectPaymentAlertBannerProps) {
  const router = useRouter()
  const [payingPayment, setPayingPayment] = useState(false)

  if (dueAmount <= 0) return null

  const status = dueDate ? getPaymentDueDateStatus(dueDate) : null
  const isOverdue = status?.isOverdue

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(dueAmount)

  return (
    <>
      <div
        className={`rounded-xl border p-4 ${
          isOverdue
            ? "border-red-200 bg-red-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-full p-2 ${
                isOverdue ? "bg-red-100" : "bg-amber-100"
              }`}
            >
              {isOverdue ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CreditCard className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isOverdue ? "text-red-900" : "text-amber-900"
                }`}
              >
                {isOverdue ? "Payment Overdue" : "Payment Due"}
              </h3>
              <p
                className={`text-sm ${
                  isOverdue ? "text-red-700" : "text-amber-700"
                }`}
              >
                {formattedAmount}
                {status && ` — ${status.label}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPayingPayment(true)}
            className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors ${
              isOverdue
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
          projectId={projectId}
          paymentId={paymentId}
          amount={dueAmount}
          description="Project payment"
          onClose={() => setPayingPayment(false)}
          onSuccess={() => {
            setPayingPayment(false)
            setTimeout(() => router.refresh(), 100)
          }}
        />
      )}
    </>
  )
}
