import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { not, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function POST() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pedidos que NO están entregados ni anulados
    const activos = await db
      .select()
      .from(pedidos)
      .where(not(inArray(pedidos.estadoPedido, ['ENTREGADO', 'ANULADO'])))
      .orderBy(pedidos.estadoPedido)

    const { enviarInformeSemanal } = await import('@/lib/email')
    await enviarInformeSemanal(activos)

    return NextResponse.json({ ok: true, enviados: activos.length })
  } catch (error: any) {
    console.error('Error informe semanal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
