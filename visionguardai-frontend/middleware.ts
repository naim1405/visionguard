import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register']
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Get the access token from cookies or could use headers
  // Note: In a real app, you might want to verify the token here
  // For simplicity, we'll check if it exists in localStorage on client side
  
  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, let the ProtectedRoute component handle auth
  // This middleware is just a lightweight check
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
