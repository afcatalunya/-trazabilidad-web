import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Usamos solo authConfig (sin DB) para que funcione en Edge Runtime
export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.ico).*)',
  ],
}
