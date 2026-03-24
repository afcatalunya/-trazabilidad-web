'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'

interface Movimiento {
  id: number
  numeroPedido: string
  tipoSalida?: string
  fechaMovimiento: string
  usuario?: string
  accion?: string
  detalle?: string
  estadoAnterior?: string
  estadoNuevo?: string
}

const ACCION_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CREACION:          { color: '#16a34a', bg: '#f0fdf4', label: 'Creación' },
  ACTUALIZACION:     { color: '#2563eb', bg: '#eff6ff', label: 'Actualización' },
  CAMBIO_ESTADO:     { color: '#9333ea', bg: '#faf5ff', label: 'Cambio estado' },
  INCIDENCIA:        { color: '#dc2626', bg: '#fef2f2', label: 'Incidencia' },
  COMENTARIO:        { color: '#d97706', bg: '#fffbeb', label: 'Comentario' },
}

function AccionBadge({ accion }: { accion: string }) {
  const cfg = ACCION_CONFIG[accion] || { color: '#6b7280', bg: '#f9fafb', label: accion }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}

export default function HistorialPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [accionFiltro, setAccionFiltro] = useState('')

  useEffect(() => {
    fetch('/api/historial')
      .then(r => r.json())
      .then(data => { setMovimientos(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = movimientos.filter(m => {
    const matchSearch = !search ||
      m.numeroPedido?.toLowerCase().includes(search.toLowerCase()) ||
      m.usuario?.toLowerCase().includes(search.toLowerCase()) ||
      m.detalle?.toLowerCase().includes(search.toLowerCase())
    const matchAccion = !accionFiltro || m.accion === accionFiltro
    return matchSearch && matchAccion
  })

  return (
    <>
      <Header title="Historial de Movimientos" />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Filtros */}
          <div className="flex gap-3 mb-5">
            <input
              type="text"
              placeholder="Buscar por pedido, usuario, detalle..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            <select
              value={accionFiltro}
              onChange={e => setAccionFiltro(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none"
            >
              <option value="">Todas las acciones</option>
              {Object.entries(ACCION_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <span className="self-center text-sm text-gray-500 whitespace-nowrap">
              {filtered.length} registros
            </span>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-gray-400">Cargando historial...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">No hay registros</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr style={{ background: '#f8faf9' }}>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedido</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Detalle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {m.fechaMovimiento
                            ? new Date(m.fechaMovimiento).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/pedidos?search=${m.numeroPedido}`}
                            className="text-sm font-semibold text-green-700 hover:text-green-900 hover:underline"
                          >
                            {m.numeroPedido}
                          </Link>
                          {m.tipoSalida && (
                            <span className="ml-1 text-xs text-gray-400">({m.tipoSalida})</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <AccionBadge accion={m.accion || ''} />
                        </td>
                        <td className="px-4 py-3">
                          {m.estadoAnterior || m.estadoNuevo ? (
                            <div className="flex items-center gap-1 text-xs">
                              {m.estadoAnterior && (
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{m.estadoAnterior}</span>
                              )}
                              {m.estadoAnterior && m.estadoNuevo && (
                                <span className="text-gray-400">→</span>
                              )}
                              {m.estadoNuevo && (
                                <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700">{m.estadoNuevo}</span>
                              )}
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {m.detalle || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {m.usuario || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
