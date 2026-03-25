import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { isNotNull, isNull, and } from 'drizzle-orm'
import { isCronOrAdmin } from '@/lib/cron-auth'

export async function POST(req: NextRequest) {
  if (!(await isCronOrAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const terminadosSinLlegar = await db
      .select()
      .from(pedidos)
      .where(
        and(
          isNotNull(pedidos.fechaTerminado),
          isNull(pedidos.fechaEnTarragona)
        )
      )

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

export async function GET(req: NextRequest) {
  return POST(req)
}
