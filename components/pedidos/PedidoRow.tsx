'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EstadoBadge } from './EstadoBadge'
import { AccionesRapidas } from './AccionesRapidas'
import { formatDate } from '@/lib/utils'

interface PedidoRowProps {
  pedido: any
  cliente?: string
  stripe?: boolean
}

interface Comentario {
  id: number
  texto: string
  usuario: string
  fechaComentario: string
  tipoNota: string
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

// ── Sección expandible de comentarios ────────────────────────────────────────
function ComentariosInline({
  numeroPedido,
  tipoSalida,
}: {
  numeroPedido: string
  tipoSalida?: string | null
}) {
  const router = useRouter()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [cargando, setCargando] = useState(true)
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargarComentarios = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch(`/api/comentarios?numeroPedido=${encodeURIComponent(numeroPedido)}`)
      const data = await res.json()
      setComentarios(Array.isArray(data) ? data : [])
    } catch {
      setComentarios([])
    } finally {
      setCargando(false)
    }
  }, [numeroPedido])

  useEffect(() => {
    cargarComentarios()
  }, [cargarComentarios])

  async function agregarComentario() {
    if (!texto.trim() || guardando) return
    setGuardando(true)
    try {
      await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroPedido,
          tipoSalida,
          texto: texto.trim(),
          tipoNota: 'NOTA',
        }),
      })
      setTexto('')
      await cargarComentarios()
      router.refresh()
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarComentario(id: number) {
    await fetch(`/api/comentarios?id=${id}`, { method: 'DELETE' })
    setComentarios(prev => prev.filter(c => c.id !== id))
    router.refresh()
  }

  return (
    <div className="py-2 px-1">
      {cargando ? (
        <span className="text-xs text-gray-400">Cargando...</span>
      ) : (
        <>
          {/* Lista de comentarios */}
          {comentarios.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {comentarios.map(c => (
                <div
                  key={c.id}
                  className="flex items-start gap-2 text-xs bg-white rounded px-2 py-1.5 border border-gray-100"
                >
                  <span className="font-semibold shrink-0" style={{ color: '#2d6a8f' }}>
                    {c.usuario || '—'}
                  </span>
                  <span className="text-gray-400 shrink-0 text-[10px] pt-px">
                    {c.fechaComentario ? formatDate(c.fechaComentario) : ''}
                  </span>
                  <span className="text-gray-700 flex-1 leading-relaxed">{c.texto}</span>
                  <button
                    onClick={() => eliminarComentario(c.id)}
                    className="shrink-0 text-gray-300 hover:text-red-400 transition-colors text-[10px] pt-px"
                    title="Eliminar comentario"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {comentarios.length === 0 && (
            <p className="text-xs text-gray-400 italic mb-2">Sin comentarios — añade el primero</p>
          )}

          {/* Añadir comentario inline */}
          <div className="flex gap-1.5 items-center">
            <input
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') agregarComentario() }}
              placeholder="Nuevo comentario... (Enter para guardar)"
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-green-400 bg-white"
            />
            <button
              onClick={agregarComentario}
              disabled={guardando || !texto.trim()}
              className="text-xs px-3 py-1 rounded text-white font-semibold disabled:opacity-40 transition-opacity"
              style={{ background: '#2d9e4e' }}
            >
              {guardando ? '...' : 'Añadir'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Fila principal ────────────────────────────────────────────────────────────
export function PedidoRow({ pedido, cliente = '', stripe = false }: PedidoRowProps) {
  const [expandido, setExpandido] = useState(false)
  const bg = stripe ? '#fafcfa' : '#ffffff'

  return (
    <>
      <tr
        className="border-b border-gray-50 transition-colors duration-100"
        style={{ background: bg }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f0faf4')}
        onMouseLeave={e => (e.currentTarget.style.background = expandido ? '#f4fdf7' : bg)}
      >
        {/* Número — sticky col 1 */}
        <td
          className="px-3 py-2 whitespace-nowrap text-xs font-bold sticky left-0 z-10"
          style={{ background: 'inherit', color: '#1a5c35', minWidth: '120px', width: '120px' }}
        >
          <div className="flex items-center gap-1">
            <Link href={`/pedidos/${pedido.id}`} className="hover:underline underline-offset-2">
              {pedido.numeroPedido}
            </Link>
            {pedido.urgente === 'URGENTE' && (
              <span className="text-red-500" title="Urgente">🚨</span>
            )}

            {/* Badge comentarios — clickable para expandir */}
            <button
              onClick={() => setExpandido(v => !v)}
              className="inline-flex items-center justify-center rounded-full text-white font-bold transition-all"
              style={{
                fontSize: '9px',
                background: pedido.numComentarios > 0 ? '#f97316' : '#d1d5db',
                minWidth: '16px',
                width: '16px',
                height: '16px',
              }}
              title={
                pedido.numComentarios > 0
                  ? `${pedido.numComentarios} comentario${pedido.numComentarios > 1 ? 's' : ''} — clic para ver`
                  : 'Añadir comentario'
              }
            >
              {pedido.numComentarios > 0
                ? pedido.numComentarios > 9 ? '9+' : pedido.numComentarios
                : '💬'}
            </button>

            {/* Chevron indicador */}
            <span
              className="text-gray-400 transition-transform duration-200 cursor-pointer select-none"
              style={{
                fontSize: '8px',
                transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block',
              }}
              onClick={() => setExpandido(v => !v)}
            >
              ▼
            </span>
          </div>
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

      {/* ── Fila expandible de comentarios ── */}
      {expandido && (
        <tr style={{ background: '#f4fdf7' }}>
          <td
            colSpan={23}
            className="px-4 border-b border-green-100"
            style={{ borderLeft: '3px solid #2d9e4e' }}
          >
            <ComentariosInline
              numeroPedido={pedido.numeroPedido}
              tipoSalida={pedido.tipoSalida}
            />
          </td>
        </tr>
      )}
    </>
  )
}
