import type { Metadata } from "next"
import { getAdminDashboardData } from "@/lib/data/admin-dashboard"
import { StatCard } from "@/components/admin/stat-card"
import { ClientProjectList } from "@/components/admin/client-project-list"
import { NeedsAttention } from "@/components/admin/needs-attention"
import { TeamActivityLog } from "@/components/admin/team-activity-log"
import { PaymentsOverview } from "@/components/admin/payments-overview"
import { NewClientProjectButton } from "@/components/admin/new-client-project-modal"
import { formatCurrency } from "@/lib/utils/format"

export const metadata: Metadata = {
  title: "Admin Dashboard | AWYC",
  description: "Overview of all clients, projects, and activity.",
}

export default async function AdminDashboardPage() {
  const {
    stats,
    clients,
    teamActivity,
    allPayments,
    needsAttention,
    stalledProjects,
  } = await getAdminDashboardData()

  return (
    <div className="flex flex-col gap-8">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of all clients, projects, and activity.
          </p>
        </div>
        <NewClientProjectButton adminName="Andreas Marcel" />
      </div>

      {/* 1. Quick Stats (clickable) */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
          href="#clients-projects"
        />
        <StatCard
          label="Pending Tasks"
          value={stats.awaitingClients}
          href="#needs-attention"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          highlight
          href="#needs-attention"
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(stats.outstandingBalance)}
          href="#payments-overview"
        />
      </section>

      {/* 2. Needs Attention + Activity Log */}
      <section id="needs-attention" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <NeedsAttention items={needsAttention} stalledProjects={stalledProjects} />
        </div>
        <div className="min-w-0">
          <TeamActivityLog activities={teamActivity} />
        </div>
      </section>

      {/* 3. Payments Overview */}
      <section id="payments-overview" className="scroll-mt-24">
        <PaymentsOverview payments={allPayments} />
      </section>

      {/* 5. Clients & Projects */}
      <section id="clients-projects" className="scroll-mt-24">
        <ClientProjectList clients={clients} />
      </section>
    </div>
  )
}
