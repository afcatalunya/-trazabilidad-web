import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { incidencias } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const estadoParam = req.nextUrl.searchParams.get('estado')

    let result
    if (estadoParam) {
      result = await db
        .select()
        .from(incidencias)
        .where(eq(incidencias.estadoIncidencia, estadoParam))
    } else {
      result = await db.select().from(incidencias)
    }

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
        numeroPedido:     body.numeroPedido || '',
        tipoSalida:       body.tipoSalida || null,
        fechaIncidencia:  body.fechaIncidencia || new Date().toISOString().split('T')[0],
        tipoIncidencia:   body.tipoIncidencia || null,
        descripcion:      body.descripcion || null,
        estadoIncidencia: body.estadoIncidencia || 'ABIERTA',
        comentarios:      body.comentarios || null,
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
