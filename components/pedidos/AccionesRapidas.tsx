'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TIPOS_INCIDENCIA = [
  'MATERIAL DEFECTUOSO',
  'FALTA MATERIAL',
  'DAÑO TRANSPORTE',
  'ERROR PEDIDO',
  'NO VIENE EN EL CAMION',
  'MAL LACADO',
  'OTRO',
]

interface AccionesRapidasProps {
  pedidoId: number
  numeroPedido: string
  tipoSalida?: string | null
}

export function AccionesRapidas({ pedidoId, numeroPedido, tipoSalida }: AccionesRapidasProps) {
  const router = useRouter()

  // ── Estado de modales ────────────────────────────────────────────────
  const [modal, setModal] = useState<null | 'comentario' | 'incidencia'>(null)
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)

  // ── Formulario comentario ────────────────────────────────────────────
  const [textoComentario, setTextoComentario] = useState('')

  // ── Formulario incidencia ────────────────────────────────────────────
  const [tipoInc, setTipoInc] = useState(TIPOS_INCIDENCIA[0])
  const [descInc, setDescInc] = useState('')

  // Cerrar modal con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function cerrar() {
    setModal(null)
    setTextoComentario('')
    setTipoInc(TIPOS_INCIDENCIA[0])
    setDescInc('')
    setOk(false)
    setLoading(false)
  }

  async function guardarComentario() {
    if (!textoComentario.trim()) return
    setLoading(true)
    try {
      await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroPedido, tipoSalida, texto: textoComentario.trim(), tipoNota: 'NOTA' }),
      })
      setOk(true)
      setTimeout(() => { cerrar(); router.refresh() }, 900)
    } finally {
      setLoading(false)
    }
  }

  async function guardarIncidencia() {
    setLoading(true)
    try {
      await fetch('/api/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroPedido,
          tipoSalida,
          tipoIncidencia: tipoInc,
          descripcion: descInc.trim() || null,
          estadoIncidencia: 'ABIERTA',
          fechaIncidencia: new Date().toISOString().split('T')[0],
        }),
      })
      setOk(true)
      setTimeout(() => { cerrar(); router.refresh() }, 900)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── 3 botones en la fila — sticky col 2 ── */}
      <td
        className="px-2 py-1.5 whitespace-nowrap sticky z-10"
        style={{ left: '120px', background: 'inherit', boxShadow: '2px 0 5px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-1">
          {/* Editar */}
          <Link
            href={`/pedidos/${pedidoId}/editar`}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{ background: '#e8f5e9', color: '#2d9e4e' }}
            title="Editar pedido"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>

          {/* Comentario */}
          <button
            onClick={() => setModal('comentario')}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{ background: '#e8f0fe', color: '#3b82f6' }}
            title="Añadir comentario"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Incidencia */}
          <button
            onClick={() => setModal('incidencia')}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{ background: '#fff3e0', color: '#f97316' }}
            title="Registrar incidencia"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
        </div>
      </td>

      {/* ── Modal comentario ── */}
      {modal === 'comentario' && (
        <ModalOverlay onClose={cerrar}>
          <h3 className="text-base font-bold text-gray-900 mb-1">💬 Añadir comentario</h3>
          <p className="text-xs text-gray-400 mb-3">Pedido <strong>{numeroPedido}</strong></p>
          {ok ? (
            <p className="text-green-600 font-semibold text-center py-4">✅ Comentario guardado</p>
          ) : (
            <>
              <textarea
                autoFocus
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ resize: 'none' }}
                placeholder="Escribe el comentario..."
                value={textoComentario}
                onChange={e => setTextoComentario(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) guardarComentario() }}
              />
              <p className="text-xs text-gray-400 mt-1">Ctrl+Enter para guardar</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={guardarComentario}
                  disabled={loading || !textoComentario.trim()}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: '#2d9e4e' }}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={cerrar} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold">
                  Cancelar
                </button>
              </div>
            </>
          )}
        </ModalOverlay>
      )}

      {/* ── Modal incidencia ── */}
      {modal === 'incidencia' && (
        <ModalOverlay onClose={cerrar}>
          <h3 className="text-base font-bold text-gray-900 mb-1">⚠️ Registrar incidencia</h3>
          <p className="text-xs text-gray-400 mb-3">Pedido <strong>{numeroPedido}</strong></p>
          {ok ? (
            <p className="text-orange-600 font-semibold text-center py-4">✅ Incidencia registrada</p>
          ) : (
            <>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de incidencia</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={tipoInc}
                  onChange={e => setTipoInc(e.target.value)}
                >
                  {TIPOS_INCIDENCIA.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
                <textarea
                  autoFocus
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ resize: 'none' }}
                  placeholder="Detalle adicional..."
                  value={descInc}
                  onChange={e => setDescInc(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={guardarIncidencia}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: '#f97316' }}
                >
                  {loading ? 'Guardando...' : 'Registrar'}
                </button>
                <button onClick={cerrar} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold">
                  Cancelar
                </button>
              </div>
            </>
          )}
        </ModalOverlay>
      )}
    </>
  )
}

// ── Modal overlay reutilizable ────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <td>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
          {children}
        </div>
      </div>
    </td>
  )
}
