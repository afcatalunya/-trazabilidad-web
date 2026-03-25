'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PedidoForm } from '@/components/pedidos/PedidoForm'
import { Pedido } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Cliente {
  id: number
  nombre: string
}

// ─── Sección PDF adjunto ──────────────────────────────────────────────────────
function PdfAdjuntoSection({ pedidoId, pdfInicial }: { pedidoId: string; pdfInicial: string | null }) {
  const [pdfUrl, setPdfUrl]     = useState<string | null>(pdfInicial)
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const fileRef                 = useRef<HTMLInputElement>(null)

  const mostrarMsg = (tipo: 'ok' | 'error', texto: string) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 5000)
  }

  const subirPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      mostrarMsg('error', 'Solo se aceptan archivos PDF')
      return
    }
    setLoading(true)
    const fd = new FormData()
    fd.append('pdf', file)
    const res = await fetch(`/api/pedidos/${pedidoId}/pdf`, { method: 'POST', body: fd })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setPdfUrl(data.pdfAdjunto)
      mostrarMsg('ok', '✅ PDF subido correctamente')
    } else {
      mostrarMsg('error', data.error || 'Error al subir el PDF')
    }
    // Reset input para permitir subir el mismo archivo otra vez
    if (fileRef.current) fileRef.current.value = ''
  }

  const borrarPdf = async () => {
    if (!confirm('¿Eliminar el PDF adjunto de este pedido?')) return
    setLoading(true)
    const res = await fetch(`/api/pedidos/${pedidoId}/pdf`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      setPdfUrl(null)
      mostrarMsg('ok', 'PDF eliminado')
    } else {
      mostrarMsg('error', 'Error al eliminar el PDF')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-base font-bold text-gray-900 mb-1">📄 Orden de Trabajo (PDF adjunto)</h2>
      <p className="text-sm text-gray-500 mb-4">
        Este PDF se adjuntará automáticamente en el email de Carga Camión Murcia.
      </p>

      {pdfUrl ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-700 text-lg">✅</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">PDF adjunto guardado</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline break-all"
            >
              Ver PDF actual →
            </a>
          </div>
          <div className="flex gap-2">
            <label className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition
              ${loading ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {loading ? '⏳ Subiendo...' : '🔄 Reemplazar'}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                disabled={loading}
                onChange={subirPdf}
              />
            </label>
            <button
              onClick={borrarPdf}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
          <span className="text-gray-400 text-lg">📎</span>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Sin PDF adjunto</p>
            <p className="text-xs text-gray-400">Adjunta la orden de trabajo para que se incluya en los emails de Carga Murcia</p>
          </div>
          <label className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition
            ${loading ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {loading ? '⏳ Subiendo...' : '📄 Adjuntar PDF'}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={loading}
              onChange={subirPdf}
            />
          </label>
        </div>
      )}

      {msg && (
        <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
          msg.tipo === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {msg.texto}
        </div>
      )}
    </div>
  )
}

// ─── Página editar pedido ─────────────────────────────────────────────────────
export default function EditarPedidoPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [pedido, setPedido]   = useState<Pedido | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pedidoRes, clientesRes] = await Promise.all([
          fetch(`/api/pedidos/${id}`),
          fetch('/api/clientes'),
        ])
        const pedidoData  = await pedidoRes.json()
        const clientesData = await clientesRes.json()
        setPedido(pedidoData.pedido)
        setClientes(clientesData)
      } catch (error) {
        console.error('Error fetching data:', error)
        alert('Error al cargar los datos')
        router.push('/pedidos')
      }
    }
    fetchData()
  }, [id, router])

  const handleSubmit = async (data: Partial<Pedido>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error al actualizar el pedido')
      router.push(`/pedidos/${id}`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el pedido')
      setLoading(false)
    }
  }

  if (!pedido) {
    return (
      <>
        <Header title="Cargando..." />
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <p className="text-gray-500">Cargando pedido...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={`Editar Pedido ${pedido.numeroPedido}`} />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Sección PDF — independiente del formulario principal */}
          <PdfAdjuntoSection
            pedidoId={id}
            pdfInicial={(pedido as any).pdfAdjunto ?? null}
          />

          <div className="bg-white rounded-lg shadow p-6">
            <PedidoForm
              pedido={pedido}
              clientes={clientes}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </>
  )
}
