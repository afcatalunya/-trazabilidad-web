'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'

interface HeaderProps {
  title?: string
}

export function Header({ title = '' }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center flex-shrink-0">
      {/* Left: Page title with green accent */}
      <div className="flex items-center gap-3">
        <span className="w-1 h-7 rounded-full bg-af-green-500 inline-block" style={{ background: '#2d9e4e' }} />
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
      </div>

      {/* Right: build version + user info */}
      <div className="flex items-center gap-4">
        {process.env.NEXT_PUBLIC_BUILD_TIME && (
          <span
            className="hidden sm:inline text-xs px-2 py-0.5 rounded font-mono text-gray-400"
            style={{ background: '#f0faf4', border: '1px solid #b3e4c8' }}
            title="Versión desplegada"
          >
            v {new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString('es-ES', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        )}

        {session?.user && (
          <div className="flex items-center gap-3">
            {/* Avatar circle */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: '#2d9e4e' }}
              title={(session.user as any).nombre || ''}
            >
              {((session.user as any).nombre || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-800 leading-tight">{(session.user as any).nombre}</p>
              <p className="text-xs text-gray-400 leading-tight capitalize">{((session.user as any).rol || '').toLowerCase()}</p>
            </div>
            <button
              onClick={() => signOut({ redirect: true, redirectTo: '/login' })}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1 px-2 py-1 rounded hover:bg-red-50"
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
