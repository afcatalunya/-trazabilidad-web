'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.startsWith(path)

  const navItems = [
    { label: 'Pedidos', path: '/pedidos', icon: '📦' },
    { label: 'Clientes', path: '/clientes', icon: '👥' },
    { label: 'Incidencias', path: '/incidencias', icon: '⚠️' },
    { label: 'Informes', path: '/informes', icon: '📊' },
    { label: 'Admin', path: '/admin', icon: '⚙️' },
  ]

  return (
    <aside className="w-64 bg-sidebar text-white h-screen flex flex-col border-r border-blue-900">
      <div className="p-6 border-b border-blue-900">
        <h1 className="text-2xl font-bold">Aluminios Franco</h1>
        <p className="text-xs text-blue-200">Trazabilidad</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-blue-100 hover:bg-blue-800'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-900 text-xs text-blue-200">
        <p>© 2024 Aluminios Franco</p>
      </div>
    </aside>
  )
}
