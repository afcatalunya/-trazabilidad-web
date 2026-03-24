import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { isNotNull, isNull, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function POST() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pedidos con FechaTerminado rellena pero FechaEnTarragona vacía
    const terminadosSinLlegar = await db
      .select()
      .from(pedidos)
      .where(
        and(
          isNotNull(pedidos.fechaTerminado),
          isNull(pedidos.fechaEnTarragona)
        )
      )

    // Filtrado adicional en JS para mayor seguridad
    const filtrados = terminadosSinLlegar.filter(
      p => p.fechaTerminado && !p.fechaEnTarragona && p.estadoPedido !== 'ANULADO'
    )

    const { enviarAlertaTerminadosSinCamion } = await import('@/lib/email')
    await enviarAlertaTerminadosSinCamion(filtrados)

    return NextResponse.json({ ok: true, pedidos: filtrados.length })
  } catch (error: any) {
    console.error('Error alerta terminados:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
