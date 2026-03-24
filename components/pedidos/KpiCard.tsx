'use client'

import Link from 'next/link'
import { useState } from 'react'

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function KpiCard({ label, value, color, active, href }: {
  label: string
  value: number
  color: string
  active?: boolean
  href: string
}) {
  const [hovered, setHovered] = useState(false)
  const rgb = hexToRgb(color)

  return (
    <Link href={href}>
      <div
        className="rounded-xl px-4 py-3 cursor-pointer transition-all duration-200"
        style={
          active
            ? {
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                boxShadow: `0 4px 20px rgba(${rgb}, 0.35), 0 1px 4px rgba(${rgb}, 0.2)`,
                transform: 'scale(1.03) translateY(-1px)',
                border: `1px solid ${color}`,
              }
            : hovered
            ? {
                background: '#fff',
                border: '1px solid #e9ecef',
                boxShadow: `0 4px 16px rgba(${rgb}, 0.18), 0 1px 4px rgba(0,0,0,0.06)`,
                transform: 'translateY(-1px)',
                borderColor: `rgba(${rgb}, 0.4)`,
              }
            : {
                background: '#fff',
                border: '1px solid #e9ecef',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }
        }
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <p
          className="text-2xl font-bold leading-none tabular-nums"
          style={{ color: active ? '#fff' : '#111827' }}
        >
          {value}
        </p>
        <p
          className="text-xs mt-1.5 font-medium tracking-wide"
          style={{ color: active ? 'rgba(255,255,255,0.8)' : '#6b7280' }}
        >
          {label}
        </p>
      </div>
    </Link>
  )
}
