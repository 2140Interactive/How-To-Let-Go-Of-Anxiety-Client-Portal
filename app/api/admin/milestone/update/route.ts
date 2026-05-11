import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { adminSideEffects, getAdminName } from "@/lib/admin-api-helpers"
import { formatStatus } from "@/lib/utils/format"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = "hello@portal.automatewhatyoucan.com"

export async function PATCH(request: Request) {
  // Get authenticated user
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { milestoneId, projectId, status, statusNote, expectedDate, name, shortLabel, description, order } = body

  if (!milestoneId || !projectId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const adminName = await getAdminName(user.email || "")

  // If setting to in_progress, clear any other in_progress milestone first
  if (status === "in_progress") {
    await serviceClient
      .from("milestones")
      .update({ status: "upcoming" })
      .eq("project_id", projectId)
      .eq("status", "in_progress")
      .neq("id", milestoneId)
  }

  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (statusNote !== undefined) updates.status_note = statusNote || null
  if (expectedDate !== undefined) updates.expected_completion_date = expectedDate || null
  if (name !== undefined) updates.name = name
  if (shortLabel !== undefined) updates.short_label = shortLabel
  if (description !== undefined) updates.description = description || null
  if (order !== undefined) {
    updates.order = order
    
    // Auto-shift: Get the old order of this milestone
    const { data: oldMilestone } = await serviceClient
      .from("milestones")
      .select("order")
      .eq("id", milestoneId)
      .single()
    
    const oldOrder = oldMilestone?.order || 0
    
    // If order is changing and the new order is different from old
    if (order !== oldOrder) {
      if (order < oldOrder) {
        // Moving milestone up (to lower order number)
        // Get milestones between new and old order
        const { data: affectedMilestones } = await serviceClient
          .from("milestones")
          .select("id, order")
          .eq("project_id", projectId)
          .gte("order", order)
          .lt("order", oldOrder)
          .neq("id", milestoneId)
        
        // Increment their orders
        if (affectedMilestones && affectedMilestones.length > 0) {
          for (const m of affectedMilestones) {
            await serviceClient
              .from("milestones")
              .update({ order: m.order + 1 })
              .eq("id", m.id)
          }
        }
      } else {
        // Moving milestone down (to higher order number)
        // Get milestones between old and new order
        const { data: affectedMilestones } = await serviceClient
          .from("milestones")
          .select("id, order")
          .eq("project_id", projectId)
          .gt("order", oldOrder)
          .lte("order", order)
          .neq("id", milestoneId)
        
        // Decrement their orders
        if (affectedMilestones && affectedMilestones.length > 0) {
          for (const m of affectedMilestones) {
            await serviceClient
              .from("milestones")
              .update({ order: m.order - 1 })
              .eq("id", m.id)
          }
        }
      }
    }
  }
  
  if (status === "completed") {
    updates.completed_at = new Date().toISOString()
  } else if (status !== undefined && status !== "completed") {
    updates.completed_at = null
  }

  const { data, error } = await serviceClient
    .from("milestones")
    .update(updates)
    .eq("id", milestoneId)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const statusLabel =
    status === "completed" ? "completed" :
    status === "in_progress" ? "started" :
    status === "blocked" ? "blocked" :
    status === "revision" ? "under revision" : "updated"

  await adminSideEffects({
    projectId,
    adminName,
    activity: {
      type: "milestone_completed",
      title: `${data.name} ${statusLabel}`,
      description: `Milestone status changed to ${formatStatus(status)}`,
    },
    notification: {
      type: "milestone",
      title: `Your project has moved to ${data.name}`,
      message: `The ${data.name} phase is now ${statusLabel}.`,
    },
    webhook: {
      event: "milestone_updated",
      milestoneName: data.name,
      newStatus: status,
    },
  })

  // Send email notification to client for milestone status changes (only if welcome email has been sent)
  if (status !== undefined) {
    const { data: project } = await serviceClient
      .from("projects")
      .select("name, welcome_email_sent_at, clients(first_name, email)")
      .eq("id", projectId)
      .single()

    const clientRecord = project?.clients as unknown as { first_name: string; email: string } | null
    if (clientRecord?.email && project?.welcome_email_sent_at) {
      try {
        await resend.emails.send({
          from: `Automate What You Can <${FROM_EMAIL}>`,
          to: clientRecord.email,
          subject: `Project Update: ${data.name} ${statusLabel}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="border-top: 4px solid #5095A3; padding-top: 28px;">
    <p style="font-size: 20px; color: #5095A3; font-weight: bold; margin: 0 0 24px;">Milestone Update</p>
    <p style="margin: 0 0 16px;">Hi ${clientRecord.first_name},</p>
    <p style="margin: 0 0 16px;">Your <strong>${project.name}</strong> project has reached a new milestone.</p>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px;"><strong>Milestone:</strong> ${data.name}</p>
      <p style="margin: 0;"><strong>Status:</strong> ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}</p>
    </div>
    <p style="margin: 0 0 28px;">
      <a href="https://portal.automatewhatyoucan.com/project/${projectId}" style="background-color: #5095A3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px; display: inline-block;">View Project</a>
    </p>
    <p style="margin: 0 0 8px;">Thank you.</p>
    <p style="margin: 0; color: #5095A3; font-weight: bold;">Andreas</p>
    <p style="margin: 4px 0 0; color: #888888; font-size: 14px;">Automate What You Can</p>
  </div>
</body>
</html>
          `,
        })
      } catch (emailError) {
        console.error("Failed to send milestone notification email:", emailError)
      }
    }
  }

  // Auto-update project status based on milestone completion
  if (status !== undefined) {
    // Get current project status
    const { data: project } = await serviceClient
      .from("projects")
      .select("status")
      .eq("id", projectId)
      .single()

    // Do NOT auto-update if project is 'on_hold' or 'cancelled'
    if (project?.status === "on_hold" || project?.status === "cancelled") {
      return Response.json({ success: true, data })
    }

    // Get all milestones for this project
    const { data: allMilestones } = await serviceClient
      .from("milestones")
      .select("status")
      .eq("project_id", projectId)

    if (allMilestones && allMilestones.length > 0) {
      const totalMilestones = allMilestones.length
      const completedMilestones = allMilestones.filter(m => m.status === "completed").length
      const inProgressMilestones = allMilestones.filter(m => m.status === "in_progress").length

      let newProjectStatus: string | null = null

      // When ALL milestones are 'completed': auto-update to 'completed'
      if (completedMilestones === totalMilestones && project?.status !== "completed") {
        newProjectStatus = "completed"
      }
      // When ANY milestone changes to 'in_progress' and project status is 'new': auto-update to 'active'
      else if (status === "in_progress" && inProgressMilestones > 0 && project?.status === "new") {
        newProjectStatus = "active"
      }

      if (newProjectStatus) {
        await serviceClient
          .from("projects")
          .update({ status: newProjectStatus })
          .eq("id", projectId)

        // Log activity with no admin name (system-generated)
        await adminSideEffects({
          projectId,
          adminName: null,
          activity: {
            type: "message",
            title: `Project status updated to ${formatStatus(newProjectStatus)}`,
            description: null,
          },
        })
      }
    }
  }

  return Response.json({ success: true, data })
}
