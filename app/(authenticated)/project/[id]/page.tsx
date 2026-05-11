import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdmin } from "@/lib/auth/admin"
import { getProjectDetail } from "@/lib/data/project"
import { getClientByAuthId } from "@/lib/data/dashboard"
import { formatDate, formatRelativeTime } from "@/lib/utils/format"
import { ProjectContentWrapper } from "@/components/project/project-content-wrapper"
import { ActionItems } from "@/components/project/action-items"
import { MilestoneRoadmap } from "@/components/project/milestone-roadmap"
import { InvestmentStatus } from "@/components/project/investment-status"
import { PaymentSection } from "@/components/project/payment-section"
import { ProjectPaymentAlertBanner } from "@/components/project/payment-alert-banner"
import { TeamSidebar } from "@/components/project/team-sidebar"
import { TeamContactAccordion } from "@/components/project/team-contact-accordion"
import { ActivityFeed } from "@/components/project/activity-feed"
import { DocumentsFiles } from "@/components/project/documents-files"
import { MessagesSection } from "@/components/project/messages-section"
import { InvoicesPayments } from "@/components/project/invoices-payments"
import { TabScroll } from "@/components/project/tab-scroll"

const healthConfig = {
  on_track: { label: "On Track", color: "#138760" },
  behind_schedule: { label: "Behind Schedule", color: "#D97706" },
  at_risk: { label: "At Risk", color: "#DC2626" },
} as const

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { id } = await params
  const { preview } = await searchParams

  // Get authenticated client info
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  let clientId: string

  // Admin preview mode: look up the project's client_id directly
  const adminPreviewing = preview === "true" && isAdmin(user.email)
  if (adminPreviewing) {
    const serviceClient = createServiceClient()
    const { data: project } = await serviceClient
      .from("projects")
      .select("client_id")
      .eq("id", id)
      .single()
    if (!project) redirect("/admin")
    clientId = project.client_id
  } else {
    const client = await getClientByAuthId(user.id)
    if (!client) redirect("/dashboard")
    clientId = client.id
  }

  const data = await getProjectDetail(id, clientId)

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Project Not Found</h1>
        <p className="text-muted-foreground">
          {"This project doesn't exist or you don't have access to it."}
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--awyc-primary)] hover:text-[var(--awyc-primary-dark)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const {
    project,
    milestones,
    tasks,
    payments,
    activities,
    teamMembers,
    files,
    lastUpdatedAt,
    investment,
    health,
  } = data

  const currentMilestone =
    milestones.find((m) => m.status === "in_progress") ||
    milestones.find((m) => m.status === "upcoming")
  const currentMilestoneName = currentMilestone?.name || "the current phase"
  const primaryTeamMember = teamMembers.find((m) => m.is_primary) || teamMembers[0]
  const healthInfo = healthConfig[health.status]

  return (
    <ProjectContentWrapper projectId={id}>
      <div className="flex flex-col gap-6 px-4 md:px-0">
      <TabScroll />
      {/* Back link + header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-11 w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">
            {project.name.replace(/ - [^-]+$/, "")}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {project.start_date && <span>Started: {formatDate(project.start_date)}</span>}
            {project.start_date && project.estimated_end_date && (
              <span className="text-border">|</span>
            )}
            {project.estimated_end_date && (
              <span>Est. Completion: {formatDate(project.estimated_end_date)}</span>
            )}
            <span className="text-border">|</span>
            <span>Last updated: {formatRelativeTime(lastUpdatedAt)}</span>
          </div>
          {/* Health status line */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: healthInfo.color }}
              aria-hidden="true"
            />
            <span className="font-medium" style={{ color: healthInfo.color }}>
              {healthInfo.label}
            </span>
            {health.days_remaining !== null && (
              <>
                <span className="text-muted-foreground">&mdash;</span>
                <span className="text-muted-foreground">
                  {health.days_remaining > 0
                    ? `${health.days_remaining} days until estimated completion`
                    : `${Math.abs(health.days_remaining)} days past estimated completion`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Alert Banner - Show at top if outstanding balance */}
      {payments.some(p => p.status === 'pending') && (() => {
        const pendingPayment = payments.find(p => p.status === 'pending')
        if (!pendingPayment) return null
        return (
          <ProjectPaymentAlertBanner
            projectId={id}
            paymentId={pendingPayment.id}
            dueAmount={pendingPayment.amount}
            dueDate={pendingPayment.due_date}
          />
        )
      })()}

      {/* Two-column grid: main content + sticky sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column: all main content sections */}
        <div className="min-w-0 flex flex-col gap-6">
          {/* 1. Action Items (replaces Priority Action banner + Tasks Waiting on You) */}
          <div id="action-items" className="scroll-mt-24">
            <ActionItems
              tasks={tasks}
              currentPhaseName={currentMilestoneName}
              statusNote={currentMilestone?.status_note}
              schedulingUrl={primaryTeamMember?.scheduling_url || null}
            />
          </div>

          {/* 2. Milestone Roadmap */}
          <MilestoneRoadmap
            milestones={milestones}
            currentPhaseName={currentMilestoneName}
            statusNote={currentMilestone?.status_note}
          />

          {/* 2.5. Payment Section - Show if outstanding balance */}
          {payments.some(p => p.status === 'pending') && (() => {
            const pendingPayment = payments.find(p => p.status === 'pending')
            return pendingPayment ? (
              <PaymentSection
                projectId={id}
                paymentId={pendingPayment.id}
                dueAmount={pendingPayment.amount}
                dueDate={pendingPayment.due_date}
                amountPaid={payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)}
                total={investment?.total_value || 0}
              />
            ) : null
          })()}

          {/* 3. Recent Activity */}
          <ActivityFeed activities={activities} />

          {/* 3.5. Messages Section */}
          <MessagesSection projectId={id} clientId={clientId} />

          {/* Mobile only: collapsible team contact */}
          <div className="lg:hidden">
            <TeamContactAccordion teamMembers={teamMembers} projectName={project.name} />
          </div>

          {/* 4. Your Investment */}
          <InvestmentStatus
            totalValue={investment.total_value}
            totalPaid={investment.total_paid}
            remainingBalance={investment.remaining_balance}
            nextPaymentAmount={investment.next_payment_amount}
            nextPaymentDate={investment.next_payment_date}
            paymentStatus={investment.payment_status}
          />

          {/* 5. Documents & Files */}
          <div id="files" className="scroll-mt-24">
            <DocumentsFiles files={files} clientId={clientId} />
          </div>

          {/* 6. Invoices & Payments */}
          <div id="payments" className="scroll-mt-24">
            <InvoicesPayments payments={payments} projectId={id} investment={investment} />
          </div>
        </div>

        {/* Right column: sticky Team Sidebar (desktop only) */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <TeamSidebar teamMembers={teamMembers} projectName={project.name} />
          </div>
        </div>
      </div>
      </div>
    </ProjectContentWrapper>
  )
}
