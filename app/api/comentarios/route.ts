import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comentarios, pedidos } from '@/lib/schema'
import { eq, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'

// Recalcula y actualiza numComentarios en la tabla pedidos
async function syncNumComentarios(numeroPedido: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(comentarios)
    .where(eq(comentarios.numeroPedido, numeroPedido))

  await db
    .update(pedidos)
    .set({ numComentarios: total })
    .where(eq(pedidos.numeroPedido, numeroPedido))
}

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

    // Actualizar contador en pedidos
    await syncNumComentarios(body.numeroPedido)

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating comentario:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(req.nextUrl.searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Obtener el numeroPedido antes de borrar
    const [com] = await db.select().from(comentarios).where(eq(comentarios.id, id)).limit(1)
    if (!com) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.delete(comentarios).where(eq(comentarios.id, id))

    // Actualizar contador
    await syncNumComentarios(com.numeroPedido)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting comentario:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
