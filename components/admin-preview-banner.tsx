"use client"

import { useSearchParams, usePathname } from "next/navigation"
import Link from "next/link"

export function AdminPreviewBanner() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isPreview = searchParams.get("preview") === "true"

  if (!isPreview) return null

  // Extract project ID from /project/[id] path
  const projectId = pathname.match(/^\/project\/([^/]+)/)?.[1]
  const exitHref = projectId ? `/admin/project/${projectId}` : "/admin"

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex h-10 items-center justify-center bg-[#D97706] px-4 text-sm font-medium text-white">
      <span>Viewing as client &mdash; This is what your client sees</span>
      <Link
        href={exitHref}
        className="ml-4 rounded-md border border-white/40 px-2.5 py-0.5 text-xs font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
      >
        Exit Preview
      </Link>
    </div>
  )
}
