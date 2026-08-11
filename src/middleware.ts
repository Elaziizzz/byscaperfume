import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has('auth')
  const hasSelectedStore = request.cookies.has('store')
  
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isStoreSelectPage = request.nextUrl.pathname === '/store-select'

  // If not authenticated and not on login page, redirect to login
  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If authenticated but hasn't selected a store, force them to store selection (unless they are logging out/etc)
  if (isAuthenticated && !hasSelectedStore && !isStoreSelectPage && !isLoginPage) {
    return NextResponse.redirect(new URL('/store-select', request.url))
  }

  // If authenticated and tries to go to login, redirect to dashboard or store-select
  if (isAuthenticated && isLoginPage) {
    if (hasSelectedStore) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.redirect(new URL('/store-select', request.url))
  }

  // If authenticated and has a store, but tries to go to store select, that's fine (changing stores)
  
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
