import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { adminSideEffects, getAdminName } from "@/lib/admin-api-helpers"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = "hello@portal.automatewhatyoucan.com"

export async function PATCH(request: Request) {
  try {
    // Get authenticated user
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, projectId, title, description, type, priority, dueDate, isPriorityAction, status, actionUrl, actionLabel } = body

    if (!taskId || !projectId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const adminName = await getAdminName(user.email || "")

    // Fetch the existing task to compare changes
    const { data: existingTask } = await serviceClient
      .from("tasks")
      .select("due_date, priority, title")
      .eq("id", taskId)
      .single()

    // Get project and client info for email notification
    const { data: project } = await serviceClient
      .from("projects")
      .select("client_id, name, welcome_email_sent_at")
      .eq("id", projectId)
      .single()

    const { data: client } = project ? await serviceClient
      .from("clients")
      .select("email, first_name")
      .eq("id", project.client_id)
      .single() : { data: null }

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (type !== undefined) updates.task_type = type
    if (priority !== undefined) updates.priority = priority
    if (dueDate !== undefined) updates.due_date = dueDate || null
    if (isPriorityAction !== undefined) updates.is_priority_action = isPriorityAction
    if (status !== undefined) updates.status = status
    if (actionUrl !== undefined) updates.action_url = actionUrl
    if (actionLabel !== undefined) updates.action_label = actionLabel

    const { data, error } = await serviceClient
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single()

    if (error) {
      console.log("[v0] Supabase update error:", error.message, error.details, error.hint)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Side effects are non-critical -- don't let them fail the request
    try {
      await adminSideEffects({
        projectId,
        adminName,
        activity: {
          type: "task_updated",
          title: `Task updated: ${data.title}`,
        },
        webhook: { event: "task_updated", taskTitle: data.title },
      })
    } catch (sideEffectError) {
      console.log("[v0] Side effects failed (non-blocking):", sideEffectError)
    }

    // Send email notification if due date or priority changed (only if welcome email has been sent)
    const dueDateChanged = existingTask && dueDate !== undefined && existingTask.due_date !== dueDate
    const priorityChanged = existingTask && priority !== undefined && existingTask.priority !== priority

    if (client?.email && project?.welcome_email_sent_at && (dueDateChanged || priorityChanged)) {
      const changes: string[] = []
      
      if (dueDateChanged && dueDate) {
        const formattedNewDate = new Date(dueDate).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        changes.push(`Due date changed to: ${formattedNewDate}`)
      }
      
      if (priorityChanged) {
        const priorityLabel = priority === "P1" ? "High Priority" : priority === "P2" ? "Medium Priority" : "Normal Priority"
        changes.push(`Priority changed to: ${priorityLabel}`)
      }

      try {
        await resend.emails.send({
          from: `AWYC Portal <${FROM_EMAIL}>`,
          to: client.email,
          subject: `Task Updated: ${data.title}`,
          html: getTaskUpdatedEmailTemplate({
            contactPerson: client.first_name || "Client",
            projectName: project?.name || "Your project",
            taskName: data.title,
            dueDateChanged,
            newDueDate: dueDate ? new Date(dueDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }) : "",
            priorityChanged,
            newPriority: priority === "P1" ? "High Priority" : priority === "P2" ? "Medium Priority" : "Normal Priority",
            portalUrl: "https://portal.automatewhatyoucan.com/login",
          }),
        })
      } catch (emailError) {
        console.error("Failed to send task update email:", emailError)
      }
    }

    return Response.json({ success: true, data })
  } catch (err) {
    console.log("[v0] Task update unhandled error:", err)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getTaskUpdatedEmailTemplate({
  contactPerson,
  projectName,
  taskName,
  dueDateChanged,
  newDueDate,
  priorityChanged,
  newPriority,
  portalUrl,
}: {
  contactPerson: string
  projectName: string
  taskName: string
  dueDateChanged: boolean
  newDueDate: string
  priorityChanged: boolean
  newPriority: string
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

    <p style="font-size: 20px; color: #5095A3; font-weight: bold; margin: 0 0 24px;">Task Updated</p>

    <p style="margin: 0 0 16px;">Hi ${contactPerson},</p>

    <p style="margin: 0 0 16px;">A task on your ${projectName} project has been updated.</p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px;"><strong>Task:</strong> ${taskName}</p>
      ${dueDateChanged ? `<p style="margin: 0 0 8px;"><strong>New Due Date:</strong> ${newDueDate}</p>` : ""}
      ${priorityChanged ? `<p style="margin: 0;"><strong>New Priority:</strong> ${newPriority}</p>` : ""}
    </div>

    <p style="margin: 0 0 28px;">
      <a href="${portalUrl}" style="background-color: #5095A3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px; display: inline-block;">View Details</a>
    </p>

    <p style="margin: 0 0 8px;">Thank you.</p>

    <p style="margin: 0; color: #5095A3; font-weight: bold;">Andreas</p>
    <p style="margin: 4px 0 0; color: #888888; font-size: 14px;">Automate What You Can</p>

  </div>

</body>
</html>
  `
}
