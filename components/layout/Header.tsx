'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
  title?: string
}

export function Header({ title = '' }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

      <div className="flex items-center gap-4">
        {process.env.NEXT_PUBLIC_BUILD_TIME && (
          <span className="hidden sm:inline text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-mono" title="Versión desplegada">
            {new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
          </span>
        )}
        {session?.user && (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{(session.user as any).nombre}</p>
              <p className="text-xs text-gray-500">{(session.user as any).rol}</p>
            </div>
            <Button
              onClick={() => signOut({ redirect: true, redirectTo: '/login' })}
              variant="ghost"
              size="sm"
            >
              Cerrar Sesión
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
