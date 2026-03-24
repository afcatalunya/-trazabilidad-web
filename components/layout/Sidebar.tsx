'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// SVG logo inline — "af" monogram inspired by Aluminios Franco brand
function AfLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Circle background */}
      <circle cx="20" cy="20" r="19" fill="white" fillOpacity="0.15" />
      <circle cx="20" cy="20" r="19" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
      {/* Arc accent */}
      <path d="M 8 32 A 14 14 0 0 1 32 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.5"/>
      {/* "af" text */}
      <text
        x="50%" y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize="15"
        letterSpacing="-0.5"
      >
        af
      </text>
    </svg>
  )
}

const navItems = [
  {
    label: 'Pedidos',
    path: '/pedidos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Clientes',
    path: '/clientes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Incidencias',
    path: '/incidencias',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    label: 'Informes',
    path: '/informes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Admin',
    path: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <aside
      className="w-64 text-white h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1a5c35 0%, #0f3520 60%, #0a2718 100%)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
      }}
    >
      {/* Textura sutil de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Logo / Brand */}
      <div
        className="relative px-5 py-5 flex items-center gap-3"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <AfLogo size={42} />
        <div>
          <p className="text-white font-semibold text-sm leading-tight tracking-tight">Aluminios Franco</p>
          <p className="text-white/40 text-xs mt-0.5 font-medium tracking-wider uppercase" style={{ fontSize: '10px' }}>Trazabilidad</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group ${
              isActive(item.path)
                ? 'text-white'
                : 'text-white/60 hover:text-white/90'
            }`}
            style={
              isActive(item.path)
                ? {
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    borderLeft: '3px solid rgba(255,255,255,0.7)',
                    paddingLeft: '13px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }
                : {
                    borderLeft: '3px solid transparent',
                    paddingLeft: '13px',
                  }
            }
          >
            <span
              className="transition-all duration-200"
              style={{ opacity: isActive(item.path) ? 1 : 0.55 }}
            >
              {item.icon}
            </span>
            <span className="transition-all duration-200">{item.label}</span>
            {isActive(item.path) && (
              <span
                className="ml-auto w-1.5 h-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.75)', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}
              />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="relative px-5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>© 2026 Aluminios Franco S.A.</p>
      </div>
    </aside>
  )
}
