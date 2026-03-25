import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'

// POST — sube un PDF y lo asocia al pedido
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idStr } = await params
  const id = parseInt(idStr)

  // Obtener pedido actual
  const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, id)).limit(1)
  if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('pdf') as File | null
  if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })

  // Borrar PDF anterior si existe
  if (pedido.pdfAdjunto) {
    try {
      const { del } = await import('@vercel/blob')
      await del(pedido.pdfAdjunto)
    } catch {
      // No falla si no se puede borrar el anterior
    }
  }

  // Subir nuevo PDF a Vercel Blob
  try {
    const { put } = await import('@vercel/blob')
    const buffer = Buffer.from(await file.arrayBuffer())
    const nombreArchivo = `pedidos/${pedido.numeroPedido || id}_${Date.now()}.pdf`
    const blob = await put(nombreArchivo, buffer, {
      access: 'public',
      contentType: 'application/pdf',
    })

    await db.update(pedidos)
      .set({ pdfAdjunto: blob.url })
      .where(eq(pedidos.id, id))

    return NextResponse.json({ ok: true, pdfAdjunto: blob.url })
  } catch (err: any) {
    console.error('Error subiendo PDF:', err)
    return NextResponse.json({ error: 'Error al subir el PDF: ' + err.message }, { status: 500 })
  }
}

// DELETE — elimina el PDF adjunto del pedido
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: idStr } = await params
  const id = parseInt(idStr)

  const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, id)).limit(1)
  if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  if (pedido.pdfAdjunto) {
    try {
      const { del } = await import('@vercel/blob')
      await del(pedido.pdfAdjunto)
    } catch {
      // Continuar aunque no se pueda borrar de Blob
    }
  }

  await db.update(pedidos)
    .set({ pdfAdjunto: null })
    .where(eq(pedidos.id, id))

  return NextResponse.json({ ok: true })
}
