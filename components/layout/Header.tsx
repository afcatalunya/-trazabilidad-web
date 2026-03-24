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
