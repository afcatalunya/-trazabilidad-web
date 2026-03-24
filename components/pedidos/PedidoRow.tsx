import Link from 'next/link'
import { EstadoBadge } from './EstadoBadge'
import { formatDate } from '@/lib/utils'

interface PedidoRowProps {
  pedido: any
  cliente?: string
}

const Celda = ({ valor }: { valor: any }) => (
  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{valor || '-'}</td>
)

const CeldaFecha = ({ valor }: { valor: any }) => (
  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
    {valor ? <span className="text-green-700 font-medium">{formatDate(valor)}</span> : <span className="text-gray-300">—</span>}
  </td>
)

export function PedidoRow({ pedido, cliente = '' }: PedidoRowProps) {
  return (
    <tr className="hover:bg-blue-50 transition duration-100 border-b border-gray-100">
      {/* Número */}
      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-blue-700 sticky left-0 bg-white">
        <Link href={`/pedidos/${pedido.id}`} className="hover:underline">
          {pedido.numeroPedido}
        </Link>
      </td>
      {/* Tipo */}
      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 font-semibold">
        {pedido.tipoSalida || '-'}
      </td>
      {/* F.Pedido */}
      <CeldaFecha valor={pedido.fechaPedido} />
      {/* Cliente */}
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 font-medium">
        {cliente || pedido.cliente || '-'}
      </td>
      {/* Nº Cliente */}
      <Celda valor={pedido.numeroCliente} />
      {/* Comercial */}
      <Celda valor={pedido.codigoComercial} />
      {/* Categoría */}
      <Celda valor={pedido.categoria} />
      {/* Referencia */}
      <Celda valor={pedido.referenciaProducto} />
      {/* Acabado */}
      <Celda valor={pedido.acabado} />
      {/* Color */}
      <Celda valor={pedido.color} />
      {/* Proveedor */}
      <Celda valor={pedido.proveedor} />
      {/* Doc.Salida */}
      <Celda valor={pedido.docSalida} />
      {/* F.Salida */}
      <CeldaFecha valor={pedido.fechaSalida} />
      {/* F.Planning */}
      <CeldaFecha valor={pedido.fechaPlanning} />
      {/* F.Terminado */}
      <CeldaFecha valor={pedido.fechaTerminado} />
      {/* F.Camión */}
      <CeldaFecha valor={pedido.fechaCargaCamion} />
      {/* F.Tarragona */}
      <CeldaFecha valor={pedido.fechaEnTarragona} />
      {/* F.Entrega */}
      <CeldaFecha valor={pedido.fechaEntregaCliente} />
      {/* Estado */}
      <td className="px-3 py-2 whitespace-nowrap">
        <EstadoBadge estado={pedido.estadoPedido || 'SIN PEDIDO DE COMPRA'} />
      </td>
      {/* Incidencia */}
      <td className="px-3 py-2 whitespace-nowrap text-xs">
        {pedido.incidenciaMaterial === 'SÍ' || pedido.incidenciaMaterial === 'SI' ? (
          <span className="bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">⚠️ SÍ</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      {/* Almacén */}
      <Celda valor={pedido.almacen} />
      {/* Urgente */}
      <td className="px-3 py-2 whitespace-nowrap">
        {pedido.urgente === 'URGENTE' ? (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">🚨 URG</span>
        ) : null}
      </td>
    </tr>
  )
}
