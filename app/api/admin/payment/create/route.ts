import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { adminSideEffects, getAdminName } from "@/lib/admin-api-helpers"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, amount, status = "pending", dueDate, paidAt, description, paymentMethod, referenceNote } = body

    if (!projectId || !amount || !dueDate) {
      return Response.json({ error: "Missing required fields: projectId, amount, dueDate" }, { status: 400 })
    }

    // Session client for auth verification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    // Service client for DB writes (bypasses RLS)
    const serviceClient = createServiceClient()
    const adminName = await getAdminName(user.email || "")

    const record: Record<string, unknown> = {
      project_id: projectId,
      amount: Number(amount),
      status,
      due_date: dueDate,
      description: description || null,
    }

    // Auto-set paid_at when creating a payment already marked as paid
    if (status === "paid") {
      record.paid_at = paidAt || new Date().toISOString()
      if (paymentMethod) record.payment_method = paymentMethod
      if (referenceNote) record.reference_note = referenceNote
    }

    const { data, error } = await serviceClient
      .from("payments")
      .insert(record)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(Number(amount))

    if (status === "paid") {
      await adminSideEffects({
        projectId,
        adminName,
        activity: {
          type: "payment_received",
          title: `Payment of ${formattedAmount} received`,
          description: `Payment of ${formattedAmount} recorded as paid.`,
        },
        notification: {
          type: "payment",
          title: `Payment of ${formattedAmount} confirmed`,
          message: `Your payment of ${formattedAmount} has been received.`,
        },
        webhook: { event: "payment_created", amount: Number(amount), status },
      })
    } else {
      // For pending payments, send email notification to client
      const { data: project } = await serviceClient
        .from("projects")
        .select("name, client_id")
        .eq("id", projectId)
        .single()

      if (project) {
        const { data: client } = await serviceClient
          .from("clients")
          .select("email, first_name")
          .eq("id", project.client_id)
          .single()

        if (client?.email) {
          const formattedDueDate = new Date(dueDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })

          try {
            await resend.emails.send({
              from: "Automate What You Can <hello@portal.automatewhatyoucan.com>",
              to: client.email,
              subject: `Payment Due: ${formattedAmount} - ${description || "Invoice"}`,
              html: getPaymentDueEmailTemplate({
                contactPerson: client.first_name || "Client",
                amount: formattedAmount,
                description: description || "Project payment",
                dueDate: formattedDueDate,
                portalUrl: "https://portal.automatewhatyoucan.com/login",
              }),
            })
            console.log("[v0] Payment due email sent to:", client.email)
          } catch (emailErr) {
            console.error("[v0] Failed to send payment due email:", emailErr)
            // Don't fail the request if email fails
          }
        }
      }

      // Format due date for activity/notification messages
      const [year, month, day] = dueDate.split("T")[0].split("-").map(Number)
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
      const formattedDueDateShort = `${monthNames[month - 1]} ${day}, ${year}`

      await adminSideEffects({
        projectId,
        adminName,
        activity: {
          type: "payment_received",
          title: `Payment of ${formattedAmount} scheduled`,
          description: `Payment of ${formattedAmount} due ${formattedDueDateShort}.`,
        },
        notification: {
          type: "payment",
          title: "Upcoming payment scheduled",
          message: `A payment of ${formattedAmount} has been scheduled, due ${formattedDueDateShort}.`,
        },
        webhook: { event: "payment_created", amount: Number(amount), status },
      })
    }

    return Response.json({ success: true, data })
  } catch (err) {
    console.error("[v0] Payment create error:", err)
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}

function getPaymentDueEmailTemplate({
  contactPerson,
  amount,
  description,
  dueDate,
  portalUrl,
}: {
  contactPerson: string
  amount: string
  description: string
  dueDate: string
  portalUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">

  <div style="border-top: 4px solid #5095A3; padding-top: 28px;">

    <p style="font-size: 20px; color: #5095A3; font-weight: bold; margin: 0 0 24px;">Payment Due</p>

    <p style="margin: 0 0 16px;">Hi ${contactPerson},</p>

    <p style="margin: 0 0 16px;">A payment has been scheduled for your project. Here are the details:</p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px;"><strong>Amount:</strong> ${amount}</p>
      <p style="margin: 0 0 8px;"><strong>Description:</strong> ${description}</p>
      <p style="margin: 0;"><strong>Due Date:</strong> ${dueDate}</p>
    </div>

    <p style="margin: 0 0 28px;">Click the button below to log in to your portal and complete the payment.</p>

    <p style="margin: 0 0 32px;">
      <a href="${portalUrl}" style="background-color: #5095A3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px; display: inline-block;">Pay Now</a>
    </p>

    <p style="margin: 0 0 8px;">Thank you for your business.</p>

    <p style="margin: 0; color: #5095A3; font-weight: bold;">Andreas</p>
    <p style="margin: 4px 0 0; color: #888888; font-size: 14px;">Automate What You Can</p>

  </div>

</body>
</html>
  `
}
