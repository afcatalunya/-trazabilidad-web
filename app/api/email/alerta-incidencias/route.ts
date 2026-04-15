import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { incidencias } from '@/lib/schema'
import { ne } from 'drizzle-orm'
import { isCronOrAdmin } from '@/lib/cron-auth'

const DIAS_SIN_CAMBIO = 5

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!(await isCronOrAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const abiertas = await db
      .select()
      .from(incidencias)
      .where(ne(incidencias.estadoIncidencia, 'CERRADA'))

    const ahora = new Date()
    const limiteMs = DIAS_SIN_CAMBIO * 24 * 60 * 60 * 1000

    const paradas = abiertas
      .filter(inc => {
        const referencia = inc.ultimoCambioEstado || inc.createdAt
        if (!referencia) return false
        return (ahora.getTime() - new Date(referencia).getTime()) > limiteMs
      })
      .map(inc => {
        const referencia = inc.ultimoCambioEstado || inc.createdAt || ''
        const diasParada = referencia
          ? Math.floor((ahora.getTime() - new Date(referencia).getTime()) / (1000 * 60 * 60 * 24))
          : 0
        return { ...inc, diasParada }
      })

    if (paradas.length === 0) {
      return NextResponse.json({ ok: true, mensaje: 'No hay incidencias paradas', enviado: false })
    }

    const { enviarAlertaIncidenciasParadas } = await import('@/lib/email')
    await enviarAlertaIncidenciasParadas(paradas)

    return NextResponse.json({ ok: true, incidencias: paradas.length, enviado: true })
  } catch (error) {
    console.error('Error alerta incidencias:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
