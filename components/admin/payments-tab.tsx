"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Plus, X, Loader2, CheckCircle2, CreditCard, Banknote, Building2, Pencil } from "lucide-react"
import { formatCurrency, formatDate, formatStatus } from "@/lib/utils/format"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Payment {
  id: string
  amount: number
  status: string
  due_date: string
  paid_at: string | null
  description: string | null
  payment_method: string | null
  reference_note: string | null
}

interface PaymentsTabProps {
  payments: Payment[]
  projectId: string
  investment: {
    total_value: number
    total_paid: number
    remaining_balance: number
  }
}

const statusBadge: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-muted text-muted-foreground",
  overdue: "bg-red-100 text-red-700",
}

const methodIcon: Record<string, typeof CreditCard> = {
  credit_card: CreditCard,
  bank_transfer: Building2,
  check: Banknote,
  cash: Banknote,
}

export function PaymentsTab({ payments, projectId, investment }: PaymentsTabProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)

  // Calculate financial metrics
  const contractValue = investment?.total_value || 0
  const totalBilled = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const balanceDue = totalBilled - totalPaid
  const additionalBilled = totalBilled > contractValue

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards - 4 columns */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Contract Value</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {formatCurrency(contractValue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Total Billed</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {formatCurrency(totalBilled)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
          <p className="mt-1 text-xl font-bold text-[var(--awyc-teal-success)]">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Balance Due</p>
          <p className="mt-1 text-xl font-bold text-foreground">
            {formatCurrency(balanceDue)}
          </p>
        </div>
      </div>

      {/* Note if additional services billed */}
      {additionalBilled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-700">
            Additional services billed beyond original contract ({formatCurrency(totalBilled - contractValue)})
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600"
        >
          <Plus className="h-4 w-4" />
          Add Payment
        </button>
      </div>

      {/* Payment list */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No payments recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((p) => {
              const MethodIcon = p.payment_method ? methodIcon[p.payment_method] : null
              return (
                <div key={p.id} className="px-4 py-3 md:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {p.description || "Payment"}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
                            statusBadge[p.status] || "bg-muted text-foreground"
                          )}
                        >
                          {formatStatus(p.status)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {formatCurrency(Number(p.amount))}
                        </span>
                        <span>Due: {formatDate(p.due_date)}</span>
                        {p.paid_at && <span>Paid: {formatDate(p.paid_at)}</span>}
                        {MethodIcon && (
                          <span className="inline-flex items-center gap-1">
                            <MethodIcon className="h-3 w-3" />
                            {formatStatus(p.payment_method)}
                          </span>
                        )}
                      </div>
                      {p.reference_note && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          {p.reference_note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPayment(p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      {(p.status === "pending" || p.status === "overdue") && (
                        <button
                          type="button"
                          onClick={() => setMarkingPaidId(p.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Payment modal */}
      {showDialog && (
        <AddPaymentDialog
          projectId={projectId}
          onClose={() => setShowDialog(false)}
          onSaved={() => {
            setShowDialog(false)
            router.refresh()
          }}
        />
      )}

      {/* Mark as Paid dialog */}
      {markingPaidId && (
        <MarkAsPaidDialog
          payment={payments.find((p) => p.id === markingPaidId)!}
          projectId={projectId}
          onClose={() => setMarkingPaidId(null)}
          onSaved={() => {
            setMarkingPaidId(null)
            router.refresh()
          }}
        />
      )}

      {/* Edit Payment dialog */}
      {editingPayment && (
        <EditPaymentDialog
          payment={editingPayment}
          projectId={projectId}
          onClose={() => setEditingPayment(null)}
          onSaved={() => {
            setEditingPayment(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

/* ============================================================
   Shared: Currency Input
   ============================================================ */
function CurrencyInput({
  value,
  onChange,
  required,
  min,
  max,
  className,
}: {
  value: string
  onChange: (v: string) => void
  required?: boolean
  min?: number
  max?: number
  className?: string
}) {
  const [focused, setFocused] = useState(false)

  const displayValue = focused
    ? value
    : value && !isNaN(Number(value))
      ? Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
      <input
        type={focused ? "number" : "text"}
        required={required}
        min={min}
        max={max}
        step="0.01"
        value={displayValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-background pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40",
          className
        )}
      />
    </div>
  )
}

/* ============================================================
   Shared: Paid-only fields
   ============================================================ */
function PaidFields({
  isPaid,
  paidAt,
  setPaidAt,
  paymentMethod,
  setPaymentMethod,
  referenceNote,
  setReferenceNote,
}: {
  isPaid: boolean
  paidAt: string
  setPaidAt: (v: string) => void
  paymentMethod: string
  setPaymentMethod: (v: string) => void
  referenceNote: string
  setReferenceNote: (v: string) => void
}) {
  return (
    <div
      className={cn(
        "grid overflow-hidden transition-all duration-300 ease-in-out",
        isPaid ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex flex-col gap-4 pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Paid Date</label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Reference Note</label>
            <input
              type="text"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="e.g. Check #4521 or Stripe pi_xxx"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Add Payment Dialog
   ============================================================ */
function AddPaymentDialog({
  projectId,
  onClose,
  onSaved,
}: {
  projectId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState("pending")
  const [dueDate, setDueDate] = useState("")
  const [paidAt, setPaidAt] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [referenceNote, setReferenceNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) {
      toast.error("Description is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          description: description.trim(),
          amount: Number(amount),
          status,
          dueDate: dueDate ? `${dueDate}T12:00:00` : null,
          paidAt: status === "paid" ? (paidAt || new Date().toISOString()) : null,
          paymentMethod: status === "paid" && paymentMethod ? paymentMethod : null,
          referenceNote: status === "paid" && referenceNote.trim() ? referenceNote.trim() : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Payment added")
      onSaved()
    } catch {
      toast.error("Failed to add payment")
    } finally {
      setSaving(false)
    }
  }

  const isPaid = status === "paid"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Add Payment</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Phase 1 - Discovery & Planning"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount *</label>
              <CurrencyInput value={amount} onChange={setAmount} required min={0} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <PaidFields
            isPaid={isPaid}
            paidAt={paidAt}
            setPaidAt={setPaidAt}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            referenceNote={referenceNote}
            setReferenceNote={setReferenceNote}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ============================================================
   Mark as Paid Dialog (with Amount Received + partial payment)
   ============================================================ */
function MarkAsPaidDialog({
  payment,
  projectId,
  onClose,
  onSaved,
}: {
  payment: Payment
  projectId: string
  onClose: () => void
  onSaved: () => void
}) {
  const invoiceAmount = Number(payment.amount)
  const [amountReceived, setAmountReceived] = useState(invoiceAmount.toFixed(2))
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0])
  const [paymentMethod, setPaymentMethod] = useState("")
  const [referenceNote, setReferenceNote] = useState("")
  const [saving, setSaving] = useState(false)

  const received = Number(amountReceived) || 0
  const remainder = invoiceAmount - received
  const isPartial = received > 0 && received < invoiceAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (received <= 0) {
      toast.error("Amount received must be greater than zero")
      return
    }
    if (received > invoiceAmount) {
      toast.error("Amount received cannot exceed the invoice amount")
      return
    }
    setSaving(true)
    try {
      // Update this payment: set amount to what was received, mark paid
      const res = await fetch("/api/admin/payment/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          projectId,
          status: "paid",
          amount: received,
          paidAt: paidAt || new Date().toISOString(),
          paymentMethod: paymentMethod || null,
          referenceNote: referenceNote.trim() || null,
        }),
      })
      if (!res.ok) throw new Error("Failed")

      // If partial, create a new pending payment for the remainder
      if (isPartial) {
        const remRes = await fetch("/api/admin/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            description: `${payment.description || "Payment"} (Remainder)`,
            amount: remainder,
            status: "pending",
            dueDate: payment.due_date,
          }),
        })
        if (!remRes.ok) console.log("[v0] Remainder creation failed but primary payment was saved")
      }

      toast.success(
        isPartial
          ? `Partial payment of ${formatCurrency(received)} recorded. Remainder of ${formatCurrency(remainder)} created.`
          : `Payment of ${formatCurrency(received)} marked as paid`
      )
      onSaved()
    } catch {
      toast.error("Failed to mark payment as paid")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Mark as Paid</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {payment.description || "Payment"} -- {formatCurrency(invoiceAmount)}
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {/* Amount Received */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount Received *</label>
            <CurrencyInput value={amountReceived} onChange={setAmountReceived} required min={0.01} max={invoiceAmount} />
          </div>

          {/* Partial payment warning */}
          {isPartial && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-medium">Partial payment detected</p>
              <p className="mt-0.5">
                A new pending payment of <span className="font-semibold">{formatCurrency(remainder)}</span> will
                be created automatically for the remaining balance.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Paid Date</label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Reference Note</label>
            <input
              type="text"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="e.g. Check #4521 or Stripe pi_xxx"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPartial ? "Record Partial Payment" : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ============================================================
   Edit Payment Dialog
   ============================================================ */
function EditPaymentDialog({
  payment,
  projectId,
  onClose,
  onSaved,
}: {
  payment: Payment
  projectId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [description, setDescription] = useState(payment.description || "")
  const [amount, setAmount] = useState(String(payment.amount))
  const [status, setStatus] = useState(payment.status)
  const [dueDate, setDueDate] = useState(payment.due_date?.split("T")[0] || "")
  const [paidAt, setPaidAt] = useState(payment.paid_at?.split("T")[0] || "")
  const [paymentMethod, setPaymentMethod] = useState(payment.payment_method || "")
  const [referenceNote, setReferenceNote] = useState(payment.reference_note || "")
  const [saving, setSaving] = useState(false)

  const isPaid = status === "paid"

  // Track what changed for activity log
  const changes = useMemo(() => {
    const diffs: string[] = []
    if (description.trim() !== (payment.description || "")) diffs.push("description")
    if (Number(amount) !== Number(payment.amount)) diffs.push(`amount to ${formatCurrency(Number(amount))}`)
    if (status !== payment.status) diffs.push(`status to ${status}`)
    if (dueDate !== (payment.due_date?.split("T")[0] || "")) diffs.push("due date")
    if (isPaid && paidAt !== (payment.paid_at?.split("T")[0] || "")) diffs.push("paid date")
    if (isPaid && paymentMethod !== (payment.payment_method || "")) diffs.push("payment method")
    if (isPaid && referenceNote.trim() !== (payment.reference_note || "")) diffs.push("reference note")
    return diffs
  }, [description, amount, status, dueDate, paidAt, paymentMethod, referenceNote, isPaid, payment])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) {
      toast.error("Description is required")
      return
    }
    if (changes.length === 0) {
      toast.info("No changes to save")
      onClose()
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/payment/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          projectId,
          description: description.trim(),
          amount: Number(amount),
          status,
          dueDate,
          paidAt: isPaid ? (paidAt || payment.paid_at || new Date().toISOString()) : null,
          paymentMethod: isPaid ? (paymentMethod || null) : null,
          referenceNote: isPaid ? (referenceNote.trim() || null) : null,
          changes,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Payment updated")
      onSaved()
    } catch {
      toast.error("Failed to update payment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Edit Payment</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount *</label>
              <CurrencyInput value={amount} onChange={setAmount} required min={0} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <PaidFields
            isPaid={isPaid}
            paidAt={paidAt}
            setPaidAt={setPaidAt}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            referenceNote={referenceNote}
            setReferenceNote={setReferenceNote}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || changes.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
