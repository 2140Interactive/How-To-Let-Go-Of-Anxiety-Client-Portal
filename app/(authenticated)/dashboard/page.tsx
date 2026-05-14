import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/auth/admin"
import { getDashboardData, getClientByAuthId } from "@/lib/data/dashboard"
import { ActionItems } from "@/components/project/action-items"
import { ProjectCard } from "@/components/dashboard/project-card"
import { InvitationCard } from "@/components/dashboard/invitation-card"
import { DashboardTeamCard } from "@/components/dashboard/dashboard-team-card"
import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed"
import { PaymentBanner } from "@/components/dashboard/payment-banner"
import { DashboardContentWrapper } from "@/components/dashboard/dashboard-content-wrapper"

export const metadata = {
  title: "Dashboard - HTLGOA Client Portal",
  description: "View your active projects and pending tasks",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const client = await getClientByAuthId(user.id)

  // If no client record and not admin, redirect
  if (!client && !isAdmin(user.email)) {
    redirect("/login")
  }

  // If admin with no client record is previewing, show empty state
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Admin Preview</h1>
        <p className="text-muted-foreground">
          No client record is linked to your admin account. Switch to the admin dashboard.
        </p>
      </div>
    )
  }

  const clientId = client.id
  const firstName = client.first_name

  const { projects, pendingTasks, pendingPayments, recentActivities, unreadNotificationCount, teamMember } =
    await getDashboardData(clientId)

  return (
    <DashboardContentWrapper clientId={clientId}>
    <div className="flex flex-col gap-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {"Here's what's happening with your projects."}
        </p>
      </div>

      {/* Payment Banner - shows if any pending payments */}
      <PaymentBanner pendingPayments={pendingPayments} />

      {/* Grid: Priority Action (or All Caught Up) + Team Card */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="min-w-0 flex flex-col gap-8">
          {/* Action Items (replaces Priority Action banner + Tasks Waiting on You) */}
          <div data-tour="action-items">
            <ActionItems
              tasks={pendingTasks}
              currentPhaseName="your projects"
              statusNote="Your projects are progressing smoothly."
              showProjectName
              hasStarted={projects.some((p) => p.progress_percentage > 0)}
            />
          </div>

          {/* Active Projects */}
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Active Projects
            </h2>
            {projects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    status={project.status}
                    progressPercentage={project.progress_percentage}
                    currentMilestoneName={project.current_milestone_name}
                    estimatedEndDate={project.estimated_end_date}
                  />
                ))}
                {projects.length === 1 && (
                  <InvitationCard schedulingUrl={teamMember?.scheduling_url} />
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No active projects right now.
                </p>
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <DashboardActivityFeed activities={recentActivities} />

          {/* Mobile only: Team card after Tasks, expanded by default */}
          {teamMember && (
            <div className="lg:hidden">
              <DashboardTeamCard teamMember={teamMember} projects={projects} defaultOpen />
            </div>
          )}
        </div>

        {/* Right column: Team Card (desktop only) */}
        {teamMember && (
          <div className="hidden lg:block">
            <DashboardTeamCard teamMember={teamMember} projects={projects} />
          </div>
        )}
      </div>
    </div>
    </DashboardContentWrapper>
  )
}
