import { createServiceClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"

/**
 * Fetch the admin/team member name from the database based on email.
 * Falls back to "Admin" if not found.
 */
export async function getAdminName(email: string): Promise<string> {
  if (!email) return "Admin"
  
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("team_members")
    .select("name")
    .eq("email", email)
    .single()
  
  return data?.name || "Admin"
}

/**
 * Shared helper: create an activity entry, notification, fire webhook, and revalidate.
 * Activity titles are automatically prefixed with the admin name.
 */
export async function adminSideEffects({
  projectId,
  adminName,
  activity,
  notification,
  webhook,
}: {
  projectId: string
  adminName: string
  activity: { type: string; title: string; description?: string }
  notification?: { type: string; title: string; message: string }
  webhook?: { event: string; [key: string]: unknown }
}) {
  const supabase = createServiceClient()

  // 1. Create activity (prefixed with admin name if provided)
  const activityTitle = adminName ? `${adminName}: ${activity.title}` : activity.title
  const { error: actError } = await supabase.from("activities").insert({
    project_id: projectId,
    type: activity.type,
    title: activityTitle,
    description: activity.description || null,
    source: "admin",
  })
  if (actError) console.log("[v0] Activity insert failed:", actError.message)

  // 2. Create notification for client (table may not exist yet -- fail silently)
  if (notification) {
    try {
      const { data: project } = await supabase
        .from("projects")
        .select("client_id")
        .eq("id", projectId)
        .single()

      if (project) {
        const { error: notifError } = await supabase.from("notifications").insert({
          client_id: project.client_id,
          project_id: projectId,
          type: notification.type,
          title: notification.title,
          is_read: false,
        })
        if (notifError) console.log("[v0] Notification insert failed:", notifError.message)
      }
    } catch {
      console.log("[v0] Notification insert skipped (table may not exist)")
    }
  }

  // 3. Fire n8n webhook (non-blocking)
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (webhookUrl && webhook) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...webhook, projectId }),
    }).catch(() => {
      console.log("n8n webhook failed, continuing")
    })
  }

  // 4. Revalidate
  revalidatePath(`/admin/project/${projectId}`)
  revalidatePath(`/project/${projectId}`)
  revalidatePath("/dashboard")
  revalidatePath("/admin")
}
