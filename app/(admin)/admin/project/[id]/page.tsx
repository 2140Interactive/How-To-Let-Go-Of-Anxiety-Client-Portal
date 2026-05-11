import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAdminProjectDetail } from "@/lib/data/admin-project"
import { SendWelcomeEmailButton } from "@/components/admin/send-welcome-email-button"
import { InlineDateEditor } from "@/components/admin/inline-date-editor"
import { ProjectTabs } from "@/components/admin/project-tabs"
import { MilestonesTab } from "@/components/admin/milestones-tab"
import { TasksTab } from "@/components/admin/tasks-tab"
import { ActivityTab } from "@/components/admin/activity-tab"
import { FilesTab } from "@/components/admin/files-tab"
import { PaymentsTab } from "@/components/admin/payments-tab"
import { MessagesTab } from "@/components/admin/messages-tab"
import { SettingsTab } from "@/components/admin/settings-tab"

const healthConfig = {
  on_track: { label: "On Track", dot: "bg-[var(--awyc-teal-success)]", text: "text-[var(--awyc-teal-success)]" },
  behind_schedule: { label: "Behind Schedule", dot: "bg-amber-500", text: "text-amber-600" },
  at_risk: { label: "At Risk", dot: "bg-red-500", text: "text-red-600" },
} as const

export default async function AdminProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab || "milestones"

  const data = await getAdminProjectDetail(id)
  if (!data) notFound()

  const { project, client, milestones, tasks, activities, files, payments, investment, health } = data
  const hc = healthConfig[health.status as keyof typeof healthConfig] || healthConfig.on_track

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admin Dashboard
      </Link>

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            {project.name}
          </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {client?.first_name} {client?.last_name}
          {client?.company_name && `: ${client.company_name}`}
        </p>
        {(client?.email || client?.phone) && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {client?.email && (
              <a href={`mailto:${client.email}`} className="hover:text-foreground hover:underline transition-colors">
                {client.email}
              </a>
            )}
            {client?.email && client?.phone && <span className="text-border">·</span>}
            {client?.phone && (
              <a href={`tel:${client.phone}`} className="hover:text-foreground hover:underline transition-colors">
                {client.phone}
              </a>
            )}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <InlineDateEditor
            label="Started"
            value={project.start_date}
            field="startDate"
            projectId={id}
          />
          <span className="text-border">·</span>
          <InlineDateEditor
            label="Est. Completion"
            value={project.estimated_end_date}
            field="estimatedEndDate"
            projectId={id}
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", hc.dot)} />
          <span className={cn("text-sm font-semibold", hc.text)}>{hc.label}</span>
          {health.days_remaining !== null && (
            <span className="text-xs text-muted-foreground">
              {health.days_remaining < 0
                ? `— Overdue by ${Math.abs(health.days_remaining)} days`
                : `— ${health.days_remaining} days until estimated completion`}
            </span>
          )}
        </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href={`/project/${id}?preview=true`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Eye className="h-4 w-4" />
            View as Client
          </Link>
          <SendWelcomeEmailButton
            projectId={id}
            welcomeEmailSentAt={project.welcome_email_sent_at}
          />
        </div>
      </div>

      {/* Tabs */}
      <Suspense fallback={null}>
        <ProjectTabs />
      </Suspense>

      {/* Tab content */}
      <div>
        {activeTab === "milestones" && (
          <MilestonesTab milestones={milestones} projectId={id} projectStatus={project.status} />
        )}
        {activeTab === "tasks" && (
          <TasksTab
            tasks={tasks}
            projectId={id}
            clientName={client ? `${client.first_name} ${client.last_name}${client.company_name ? `, ${client.company_name}` : ""}` : undefined}
          />
        )}
        {activeTab === "activity" && (
          <ActivityTab activities={activities} projectId={id} />
        )}
        {activeTab === "files" && (
          <FilesTab files={files} milestones={milestones} projectId={id} />
        )}
        {activeTab === "payments" && (
          <PaymentsTab payments={payments} projectId={id} investment={investment} />
        )}
        {activeTab === "messages" && (
          <MessagesTab projectId={id} primaryTeamMemberId={client?.id || ""} />
        )}
        {activeTab === "settings" && (
          <SettingsTab project={project} />
        )}
      </div>
    </div>
  )
}
