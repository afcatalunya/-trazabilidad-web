import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { incidencias } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const incidenciaId = parseInt(id)

    const result = await db
      .select()
      .from(incidencias)
      .where(eq(incidencias.id, incidenciaId))
      .limit(1)

    const incidencia = result[0] || null

    if (!incidencia) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(incidencia)
  } catch (error) {
    console.error('Error fetching incidencia:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const incidenciaId = parseInt(id)
    const body = await req.json()

    // Obtener estado actual para detectar cambio
    const [actual] = await db.select().from(incidencias).where(eq(incidencias.id, incidenciaId)).limit(1)
    const cambioEstado = actual && body.estadoIncidencia && body.estadoIncidencia !== actual.estadoIncidencia

    const result = await db
      .update(incidencias)
      .set({
        tipoIncidencia:      body.tipoIncidencia,
        descripcion:         body.descripcion,
        estadoIncidencia:    body.estadoIncidencia,
        fechaResolucion:     body.fechaResolucion ?? null,
        comentarios:         body.comentarios,
        accionesRealizadas:  body.accionesRealizadas ?? null,
        // Solo actualiza ultimoCambioEstado si el estado cambió
        ...(cambioEstado ? { ultimoCambioEstado: new Date().toISOString() } : {}),
        updatedAt:           new Date().toISOString(),
      })
      .where(eq(incidencias.id, incidenciaId))
      .returning()

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating incidencia:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
