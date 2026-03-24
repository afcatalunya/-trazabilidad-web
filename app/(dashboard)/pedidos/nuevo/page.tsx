'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PedidoForm } from '@/components/pedidos/PedidoForm'
import { Pedido } from '@/lib/utils'
import { useEffect } from 'react'

interface Cliente {
  id: number
  nombre: string
}

export default function NuevoPedidoPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch('/api/clientes')
        const data = await res.json()
        setClientes(data)
      } catch (error) {
        console.error('Error fetching clientes:', error)
      }
    }

    fetchClientes()
  }, [])

  const handleSubmit = async (data: Partial<Pedido>) => {
    setLoading(true)
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error('Error al crear el pedido')
      }

      router.push('/pedidos')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el pedido')
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Nuevo Pedido" />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="bg-white rounded-lg shadow p-6">
            <PedidoForm
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
