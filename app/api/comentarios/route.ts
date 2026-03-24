import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comentarios } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const numeroPedido = req.nextUrl.searchParams.get('numeroPedido')

    let result
    if (numeroPedido) {
      result = await db
        .select()
        .from(comentarios)
        .where(eq(comentarios.numeroPedido, numeroPedido))
    } else {
      result = await db.select().from(comentarios)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching comentarios:', error)
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
      .insert(comentarios)
      .values({
        numeroPedido: body.numeroPedido,
        tipoSalida:   body.tipoSalida || null,
        texto:        body.texto,
        tipoNota:     body.tipoNota || 'NOTA',
        usuario:      (session.user as any)?.name || (session.user as any)?.email || '',
      })
      .returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating comentario:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
