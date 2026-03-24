'use client'

import Link from 'next/link'
import { EstadoBadge } from './EstadoBadge'
import { AccionesRapidas } from './AccionesRapidas'
import { formatDate } from '@/lib/utils'

interface PedidoRowProps {
  pedido: any
  cliente?: string
  stripe?: boolean
}

const Celda = ({ valor }: { valor: any }) => (
  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{valor || <span className="text-gray-300">—</span>}</td>
)

const CeldaFecha = ({ valor }: { valor: any }) => (
  <td className="px-3 py-2 whitespace-nowrap text-xs">
    {valor
      ? <span className="font-medium" style={{ color: '#217a3b' }}>{formatDate(valor)}</span>
      : <span className="text-gray-200">—</span>
    }
  </td>
)

export function PedidoRow({ pedido, cliente = '', stripe = false }: PedidoRowProps) {
  const bg = stripe ? '#fafcfa' : '#ffffff'

  return (
    <tr
      className="border-b border-gray-50 transition-colors duration-100"
      style={{ background: bg }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f0faf4')}
      onMouseLeave={e => (e.currentTarget.style.background = bg)}
    >
      {/* Número — sticky col 1 */}
      <td
        className="px-3 py-2 whitespace-nowrap text-xs font-bold sticky left-0 z-10"
        style={{ background: 'inherit', color: '#1a5c35', minWidth: '120px', width: '120px' }}
      >
        <Link href={`/pedidos/${pedido.id}`} className="hover:underline underline-offset-2">
          {pedido.numeroPedido}
        </Link>
        {pedido.urgente === 'URGENTE' && (
          <span className="ml-1 text-red-500" title="Urgente">🚨</span>
        )}
        {pedido.numComentarios > 0 && (
          <span
            className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white font-bold"
            style={{ fontSize: '9px', background: '#f97316', minWidth: '16px' }}
            title={`${pedido.numComentarios} comentario${pedido.numComentarios > 1 ? 's' : ''}`}
          >
            {pedido.numComentarios > 9 ? '9+' : pedido.numComentarios}
          </span>
        )}
      </td>

      {/* Acciones rápidas — sticky col 2 */}
      <AccionesRapidas
        pedidoId={pedido.id}
        numeroPedido={pedido.numeroPedido}
        tipoSalida={pedido.tipoSalida}
      />

      {/* Tipo */}
      <td className="px-3 py-2 whitespace-nowrap">
        {pedido.tipoSalida
          ? <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: '#e8f5e9', color: '#1a5c35' }}>{pedido.tipoSalida}</span>
          : <span className="text-gray-200 text-xs">—</span>
        }
      </td>

      {/* F.Pedido */}
      <CeldaFecha valor={pedido.fechaPedido} />

      {/* Cliente — prominent */}
      <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-gray-800 max-w-[160px] truncate" title={cliente || pedido.cliente || ''}>
        {cliente || pedido.cliente || <span className="text-gray-300">—</span>}
      </td>

      {/* Nº Cliente */}
      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 font-mono">{pedido.numeroCliente || <span className="text-gray-200">—</span>}</td>

      {/* Comercial */}
      <Celda valor={pedido.codigoComercial} />

      {/* Categoría */}
      <td className="px-3 py-2 whitespace-nowrap">
        {pedido.categoria
          ? <span className="text-xs text-gray-600">{pedido.categoria}</span>
          : <span className="text-gray-200 text-xs">—</span>
        }
      </td>

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
        {pedido.incidenciaMaterial === 'SÍ' || pedido.incidenciaMaterial === 'SI'
          ? <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: '#fff3e0', color: '#e65100' }}>⚠ SÍ</span>
          : <span className="text-gray-200">—</span>
        }
      </td>

      {/* Almacén */}
      <Celda valor={pedido.almacen} />

      {/* Urgente */}
      <td className="px-3 py-2 whitespace-nowrap">
        {pedido.urgente === 'URGENTE'
          ? <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>URG</span>
          : null
        }
      </td>
    </tr>
  )
}
