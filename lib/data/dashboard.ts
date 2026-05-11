import { createClient } from "@/lib/supabase/server"

export async function getDashboardData(clientId: string) {
  const supabase = await createClient()

  // Fetch active projects with current milestone info
  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      *,
      milestones(id, name, short_label, order, status, completed_at)
    `
    )
    .eq("client_id", clientId)
    .in("status", ["new", "active"])
    .order("created_at", { ascending: false })

  // Calculate progress for each project
  const projectsWithProgress = projects?.map((project) => {
    const milestones = project.milestones || []
    const completed = milestones.filter(
      (m: { status: string }) => m.status === "completed"
    ).length
    const total = milestones.length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    const currentMilestone =
      milestones
        .sort(
          (a: { order: number }, b: { order: number }) => a.order - b.order
        )
        .find((m: { status: string }) => m.status === "in_progress") ||
      milestones.find((m: { status: string }) => m.status === "upcoming")

    return {
      ...project,
      progress_percentage: progress,
      current_milestone_name:
        (currentMilestone as { name?: string })?.name || "Your project roadmap is being prepared",
      milestones: undefined, // Don't pass raw milestones to client
    }
  })

  // Fetch all open tasks across projects for action items
  const { data: pendingTasks } = await supabase
    .from("tasks")
    .select("*, projects(name)")
    .eq("assigned_to", clientId)
    .in("status", ["todo", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: true })

  // Fetch recent client-relevant activities across all projects
  const projectIds = (projectsWithProgress || []).map((p) => p.id)
  const clientRelevantTypes = [
    "milestone_completed",
    "milestone_started",
    "payment_received",
    "document_uploaded",
    "task_created",
    "message",
  ]
  const { data: recentActivities } = projectIds.length > 0
    ? await supabase
        .from("activities")
        .select("*, projects(name)")
        .in("project_id", projectIds)
        .in("type", clientRelevantTypes)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] }

  // Fetch pending payments across all projects
  const { data: pendingPayments } = projectIds.length > 0
    ? await supabase
        .from("payments")
        .select("*, projects(name)")
        .in("project_id", projectIds)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
    : { data: [] }

  // Fetch unread notification count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("is_read", false)

  // Fetch primary team member
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_primary", true)
    .single()

  return {
    projects: projectsWithProgress || [],
    pendingTasks: pendingTasks || [],
    pendingPayments: (pendingPayments || []).map((p) => ({
      ...p,
      project_name: (p.projects as { name: string } | null)?.name || null,
    })),
    recentActivities: (recentActivities || []).map((a) => ({
      ...a,
      project_name: (a.projects as { name: string } | null)?.name || null,
    })),
    unreadNotificationCount: unreadCount || 0,
    teamMember: teamMember || null,
  }
}

export async function getClientByAuthId(authUserId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single()

  return data
}
