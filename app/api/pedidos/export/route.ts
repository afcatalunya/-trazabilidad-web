/**
 * GET /api/pedidos/export
 * Exporta la lista de pedidos como CSV (abre en Excel directamente).
 * Respeta los mismos filtros que la página principal:
 *   ?search=&estado=&almacen=&categoria=&urgente=&vista=activos|todos
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos } from '@/lib/schema'
import { like, and, eq, or, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'

const ESTADOS_INACTIVOS = ['EN ALMACÉN', 'ENTREGADO', 'ANULADO']

// Escapa un valor para CSV (envuelve en comillas si contiene coma, comilla o salto)
function csvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp       = req.nextUrl.searchParams
    const search   = sp.get('search')   || ''
    const estado   = sp.get('estado')   || ''
    const almacen  = sp.get('almacen')  || ''
    const categoria = sp.get('categoria') || ''
    const urgente  = sp.get('urgente')
    const vista    = sp.get('vista')    || 'activos'

    const conditions: ReturnType<typeof eq>[] = []

    if (search) {
      conditions.push(
        or(
          like(pedidos.numeroPedido,      `%${search}%`),
          like(pedidos.cliente,            `%${search}%`),
          like(pedidos.numeroCliente,      `%${search}%`),
          like(pedidos.proveedor,          `%${search}%`),
          like(pedidos.referenciaProducto, `%${search}%`),
          like(pedidos.tipoSalida,         `%${search}%`),
        ) as any
      )
    }
    if (estado)    conditions.push(eq(pedidos.estadoPedido, estado) as any)
    if (almacen)   conditions.push(eq(pedidos.almacen, almacen) as any)
    if (categoria) conditions.push(eq(pedidos.categoria, categoria) as any)
    if (urgente === 'true') conditions.push(eq(pedidos.urgente, 'URGENTE') as any)

    const vistaActiva = vista !== 'todos' && !estado
    if (vistaActiva) {
      conditions.push(
        sql`COALESCE(${pedidos.estadoPedido}, '') NOT IN (${sql.join(
          ESTADOS_INACTIVOS.map(e => sql`${e}`), sql`, `
        )})` as any
      )
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select()
      .from(pedidos)
      .where(where)
      .orderBy(pedidos.createdAt)
      .limit(5000)   // límite de seguridad

    // Cabecera CSV
    const headers = [
      'Nº Pedido', 'Tipo Salida', 'F.Pedido', 'Nº Cliente', 'Comercial',
      'Cliente', 'Categoría', 'Referencia', 'Acabado', 'Color',
      'Proveedor', 'Doc.Salida', 'F.Salida', 'F.Planning', 'F.Terminado',
      'F.Camión', 'F.Tarragona', 'F.Entrega', 'Estado', 'Incidencia',
      'Almacén', 'Urgente', 'Nº Comentarios', 'Creado',
    ]

    const csvLines: string[] = [headers.join(',')]

    for (const p of rows) {
      csvLines.push([
        csvCell(p.numeroPedido),
        csvCell(p.tipoSalida),
        csvCell(p.fechaPedido),
        csvCell(p.numeroCliente),
        csvCell(p.codigoComercial),
        csvCell(p.cliente),
        csvCell(p.categoria),
        csvCell(p.referenciaProducto),
        csvCell(p.acabado),
        csvCell(p.color),
        csvCell(p.proveedor),
        csvCell(p.docSalida),
        csvCell(p.fechaSalida),
        csvCell(p.fechaPlanning),
        csvCell(p.fechaTerminado),
        csvCell(p.fechaCargaCamion),
        csvCell(p.fechaEnTarragona),
        csvCell(p.fechaEntregaCliente),
        csvCell(p.estadoPedido),
        csvCell(p.incidenciaMaterial),
        csvCell(p.almacen),
        csvCell(p.urgente),
        csvCell(p.numComentarios),
        csvCell(p.createdAt),
      ].join(','))
    }

    // BOM UTF-8 para que Excel abra los acentos correctamente
    const bom = '\uFEFF'
    const csv = bom + csvLines.join('\r\n')

    const fecha = new Date().toISOString().slice(0, 10)
    const filename = `pedidos_${fecha}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exportando pedidos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
