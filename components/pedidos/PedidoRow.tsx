import Link from 'next/link'
import { getEstadoColor } from '@/lib/utils'
import { EstadoBadge } from './EstadoBadge'

interface PedidoRowProps {
  pedido: any
  cliente?: string
}

export function PedidoRow({ pedido, cliente = '' }: PedidoRowProps) {
  const colors = getEstadoColor(pedido.estadoPedido || 'SIN PEDIDO DE COMPRA')

  return (
    <tr className={`hover:brightness-95 transition duration-150 border-b border-gray-200`}>
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-700">
        <Link href={`/pedidos/${pedido.id}`} className="hover:underline">
          {pedido.numeroPedido}
        </Link>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
        {pedido.tipoSalida || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
        {cliente || pedido.cliente || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
        {pedido.categoria || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
        {pedido.acabado || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
        {pedido.color || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <EstadoBadge estado={pedido.estadoPedido || 'SIN PEDIDO DE COMPRA'} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
        {pedido.almacen || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {pedido.urgente === 'URGENTE' && (
          <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
            🚨 URG
          </span>
        )}
      </td>
    </tr>
  )
}
