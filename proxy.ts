import { auth } from './lib/auth'

export default auth((req: any) => {
  const isAuthenticated = !!req.auth
  const pathname = req.nextUrl.pathname

  const protectedPaths = ['/pedidos', '/clientes', '/incidencias', '/informes', '/admin']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  if (!isAuthenticated && isProtected) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  if (isAuthenticated && pathname === '/login') {
    return Response.redirect(new URL('/pedidos', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
