import { createClient } from "@/lib/supabase/server"
import { adminSideEffects, getAdminName } from "@/lib/admin-api-helpers"
import { formatStatus } from "@/lib/utils/format"

export async function PATCH(request: Request) {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { projectId, name, status, startDate, estimatedEndDate, projectType, description, healthOverride } = body

  if (!projectId) {
    return Response.json({ error: "Missing project ID" }, { status: 400 })
  }

  const adminName = await getAdminName(user.email || "")

  // Fetch current project to detect status change
  const { data: current } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .single()

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (status !== undefined) updates.status = status
  if (startDate !== undefined) updates.start_date = startDate
  if (estimatedEndDate !== undefined) updates.estimated_end_date = estimatedEndDate
  if (projectType !== undefined) updates.project_type = projectType
  if (description !== undefined) updates.description = description
  if (healthOverride !== undefined) updates.health_override = healthOverride || null

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const statusChanged = status && current && current.status !== status

  await adminSideEffects({
    projectId,
    adminName,
    activity: {
      type: "message",
      title: statusChanged
        ? `Project status changed to ${formatStatus(status)}`
        : "Project settings updated",
    },
    ...(statusChanged
      ? {
          notification: {
            type: "message",
            title: "Project update",
            message: `Your project status has been updated to ${formatStatus(status)}.`,
          },
        }
      : {}),
    webhook: { event: "project_updated", changes: updates },
  })

  return Response.json({ success: true, data })
}
