import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getSessionCookieName, readSessionClaims } from '@/lib/auth/session'
import { getDashboardPathFromRole } from '@/lib/auth'

const PUBLIC_REDIRECT = '/login'

const createUnauthorizedResponse = (
  request: NextRequest,
  redirectTo = PUBLIC_REDIRECT
) => {
  const url = new URL(redirectTo, request.url)
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith('/admin')
  const isUserRoute = pathname.startsWith('/app')

  if (!isAdminRoute && !isUserRoute) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get(getSessionCookieName())?.value
  const claims = readSessionClaims(sessionToken)

  if (!claims) {
    return createUnauthorizedResponse(request)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', claims.uid)
  requestHeaders.set('x-user-role', claims.role)
  if (claims.email) requestHeaders.set('x-user-email', claims.email)

  if (isAdminRoute && claims.role !== 'admin') {
    return NextResponse.redirect(
      new URL(getDashboardPathFromRole(claims.role), request.url)
    )
  }

  if (isUserRoute && claims.role !== 'admin' && claims.role !== 'user') {
    return createUnauthorizedResponse(request)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/admin/:path*', '/app/:path*']
}
