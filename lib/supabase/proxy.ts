import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/auth/callback", "/api/webhooks/stripe"]

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check for public routes and static assets
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - important for keeping tokens alive
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow public routes regardless of auth state
  if (isPublicRoute) {
    // If user is already logged in and visits /login, redirect them
    if (user && pathname === "/login") {
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
      if (adminEmail && user.email?.toLowerCase() === adminEmail) {
        const url = request.nextUrl.clone()
        url.pathname = "/admin"
        return NextResponse.redirect(url)
      }
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // No user = redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.delete("error")

    // Check if the user had a session cookie -- if so, their session expired
    const hasSessionCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))
    if (hasSessionCookie) {
      url.searchParams.set(
        "error",
        "Your session has expired. Please sign in again."
      )
    }

    return NextResponse.redirect(url)
  }

  const userEmail = user.email?.toLowerCase()
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  const isAdminUser = adminEmail && userEmail === adminEmail

  // Admin route protection: only admin email can access /admin/*
  if (pathname.startsWith("/admin")) {
    if (!isAdminUser) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // Client route protection: admin should not be blocked from client routes
  // (useful for admin preview), but non-client non-admin users get redirected
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/project") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/monitoring")
  ) {
    // Admin can access client routes for preview
    if (isAdminUser) {
      return supabaseResponse
    }

    // For regular users, the layout will verify they have a client record
    // No need to query the DB in middleware -- let the page handle it
  }

  return supabaseResponse
}
