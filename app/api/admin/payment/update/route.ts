import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { adminSideEffects, getAdminName } from "@/lib/admin-api-helpers"
import { formatStatus } from "@/lib/utils/format"

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { paymentId, projectId, status, amount, dueDate, description, paidAt, paymentMethod, referenceNote, changes } = body

    if (!paymentId || !projectId) {
      return Response.json({ error: "Missing required fields: paymentId, projectId" }, { status: 400 })
    }

    // Session client for auth verification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    // Service client for DB writes (bypasses RLS)
    const serviceClient = createServiceClient()
    const adminName = await getAdminName(user.email || "")

    const updates: Record<string, unknown> = {}
    if (status !== undefined) updates.status = status
    if (amount !== undefined) updates.amount = amount
    if (dueDate !== undefined) updates.due_date = dueDate
    if (description !== undefined) updates.description = description || null

    // Auto-manage paid_at based on status transitions
    if (status === "paid") {
      updates.paid_at = paidAt || new Date().toISOString()
      if (paymentMethod !== undefined) updates.payment_method = paymentMethod || null
      if (referenceNote !== undefined) updates.reference_note = referenceNote || null
    } else if (status !== undefined) {
      updates.paid_at = null
      updates.payment_method = null
      updates.reference_note = null
    }

    const { data, error } = await serviceClient
      .from("payments")
      .update(updates)
      .eq("id", paymentId)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(Number(data.amount))

    // Build descriptive activity entry
    const changeList = Array.isArray(changes) && changes.length > 0 ? changes : null

    if (status === "paid" && !changeList) {
      // Mark as Paid flow
      await adminSideEffects({
        projectId,
        adminName,
        activity: {
          type: "payment_received",
          title: `Payment of ${formattedAmount} marked as paid`,
          description: data.description ? `"${data.description}" payment received.` : "Payment received.",
        },
        notification: {
          type: "payment",
          title: `Payment of ${formattedAmount} confirmed`,
          message: `Your payment of ${formattedAmount} has been received and confirmed.`,
        },
        webhook: { event: "payment_updated", amount: data.amount, status },
      })
    } else {
      // Edit flow -- include what changed
      const changeDesc = changeList
        ? `Updated: ${changeList.join(", ")}`
        : status ? `Payment status changed to ${formatStatus(status)}.` : "Payment details updated."

      await adminSideEffects({
        projectId,
        adminName,
        activity: {
          type: "payment_received",
          title: `Payment updated: ${data.description || formattedAmount}`,
          description: changeDesc,
        },
        notification: status === "paid" ? {
          type: "payment",
          title: `Payment of ${formattedAmount} confirmed`,
          message: `Your payment of ${formattedAmount} has been received and confirmed.`,
        } : undefined,
        webhook: { event: "payment_updated", amount: data.amount, status },
      })
    }

    return Response.json({ success: true, data })
  } catch (err) {
    console.error("[v0] Payment update error:", err)
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
