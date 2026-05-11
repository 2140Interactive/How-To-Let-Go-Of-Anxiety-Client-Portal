"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PaymentElementDialog } from "@/components/payment/payment-element-dialog"
import { CreditCard } from "lucide-react"

// Format date using UTC logic to match task due dates
function formatPaymentDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number)
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${monthNames[month - 1]} ${day}, ${year}`
}

interface PaymentSectionProps {
  projectId: string
  paymentId: string
  dueAmount: number
  dueDate?: string | null
  amountPaid: number
  total: number
}

export function PaymentSection({
  projectId,
  paymentId,
  dueAmount,
  dueDate,
  amountPaid,
  total,
}: PaymentSectionProps) {
  const router = useRouter()
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const percentage = total > 0 ? Math.round((amountPaid / total) * 100) : 0

  if (dueAmount <= 0) return null

  return (
    <>
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <CreditCard className="h-5 w-5" />
            Outstanding Payment
          </h3>
          <p className="text-sm text-muted-foreground">
            {dueDate
              ? `Due by ${formatPaymentDate(dueDate)}`
              : "No due date set"}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-foreground">${dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <button
              onClick={() => setShowPaymentDialog(true)}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600"
            >
              <CreditCard className="h-4 w-4" />
              Pay Now
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Project Total</span>
              <span>{percentage}% Paid</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              ${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} of ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} paid
            </p>
          </div>
        </div>
      </section>

      {showPaymentDialog && (
        <PaymentElementDialog
          projectId={projectId}
          paymentId={paymentId}
          amount={dueAmount}
          description="Payment for project"
          onClose={() => setShowPaymentDialog(false)}
          onSuccess={() => {
            setShowPaymentDialog(false)
            setTimeout(() => router.refresh(), 100)
          }}
        />
      )}
    </>
  )
}
