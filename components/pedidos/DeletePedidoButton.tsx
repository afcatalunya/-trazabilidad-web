'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeletePedidoButton({ pedidoId, numeroPedido }: { pedidoId: number; numeroPedido: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/pedidos')
      router.refresh()
    } catch {
      alert('Error al eliminar el pedido')
      setLoading(false)
    }
  }

  if (confirm) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
        <p className="text-xs text-red-700 font-medium">¿Eliminar {numeroPedido}? Esta acción no se puede deshacer.</p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 text-xs py-1.5 px-3 rounded bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="flex-1 text-xs py-1.5 px-3 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="w-full text-sm py-2 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
    >
      🗑️ Eliminar Pedido
    </button>
  )
}
