import { createClient } from "@/lib/supabase/server"

function getEndOfWorkWeek(): Date {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon...6=Sat
  const daysUntilFriday = day <= 5 ? 5 - day : 5 + (7 - day)
  const friday = new Date(now)
  friday.setDate(now.getDate() + daysUntilFriday)
  friday.setHours(23, 59, 59, 999)
  return friday
}

export async function getAdminDashboardData() {
  const supabase = await createClient()

  // --- Stats ---
  const { count: activeProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .in("status", ["new", "active"])

  const { count: pendingTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .in("status", ["todo", "in_progress"])

  const { count: overdueItems } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .in("status", ["todo", "in_progress"])
    .lt("due_date", new Date().toISOString())

  // totalClients count removed in favor of outstandingBalance

  // --- Clients with nested projects and milestones ---
  const { data: clients } = await supabase
    .from("clients")
    .select(`
      *,
      projects (
        *,
        milestones (id, name, short_label, order, status, completed_at)
      )
    `)
    .order("company_name", { ascending: true })

  // Calculate progress and current milestone for each project
  const clientsWithProgress = clients?.map((client) => {
    const projects = (client.projects || []).map(
      (project: {
        milestones?: { id: string; name: string; order: number; status: string; completed_at: string | null }[]
        [key: string]: unknown
      }) => {
        const milestones = project.milestones || []
        const completed = milestones.filter((m) => m.status === "completed").length
        const total = milestones.length
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0
        const sorted = [...milestones].sort((a, b) => a.order - b.order)
        const currentMilestone =
          sorted.find((m) => m.status === "in_progress") ||
          sorted.find((m) => m.status === "upcoming")

        return {
          ...project,
          progress_percentage: progress,
          current_milestone_name: currentMilestone?.name || "Not started",
          milestones: undefined,
        }
      }
    )

    return { ...client, projects }
  })

  // --- Client activity (uploads, approvals, payments) — last 7 days, max 5 ---
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const { data: clientActivity } = await supabase
    .from("activities")
    .select(`
      *,
      projects (
        name,
        clients (
          first_name,
          last_name,
          company_name
        )
      )
    `)
    .eq("source", "client")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(5)

  // --- Team activity (admin-initiated actions) ---
  const { data: teamActivity } = await supabase
    .from("activities")
    .select(`
      *,
      projects (
        name,
        clients (
          first_name,
          last_name,
          company_name
        )
      )
    `)
    .eq("source", "admin")
    .order("created_at", { ascending: false })
    .limit(15)

  // --- Client tasks (all open tasks across projects) ---
  const { data: clientTasks } = await supabase
    .from("tasks")
    .select("*, projects(name, id, clients(first_name, last_name))")
    .in("status", ["todo", "in_progress"])
    .order("due_date", { ascending: true })

  // --- All payments across projects (single query, filter client-side) ---
  const { data: allPayments } = await supabase
    .from("payments")
    .select("*, projects(name, id, clients(first_name, last_name))")
    .order("due_date", { ascending: false })

  const pendingPayments = (allPayments || []).filter(
    (p) => p.status === "pending" || p.status === "overdue"
  )

  // Outstanding balance = sum of all project total_values minus sum of all paid payments
  const totalProjectValue = (clientsWithProgress || []).reduce((sum, client) => {
    return sum + (client.projects || []).reduce((pSum: number, project: { total_value?: number }) => {
      return pSum + (Number(project.total_value) || 0)
    }, 0)
  }, 0)

  const totalPaid = (allPayments || [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const outstandingBalance = totalProjectValue - totalPaid

  // --- Needs attention: tasks & payments due through end of work week ---
  const endOfWeek = getEndOfWorkWeek()

  const { data: needsAttentionTasks } = await supabase
    .from("tasks")
    .select("*, projects(name, id, clients(first_name, last_name))")
    .in("status", ["todo", "in_progress"])
    .lte("due_date", endOfWeek.toISOString())
    .order("due_date", { ascending: true })

  const { data: needsAttentionPayments } = await supabase
    .from("payments")
    .select("*, projects(name, id, clients(first_name, last_name))")
    .in("status", ["pending", "overdue"])
    .lte("due_date", endOfWeek.toISOString())
    .order("due_date", { ascending: true })

  // Categorize into urgency buckets
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  function categorize(dueDate: string): "overdue" | "due_today" | "due_this_week" {
    const dueDateStr = dueDate.slice(0, 10)
    if (dueDateStr < todayStr) return "overdue"
    if (dueDateStr === todayStr) return "due_today"
    return "due_this_week"
  }

  const categorizedTasks = (needsAttentionTasks || []).map((t) => ({
    ...t,
    itemType: "task" as const,
    urgency: categorize(t.due_date),
    priority: t.priority,
  }))

  const categorizedPayments = (needsAttentionPayments || []).map((p) => ({
    ...p,
    itemType: "payment" as const,
    urgency: categorize(p.due_date),
  }))

  // --- Stalled phase detection ---
  const { data: allActiveProjects } = await supabase
    .from("projects")
    .select("id, name, clients(first_name, last_name)")
    .in("status", ["new", "active"])

  const { data: allMilestones } = await supabase
    .from("milestones")
    .select("id, name, status, completed_at, order, project_id")
    .order("order", { ascending: true })

  interface StalledProject {
    type: "stalled_phase"
    projectId: string
    projectName: string
    clientName: string
    lastCompletedName: string
    nextMilestoneName: string
    stalledSince: string
  }

  const stalledProjects: StalledProject[] = []
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)

  for (const project of allActiveProjects || []) {
    const projectMilestones = (allMilestones || []).filter(
      (m) => m.project_id === project.id
    )
    const hasInProgress = projectMilestones.some((m) => m.status === "in_progress")
    const allCompleted = projectMilestones.every((m) => m.status === "completed")

    if (!hasInProgress && !allCompleted && projectMilestones.length > 0) {
      const lastCompleted = projectMilestones
        .filter((m) => m.status === "completed" && m.completed_at)
        .sort(
          (a, b) =>
            new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
        )[0]

      if (lastCompleted && new Date(lastCompleted.completed_at!) < fortyEightHoursAgo) {
        const nextMilestone = projectMilestones
          .filter((m) => m.status === "upcoming")
          .sort((a, b) => a.order - b.order)[0]

        if (nextMilestone) {
          const client = project.clients as { first_name: string; last_name: string } | null
          stalledProjects.push({
            type: "stalled_phase",
            projectId: project.id,
            projectName: project.name,
            clientName: client
              ? `${client.first_name} ${client.last_name}`
              : "",
            lastCompletedName: lastCompleted.name,
            nextMilestoneName: nextMilestone.name,
            stalledSince: lastCompleted.completed_at!,
          })
        }
      }
    }
  }

  const allNeedsAttention = [...categorizedTasks, ...categorizedPayments].sort((a, b) => {
    const urgencyOrder = { overdue: 0, due_today: 1, due_this_week: 2 }
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    }
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return {
    stats: {
      activeProjects: activeProjects || 0,
      awaitingClients: pendingTasks || 0,
      overdue: overdueItems || 0,
      outstandingBalance,
    },
    clients: clientsWithProgress || [],
    clientActivity: clientActivity || [],
    teamActivity: teamActivity || [],
    clientTasks: clientTasks || [],
    allPayments: allPayments || [],
    pendingPayments,
    needsAttention: allNeedsAttention,
    stalledProjects,
  }
}
