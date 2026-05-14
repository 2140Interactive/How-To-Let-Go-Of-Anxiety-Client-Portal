import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { adminSideEffects, getAdminName } from "@/lib/admin-api-helpers"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = "hello@portal.howtoletgoofanxiety.com"

export async function POST(request: Request) {
  // Get authenticated user
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { projectId, title, description, type, priority, dueDate, isPriorityAction, actionUrl, actionLabel } = body

  if (!projectId || !title || !type || !priority || !dueDate) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const adminName = await getAdminName(user.email || "")

  // Get client_id and project name from project
  const { data: project } = await serviceClient
    .from("projects")
    .select("client_id, name, welcome_email_sent_at")
    .eq("id", projectId)
    .single()

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 })
  }

  // Get client email for notification
  const { data: client } = await serviceClient
    .from("clients")
    .select("email, first_name")
    .eq("id", project.client_id)
    .single()

  const { data, error } = await serviceClient
    .from("tasks")
    .insert({
      project_id: projectId,
      assigned_to: project.client_id,
      title,
      description: description || null,
      task_type: type,
      priority,
      due_date: dueDate,
      status: "todo",
      is_priority_action: isPriorityAction || false,
      action_url: actionUrl || null,
      action_label: actionLabel || null,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  await adminSideEffects({
    projectId,
    adminName,
    activity: {
      type: "task_created",
      title: `New task: ${title}`,
      description: description || null,
    },
    notification: {
      type: "task",
      title: `You have a new task: ${title}`,
      message: `A new ${type} task has been assigned to you.`,
    },
    webhook: { event: "task_created", taskTitle: title },
  })

  // Send email notification to client (only if welcome email has been sent)
  if (client?.email && project?.welcome_email_sent_at) {
    const formattedDueDate = new Date(dueDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    const priorityLabel = priority === "P1" ? "High Priority" : priority === "P2" ? "Medium Priority" : "Normal Priority"

    try {
      await resend.emails.send({
        from: `How To Let Go Of Anxiety <${FROM_EMAIL}>`,
        to: client.email,
        subject: `New Task: ${title}`,
        html: getTaskCreatedEmailTemplate({
          contactPerson: client.first_name || "Client",
          projectName: project.name,
          taskName: title,
          description,
          portalUrl: `${process.env.NEXT_PUBLIC_PORTAL_URL}/login`,
        }),
      })
    } catch (emailError) {
      console.error("Failed to send task notification email:", emailError)
      // Don't fail the request if email fails - task was still created
    }
  }

  return Response.json({ success: true, data })
}

function getTaskCreatedEmailTemplate({
  contactPerson,
  projectName,
  taskName,
  description,
  portalUrl,
}: {
  contactPerson: string
  projectName: string
  taskName: string
  description: string
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

    <p style="font-size: 20px; color: #5095A3; font-weight: bold; margin: 0 0 24px;">New Task Created</p>

    <p style="margin: 0 0 16px;">Hi ${contactPerson},</p>

    <p style="margin: 0 0 16px;">A new task has been created on your ${projectName} project.</p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px;"><strong>Task:</strong> ${taskName}</p>
      <p style="margin: 0;"><strong>Description:</strong> ${description}</p>
    </div>

    <p style="margin: 0 0 28px;">
      <a href="${portalUrl}" style="background-color: #5095A3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px; display: inline-block;">View Task</a>
    </p>

    <p style="margin: 0 0 8px;">Thank you.</p>

    <p style="margin: 0; color: #5095A3; font-weight: bold;">Andreas</p>
    <p style="margin: 4px 0 0; color: #888888; font-size: 14px;">How To Let Go Of Anxiety</p>

  </div>

</body>
</html>
  `
}
