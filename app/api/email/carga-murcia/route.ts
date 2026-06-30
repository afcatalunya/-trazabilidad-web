import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { isNotNull, or, isNull, eq } from 'drizzle-orm'
import { enviarEmailCargaMurcia } from '@/lib/email'
import { sql } from 'drizzle-orm'
import { autorizadoCrmOWeb } from '@/lib/internal-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // v22.36.9 (C1) + v22.37 (fix): sesión web O clave interna del CRM de escritorio.
  if (!(await autorizadoCrmOWeb(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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
            AND (${pedidos.fechaCargaCamion} IS NULL OR ${pedidos.fechaCargaCamion} = '')
            AND (${pedidos.proveedor} IS NULL OR ${pedidos.proveedor} != 'STOCK VALENCIA')
            AND (${pedidos.origenMaterial} IS NULL OR ${pedidos.origenMaterial} != 'STOCK VALENCIA')`
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
export async function GET(req: Request) {
  if (!(await autorizadoCrmOWeb(req))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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
            AND (${pedidos.fechaCargaCamion} IS NULL OR ${pedidos.fechaCargaCamion} = '')
            AND (${pedidos.proveedor} IS NULL OR ${pedidos.proveedor} != 'STOCK VALENCIA')
            AND (${pedidos.origenMaterial} IS NULL OR ${pedidos.origenMaterial} != 'STOCK VALENCIA')`
      )
      .orderBy(pedidos.numeroPedido)

    return NextResponse.json({ pedidos: lista, total: lista.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
