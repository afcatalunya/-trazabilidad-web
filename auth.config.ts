import type { NextAuthConfig } from 'next-auth'

// Configuración mínima para el middleware (sin imports de DB)
// El Edge Runtime no soporta @libsql/client, por eso separamos la config
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname.startsWith('/login')
      const isApiAuth = nextUrl.pathname.startsWith('/api/auth')

      if (isLoginPage || isApiAuth) return true
      if (isLoggedIn) return true

      return false // redirige al login
    },
  },
  providers: [],
}
