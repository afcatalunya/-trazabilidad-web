import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { not, inArray } from 'drizzle-orm'
import { isCronOrAdmin } from '@/lib/cron-auth'

export async function POST(req: NextRequest) {
  if (!(await isCronOrAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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

// GET para cron-job.org (algunos servicios usan GET)
export async function GET(req: NextRequest) {
  return POST(req)
}
