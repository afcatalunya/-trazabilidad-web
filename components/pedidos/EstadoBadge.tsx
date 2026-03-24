// EstadoBadge — visual badge for pedido estado with icon + color
interface EstadoBadgeProps {
  estado: string
}

const ESTADO_CONFIG: Record<string, { bg: string; text: string; icon: string; dot: string }> = {
  'SIN PEDIDO DE COMPRA': {
    bg: '#fef2f2', text: '#991b1b', dot: '#ef4444',
    icon: '○',
  },
  'EN PROCESO': {
    bg: '#fff7ed', text: '#9a3412', dot: '#f97316',
    icon: '◐',
  },
  'PLANNING': {
    bg: '#fefce8', text: '#854d0e', dot: '#eab308',
    icon: '◑',
  },
  'PARA CARGAR MURCIA': {
    bg: '#fffbeb', text: '#92400e', dot: '#f59e0b',
    icon: '▲',
  },
  'EN CAMION': {
    bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6',
    icon: '→',
  },
  'EN ALMACÉN': {
    bg: '#f0fdf4', text: '#166534', dot: '#22c55e',
    icon: '●',
  },
  'ENTREGADO': {
    bg: '#2d9e4e', text: '#ffffff', dot: '#ffffff',
    icon: '✓',
  },
  'ANULADO': {
    bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af',
    icon: '✕',
  },
}

// Short label for compact display
const ESTADO_LABEL: Record<string, string> = {
  'SIN PEDIDO DE COMPRA': 'SIN PEDIDO',
  'EN PROCESO':           'EN PROCESO',
  'PLANNING':             'PLANNING',
  'PARA CARGAR MURCIA':   'PARA CARGAR',
  'EN CAMION':            'EN CAMIÓN',
  'EN ALMACÉN':           'EN ALMACÉN',
  'ENTREGADO':            'ENTREGADO',
  'ANULADO':              'ANULADO',
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const cfg = ESTADO_CONFIG[estado] ?? { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', icon: '·' }
  const label = ESTADO_LABEL[estado] ?? estado

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span style={{ color: cfg.dot, fontSize: '9px', lineHeight: 1 }}>{cfg.icon}</span>
      {label}
    </span>
  )
}
