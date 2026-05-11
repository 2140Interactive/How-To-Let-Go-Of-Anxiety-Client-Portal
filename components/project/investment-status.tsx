import { CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

interface InvestmentStatusProps {
  totalValue: number
  totalPaid: number
  remainingBalance: number
  nextPaymentAmount: number | null
  nextPaymentDate: string | null
  paymentStatus: "current" | "due_soon" | "overdue" | "fully_paid"
}

function StatusIcon({ status }: { status: InvestmentStatusProps["paymentStatus"] }) {
  switch (status) {
    case "current":
    case "fully_paid":
      return <CheckCircle2 className="h-5 w-5 text-[var(--awyc-teal-success)]" />
    case "due_soon":
      return <Clock className="h-5 w-5 text-amber-500" />
    case "overdue":
      return <AlertCircle className="h-5 w-5 text-red-500" />
  }
}

export function InvestmentStatus({
  totalValue,
  totalPaid,
  remainingBalance,
  nextPaymentAmount,
  nextPaymentDate,
  paymentStatus,
}: InvestmentStatusProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your Investment
        </h2>
        <StatusIcon status={paymentStatus} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(totalValue)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Paid</span>
          <span className="text-lg font-semibold text-[var(--awyc-teal-success)]">
            {formatCurrency(totalPaid)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Remaining</span>
          {remainingBalance <= 0 ? (
            <span className="flex items-center gap-1.5 text-lg font-semibold text-[var(--awyc-teal-success)]">
              {formatCurrency(0)}
              <span className="rounded-full bg-[var(--awyc-teal-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--awyc-teal-success)]">
                Fully Paid
              </span>
            </span>
          ) : (
            <span className="text-lg font-semibold text-[var(--awyc-primary)]">
              {formatCurrency(remainingBalance)}
            </span>
          )}
        </div>
      </div>

      {nextPaymentAmount && nextPaymentDate && remainingBalance > 0 && (
        <div
          className={cn(
            "mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
            paymentStatus === "overdue"
              ? "bg-red-50 text-red-700"
              : paymentStatus === "due_soon"
                ? "bg-amber-50 text-amber-700"
                : "bg-muted text-muted-foreground"
          )}
        >
          <span>
            Next payment: <span className="font-medium">{formatCurrency(nextPaymentAmount)}</span>{" "}
            due{" "}
            <span className={cn("font-medium", paymentStatus === "overdue" && "text-red-700")}>
              {formatDate(nextPaymentDate)}
            </span>
          </span>
          {paymentStatus === "overdue" && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Overdue
            </span>
          )}
        </div>
      )}
    </div>
  )
}
