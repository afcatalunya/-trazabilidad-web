export type Estado =
  | 'SIN PEDIDO DE COMPRA'
  | 'EN PROCESO'
  | 'PLANNING'
  | 'PARA CARGAR MURCIA'
  | 'EN CAMION'
  | 'EN ALMACÉN'
  | 'ENTREGADO'
  | 'ANULADO'

export interface Pedido {
  id: number
  numeroPedido: string
  tipoSalida: string | null
  fechaPedido: string | null
  numeroCliente: string | null
  codigoComercial: string | null
  cliente: string
  categoria: string | null
  referenciaProducto: string | null
  acabado: string | null
  color: string | null
  docSalida: string | null
  proveedor: string | null
  origenMaterial: string | null
  fechaSalida: string | null
  fechaPlanning: string | null
  fechaTerminado: string | null
  fechaCargaCamion: string | null
  fechaEnTarragona: string | null
  fechaEntregaCliente: string | null
  estadoPedido: string
  incidenciaMaterial: string | null
  urgente: string | null   // '' = normal, 'URGENTE'
  almacen: string | null
  comentarios: string | null
  numComentarios: number | null
  createdAt: string | null
  updatedAt: string | null
}

export function calcularEstado(pedido: Partial<Pedido>): string {
  if (pedido.estadoPedido === 'ANULADO') return 'ANULADO'
  if (pedido.fechaEntregaCliente) return 'ENTREGADO'
  if (pedido.fechaEnTarragona) return 'EN ALMACÉN'
  if (pedido.fechaCargaCamion) return 'EN CAMION'
  if (pedido.fechaTerminado) return 'PARA CARGAR MURCIA'
  if (pedido.fechaPlanning) return 'PLANNING'
  if (pedido.fechaSalida) return 'EN PROCESO'
  return 'SIN PEDIDO DE COMPRA'
}

export function calcularAlmacen(pedido: Partial<Pedido>): string | null {
  if (pedido.fechaEnTarragona) return 'TARRAGONA'
  if (pedido.almacen) return pedido.almacen
  return null
}

export interface EstadoColor {
  bg: string
  text: string
}

export function getEstadoColor(estado: string): EstadoColor {
  const colores: Record<string, EstadoColor> = {
    'SIN PEDIDO DE COMPRA': { bg: 'bg-red-200', text: 'text-red-900' },
    'EN PROCESO':           { bg: 'bg-orange-200', text: 'text-orange-900' },
    'PLANNING':             { bg: 'bg-yellow-200', text: 'text-yellow-900' },
    'PARA CARGAR MURCIA':   { bg: 'bg-yellow-200', text: 'text-yellow-900' },
    'EN CAMION':            { bg: 'bg-blue-200', text: 'text-blue-900' },
    'EN ALMACÉN':           { bg: 'bg-green-200', text: 'text-green-900' },
    'ENTREGADO':            { bg: 'bg-green-600', text: 'text-white' },
    'ANULADO':              { bg: 'bg-gray-200', text: 'text-gray-700' },
  }
  return colores[estado] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function formatDateForDB(dateString: string): string {
  if (!dateString) return ''
  return dateString
}

export function formatDateForInput(dateString: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return dateString || ''
  }
}
