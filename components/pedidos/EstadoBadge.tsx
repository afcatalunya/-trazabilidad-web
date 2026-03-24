import { Estado, getEstadoColor } from '@/lib/utils'

interface EstadoBadgeProps {
  estado: Estado
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const colors = getEstadoColor(estado)

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${colors.bg} ${colors.text}`}
    >
      {estado}
    </span>
  )
}
