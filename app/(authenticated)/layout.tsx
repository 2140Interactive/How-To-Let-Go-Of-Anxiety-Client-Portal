import React, { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/auth/admin"
import { getClientByAuthId } from "@/lib/data/dashboard"
import { TopNav } from "@/components/top-nav"
import { MobileNav } from "@/components/mobile-nav"
import { AdminPreviewBanner } from "@/components/admin-preview-banner"
import { Footer } from "@/components/footer"
import { TourProvider } from "@/components/tour/tour-provider"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Admin can preview client routes
  const adminViewing = isAdmin(user.email)

  let initials = "?"
  let photoUrl: string | null = null
  let hasMonitoringProjects = false
  let hasSeenTour = true // Default to true for non-clients

  const client = await getClientByAuthId(user.id)
  if (client) {
    initials = `${client.first_name[0]}${(client.last_name || "")[0] || ""}`.toUpperCase()
    photoUrl = client.photo_url || null
    hasSeenTour = client.has_seen_tour ?? false
  } else if (adminViewing) {
    // Admin previewing client side -- use admin initials
    initials = "A"
  } else {
    // Not a client and not admin -- sign them out to prevent redirect loop
    await supabase.auth.signOut()
    redirect("/login?error=No client account found for this email. Please contact your How To Let Go Of Anxiety team member.")
  }

  // Check if client has any monitoring projects
  if (client) {
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .eq("project_type", "monitoring")
    hasMonitoringProjects = (count || 0) > 0
  }

  return (
    <TourProvider hasSeenTour={hasSeenTour}>
      <div className="flex min-h-dvh flex-col bg-background">
        <Suspense fallback={null}>
          <AdminPreviewBanner />
        </Suspense>
        <TopNav
          initials={initials}
          photoUrl={photoUrl}
          hasMonitoringProjects={hasMonitoringProjects}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 overflow-x-hidden px-4 py-8 pb-20 md:px-6 md:pb-8">
          {children}
        </main>
        <Footer />
        <MobileNav
          hasMonitoringProjects={hasMonitoringProjects}
        />
      </div>
    </TourProvider>
  )
}
