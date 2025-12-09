import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/verify-certificate", "/faq", "/resources"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Admin routes
  const isAdminRoute = pathname.startsWith("/admin")
  const isAdmin = req.auth?.user?.role === "ADMIN"

  // Redirect logic
  if (!isLoggedIn && !isPublicRoute) {
    // Not logged in and trying to access protected route
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isAdminRoute && !isAdmin) {
    // Trying to access admin route without admin role
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

// Configure which routes use this middleware
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
