import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { isNotNull, or, isNull, eq } from 'drizzle-orm'
import { enviarEmailCargaMurcia } from '@/lib/email'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Pedidos terminados (fechaTerminado NOT NULL) sin fecha de carga en camión
    const lista = await db
      .select({
        numeroPedido:       pedidos.numeroPedido,
        categoria:          pedidos.categoria,
        referenciaProducto: pedidos.referenciaProducto,
        proveedor:          pedidos.proveedor,
        pdfAdjunto:         pedidos.pdfAdjunto,
      })
      .from(pedidos)
      .where(
        sql`${pedidos.fechaTerminado} IS NOT NULL
            AND ${pedidos.fechaTerminado} != ''
            AND (${pedidos.fechaCargaCamion} IS NULL OR ${pedidos.fechaCargaCamion} = '')`
      )
      .orderBy(pedidos.numeroPedido)

    if (lista.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No hay pedidos terminados pendientes de carga' },
        { status: 404 }
      )
    }

    await enviarEmailCargaMurcia(lista)

    return NextResponse.json({
      ok:      true,
      pedidos: lista.length,
      conPdf:  lista.filter(p => p.pdfAdjunto).length,
      mensaje: `Email enviado — ${lista.length} pedidos, ${lista.filter(p => p.pdfAdjunto).length} PDFs adjuntos`,
    })
  } catch (err: any) {
    console.error('Error carga-murcia email:', err)
    return NextResponse.json(
      { ok: false, error: err.message || 'Error desconocido' },
      { status: 500 }
    )
  }
}

// GET: preview de los pedidos sin enviar email
export async function GET() {
  try {
    const lista = await db
      .select({
        numeroPedido:       pedidos.numeroPedido,
        categoria:          pedidos.categoria,
        referenciaProducto: pedidos.referenciaProducto,
        proveedor:          pedidos.proveedor,
        pdfAdjunto:         pedidos.pdfAdjunto,
        fechaTerminado:     pedidos.fechaTerminado,
      })
      .from(pedidos)
      .where(
        sql`${pedidos.fechaTerminado} IS NOT NULL
            AND ${pedidos.fechaTerminado} != ''
            AND (${pedidos.fechaCargaCamion} IS NULL OR ${pedidos.fechaCargaCamion} = '')`
      )
      .orderBy(pedidos.numeroPedido)

    return NextResponse.json({ pedidos: lista, total: lista.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
