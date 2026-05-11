import { createClient } from "@/lib/supabase/server"

export async function getAdminProjectDetail(projectId: string) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(*)")
    .eq("id", projectId)
    .single()

  if (!project) return null

  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("order", { ascending: true })

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("priority", { ascending: true })
    .order("due_date", { ascending: true })

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true })

  const totalValue = Number(project.total_value) || 0
  const totalPaid =
    payments
      ?.filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const now = new Date()
  const estimatedEnd = project.estimated_end_date
    ? new Date(project.estimated_end_date)
    : null
  const daysRemaining = estimatedEnd
    ? Math.ceil(
        (estimatedEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null

  const healthStatus: "on_track" | "behind_schedule" | "at_risk" =
    project.health_override || "on_track"

  return {
    project,
    client: project.clients,
    milestones: milestones || [],
    tasks: tasks || [],
    activities: activities || [],
    files: files || [],
    payments: payments || [],
    investment: {
      total_value: totalValue,
      total_paid: totalPaid,
      remaining_balance: totalValue - totalPaid,
    },
    health: {
      status: healthStatus,
      days_remaining: daysRemaining,
    },
  }
}
