import { createClient } from "@/lib/supabase/server"

export async function getProjectDetail(projectId: string, clientId: string) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("client_id", clientId)
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
    .eq("assigned_to", clientId)
    .in("status", ["todo", "in_progress"])
    .order("priority", { ascending: true })
    .order("due_date", { ascending: true })

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true })

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("project_id", projectId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .order("is_primary", { ascending: false })

  const totalPaid =
    payments
      ?.filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const totalValue = Number(project.total_value) || 0
  const remainingBalance = totalValue - totalPaid
  const nextPayment = payments?.find(
    (p) => p.status === "pending" || p.status === "overdue"
  )

  let paymentStatus: "current" | "due_soon" | "overdue" | "fully_paid" = "current"
  if (remainingBalance <= 0) {
    paymentStatus = "fully_paid"
  } else if (nextPayment?.status === "overdue") {
    paymentStatus = "overdue"
  } else if (nextPayment?.due_date) {
    const [y, m, d] = nextPayment.due_date.split("-").map(Number)
    const dueDate = Date.UTC(y, m - 1, d)
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000
    if (dueDate <= sevenDaysFromNow) {
      paymentStatus = "due_soon"
    }
  }

  const isBehindSchedule = project.is_behind_schedule
  const daysRemaining = project.estimated_end_date
    ? (() => {
        const [ey, em, ed] = project.estimated_end_date.split("-").map(Number)
        const estEnd = Date.UTC(ey, em - 1, ed)
        const nowUtc = Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          new Date().getUTCDate()
        )
        return Math.ceil((estEnd - nowUtc) / (1000 * 60 * 60 * 24))
      })()
    : null

  let healthStatus: "on_track" | "behind_schedule" | "at_risk" = "on_track"
  if (project.health_override) {
    healthStatus = project.health_override as "on_track" | "behind_schedule" | "at_risk"
  } else if (isBehindSchedule) {
    healthStatus = daysRemaining !== null && daysRemaining < 0 ? "at_risk" : "behind_schedule"
  }

  const lastUpdatedAt = activities?.[0]?.created_at || project.created_at

  return {
    project,
    milestones: milestones || [],
    tasks: tasks || [],
    payments: payments || [],
    activities: activities || [],
    teamMembers: teamMembers || [],
    files: files || [],
    
    lastUpdatedAt,
    investment: {
      total_value: totalValue,
      total_paid: totalPaid,
      remaining_balance: remainingBalance,
      next_payment_amount: nextPayment ? Number(nextPayment.amount) : null,
      next_payment_date: nextPayment?.due_date || null,
      payment_status: paymentStatus,
    },
    health: {
      status: healthStatus,
      days_remaining: daysRemaining,
    },
  }
}
