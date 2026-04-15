import { NextRequest, NextResponse } from 'next/server'

// Sin imports de next-auth/DB para compatibilidad con Edge Runtime
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rutas públicas
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/email/')   // cron-job.org llama sin sesión, el Bearer token lo valida el route handler
  ) {
    return NextResponse.next()
  }

  // NextAuth v5 guarda sesión en esta cookie
  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value

  if (!sessionToken) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si ya está autenticado y va al login, redirigir a pedidos
  if (sessionToken && pathname === '/login') {
    return NextResponse.redirect(new URL('/pedidos', req.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.ico).*)'],
}
