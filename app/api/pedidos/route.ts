import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos, historial, clientes } from '@/lib/schema'
import { like, and, eq, or, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { calcularEstado } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const search    = searchParams.get('search') || ''
    const estado    = searchParams.get('estado') || ''
    const almacen   = searchParams.get('almacen') || ''
    const categoria = searchParams.get('categoria') || ''
    const urgente   = searchParams.get('urgente')
    const page      = parseInt(searchParams.get('page') || '1')
    const limit     = 50
    const offset    = (page - 1) * limit

    const conditions: any[] = []

    if (search) {
      conditions.push(
        or(
          like(pedidos.numeroPedido, `%${search}%`),
          like(pedidos.cliente, `%${search}%`),
          like(pedidos.numeroCliente, `%${search}%`)
        )
      )
    }

    if (estado)    conditions.push(eq(pedidos.estadoPedido, estado))
    if (almacen)   conditions.push(eq(pedidos.almacen, almacen))
    if (categoria) conditions.push(eq(pedidos.categoria, categoria))
    if (urgente === 'true') conditions.push(eq(pedidos.urgente, 'URGENTE'))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const result = await db
      .select()
      .from(pedidos)
      .where(where)
      .orderBy(pedidos.createdAt)
      .limit(limit)
      .offset(offset)

    const [{ total: totalCount }] = await db
      .select({ total: count() })
      .from(pedidos)
      .where(where)

    return NextResponse.json({
      data: result,
      total: totalCount,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error fetching pedidos:', error)
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
    const estado = calcularEstado(body)

    const result = await db
      .insert(pedidos)
      .values({
        ...body,
        estadoPedido: estado,
      })
      .returning()

    const newPedido = result[0]

    if (newPedido) {
      await db.insert(historial).values({
        numeroPedido: newPedido.numeroPedido,
        tipoSalida:   newPedido.tipoSalida,
        accion:       'CREACION',
        detalle:      'Pedido creado',
        estadoNuevo:  estado,
        usuario:      (session.user as any)?.name || (session.user as any)?.email || '',
      })
    }

    // Auto-registrar cliente nuevo si no existe en la tabla clientes
    if (newPedido?.cliente && newPedido?.numeroCliente) {
      try {
        await db.insert(clientes).values({
          numeroCliente:   newPedido.numeroCliente,
          nombreCliente:   newPedido.cliente,
          codigoComercial: newPedido.codigoComercial || null,
        }).onConflictDoNothing()
      } catch {
        // Si ya existe, ignorar silenciosamente
      }
    }

    // Automatización 1: email al crear pedido (import dinámico para no romper compilación)
    if (newPedido) {
      import('@/lib/email').then(({ enviarEmailNuevoPedido }) =>
        enviarEmailNuevoPedido(newPedido).catch(err =>
          console.error('Error enviando email nuevo pedido:', err)
        )
      ).catch(() => {})
    }

    return NextResponse.json(newPedido, { status: 201 })
  } catch (error) {
    console.error('Error creating pedido:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
