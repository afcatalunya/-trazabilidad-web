'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PedidoForm } from '@/components/pedidos/PedidoForm'
import { Pedido } from '@/lib/utils'

interface PageProps {
  params: { id: string }
}

interface Cliente {
  id: number
  nombre: string
}

export default function EditarPedidoPage({ params }: PageProps) {
  const router = useRouter()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pedidoRes, clientesRes] = await Promise.all([
          fetch(`/api/pedidos/${params.id}`),
          fetch('/api/clientes'),
        ])

        const pedidoData = await pedidoRes.json()
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
  }, [params.id, router])

  const handleSubmit = async (data: Partial<Pedido>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pedidos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error('Error al actualizar el pedido')
      }

      router.push(`/pedidos/${params.id}`)
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
