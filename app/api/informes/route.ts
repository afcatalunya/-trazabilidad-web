import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allPedidos = await db.select().from(pedidos)

    const estadoCounts: Record<string, number> = {
      'SIN PEDIDO DE COMPRA': 0,
      'EN PROCESO': 0,
      'PLANNING': 0,
      'PARA CARGAR MURCIA': 0,
      'EN CAMION': 0,
      'EN ALMACÉN': 0,
      'ENTREGADO': 0,
      'ANULADO': 0,
    }

    allPedidos.forEach((p) => {
      const estado = p.estadoPedido || 'SIN PEDIDO DE COMPRA'
      if (estadoCounts.hasOwnProperty(estado)) {
        estadoCounts[estado]++
      }
    })

    // Pedidos por cliente (agrupados en memoria)
    const clienteMap: Record<string, number> = {}
    allPedidos.forEach((p) => {
      const nombre = p.cliente || 'Sin cliente'
      clienteMap[nombre] = (clienteMap[nombre] || 0) + 1
    })
    const pedidosPorCliente = Object.entries(clienteMap)
      .map(([cliente, total]) => ({ cliente, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)

    const urgentesActivos = allPedidos.filter(
      (p) => p.urgente === 'URGENTE' && p.estadoPedido !== 'ENTREGADO' && p.estadoPedido !== 'ANULADO'
    ).length

    return NextResponse.json({
      estadoCounts,
      pedidosPorCliente,
      urgentesActivos,
      totalPedidos: allPedidos.length,
    })
  } catch (error) {
    console.error('Error fetching informes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
