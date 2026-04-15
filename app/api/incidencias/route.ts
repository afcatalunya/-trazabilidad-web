import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { incidencias, pedidos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const estadoParam = req.nextUrl.searchParams.get('estado')

    const query = db
      .select({
        id:                incidencias.id,
        numeroPedido:      incidencias.numeroPedido,
        tipoSalida:        incidencias.tipoSalida,
        fechaIncidencia:   incidencias.fechaIncidencia,
        tipoIncidencia:    incidencias.tipoIncidencia,
        descripcion:       incidencias.descripcion,
        estadoIncidencia:  incidencias.estadoIncidencia,
        fechaResolucion:   incidencias.fechaResolucion,
        comentarios:       incidencias.comentarios,
        createdAt:         incidencias.createdAt,
        pedidoId:          pedidos.id,
      })
      .from(incidencias)
      .leftJoin(pedidos, eq(incidencias.numeroPedido, pedidos.numeroPedido))

    const result = estadoParam
      ? await query.where(eq(incidencias.estadoIncidencia, estadoParam))
      : await query

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching incidencias:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const result = await db
      .insert(incidencias)
      .values({
        numeroPedido:       body.numeroPedido || '',
        tipoSalida:         body.tipoSalida || null,
        fechaIncidencia:    body.fechaIncidencia || new Date().toISOString().split('T')[0],
        tipoIncidencia:     body.tipoIncidencia || null,
        descripcion:        body.descripcion || null,
        estadoIncidencia:   body.estadoIncidencia || 'ABIERTA',
        comentarios:        body.comentarios || null,
        foto:               body.foto || null,
        accionesRealizadas: body.accionesRealizadas || null,
        ultimoCambioEstado: new Date().toISOString(),
      })
      .returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating incidencia:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
