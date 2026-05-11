import React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/auth/admin"
import { AdminTopNav } from "@/components/admin-top-nav"
import { AdminMobileNav } from "@/components/admin-mobile-nav"
import { Footer } from "@/components/footer"

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join("")
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    redirect("/dashboard")
  }

  const { data: teamMember } = await supabase
    .from("team_members")
    .select("name, photo_url")
    .eq("is_primary", true)
    .single()

  const initials = teamMember?.name ? getInitials(teamMember.name) : "A"
  const photoUrl = teamMember?.photo_url || null

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AdminTopNav initials={initials} photoUrl={photoUrl} />
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-x-hidden px-4 py-8 pb-20 md:px-6 md:pb-8">
        <div className="min-w-0">{children}</div>
      </main>
      <Footer />
      <AdminMobileNav />
    </div>
  )
}
