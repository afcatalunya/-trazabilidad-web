import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { isNull, and, ne, or, isNotNull } from 'drizzle-orm'
import { auth } from '@/lib/auth'

const DIAS_LIMITE = 3

export async function POST() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pedidos SIN FechaSalida, no anulados, no entregados
    const sinSalida = await db
      .select()
      .from(pedidos)
      .where(
        and(
          isNull(pedidos.fechaSalida),
          isNotNull(pedidos.fechaPedido),
          ne(pedidos.estadoPedido, 'ANULADO'),
          ne(pedidos.estadoPedido, 'ENTREGADO'),
        )
      )

    // Filtrar los que llevan más de DIAS_LIMITE días desde la fecha de pedido
    const hoy = Date.now()
    const filtrados = sinSalida
      .filter(p => {
        if (!p.fechaPedido) return false
        const diasEspera = Math.floor((hoy - new Date(p.fechaPedido).getTime()) / 86400000)
        return diasEspera > DIAS_LIMITE
      })
      .map(p => ({
        ...p,
        diasEspera: Math.floor((hoy - new Date(p.fechaPedido!).getTime()) / 86400000),
      }))
      .sort((a, b) => b.diasEspera - a.diasEspera)

    const { enviarAlertaSinSalida } = await import('@/lib/email')
    await enviarAlertaSinSalida(filtrados)

    return NextResponse.json({ ok: true, pedidos: filtrados.length })
  } catch (error: any) {
    console.error('Error alerta sin salida:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
