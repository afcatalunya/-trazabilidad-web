import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pedidos, comentarios, incidencias, historial } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { calcularEstado } from '@/lib/utils'

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
    const pedidoId = parseInt(id)

    const result = await db
      .select()
      .from(pedidos)
      .where(eq(pedidos.id, pedidoId))
      .limit(1)

    const pedido = result[0] || null

    if (!pedido) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const comentariosResult = await db
      .select()
      .from(comentarios)
      .where(eq(comentarios.numeroPedido, pedido.numeroPedido))

    const incidenciasResult = await db
      .select()
      .from(incidencias)
      .where(eq(incidencias.numeroPedido, pedido.numeroPedido))

    return NextResponse.json({
      pedido,
      comentarios: comentariosResult,
      incidencias: incidenciasResult,
    })
  } catch (error) {
    console.error('Error fetching pedido:', error)
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
    const pedidoId = parseInt(id)
    const body = await req.json()

    const oldResult = await db
      .select()
      .from(pedidos)
      .where(eq(pedidos.id, pedidoId))
      .limit(1)

    const oldPedido = oldResult[0] || null

    if (!oldPedido) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const estado = calcularEstado({ ...oldPedido, ...body })

    // ── Máquina de estados: validar transiciones ilógicas ──────────────────────
    const rolUsuario = (session.user as any)?.rol
    if (rolUsuario !== 'ADMIN') {
      // ANULADO es estado final — solo ADMIN puede reactivar un pedido anulado
      if (oldPedido.estadoPedido === 'ANULADO' && estado !== 'ANULADO') {
        return NextResponse.json(
          { error: 'Un pedido ANULADO no puede reactivarse. Contacta con un administrador.' },
          { status: 400 }
        )
      }
      // ENTREGADO es estado final — solo ADMIN puede revertirlo (p.ej. para corregir una fecha errónea)
      if (oldPedido.estadoPedido === 'ENTREGADO' && estado !== 'ENTREGADO') {
        return NextResponse.json(
          { error: 'Un pedido ENTREGADO no puede revertirse. Contacta con un administrador.' },
          { status: 400 }
        )
      }
    }

    const result = await db
      .update(pedidos)
      .set({
        ...body,
        estadoPedido: estado,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(pedidos.id, pedidoId))
      .returning()

    const updatedPedido = result[0]

    if (updatedPedido) {
      await db.insert(historial).values({
        numeroPedido:  updatedPedido.numeroPedido,
        tipoSalida:    updatedPedido.tipoSalida,
        accion:        'ACTUALIZACION',
        detalle:       'Pedido actualizado',
        estadoAnterior: oldPedido.estadoPedido,
        estadoNuevo:   estado,
        usuario:       (session.user as any)?.name || (session.user as any)?.email || '',
      })

      // Auto-registrar incidencia cuando IncidenciaMaterial pasa a SÍ
      const incidenciaAnterior = (oldPedido.incidenciaMaterial || '').toUpperCase()
      const incidenciaNueva    = (body.incidenciaMaterial || '').toUpperCase()
      const activaIncidencia   = incidenciaNueva === 'SÍ' || incidenciaNueva === 'SI'
      const yaTeníaIncidencia  = incidenciaAnterior === 'SÍ' || incidenciaAnterior === 'SI'

      // Auto-borrar PDF de Vercel Blob cuando el pedido se marca ENTREGADO
      const estadoNuevoEntregado = estado === 'ENTREGADO'
      const estadoAnteriorEntregado = oldPedido.estadoPedido === 'ENTREGADO'
      if (estadoNuevoEntregado && !estadoAnteriorEntregado && updatedPedido.pdfAdjunto) {
        try {
          const { del } = await import('@vercel/blob')
          await del(updatedPedido.pdfAdjunto)
          // Limpiar la URL en BD
          await db.update(pedidos)
            .set({ pdfAdjunto: null })
            .where(eq(pedidos.id, pedidoId))
        } catch (blobErr) {
          console.warn('No se pudo borrar el PDF de Blob:', blobErr)
        }
      }

      if (activaIncidencia && !yaTeníaIncidencia) {
        // Usar el tipo enviado desde el formulario (tipoIncidenciaAuto), si no, tipo genérico
        const tipoIncidencia = (body.tipoIncidenciaAuto || 'INCIDENCIA MATERIAL').trim().toUpperCase()
        await db.insert(incidencias).values({
          numeroPedido:     updatedPedido.numeroPedido,
          tipoSalida:       updatedPedido.tipoSalida,
          tipoIncidencia,
          descripcion:      'Incidencia registrada automáticamente al marcar IncidenciaMaterial = SÍ',
          estadoIncidencia: 'ABIERTA',
          fechaIncidencia:  new Date().toISOString().split('T')[0],
        })
      }
    }

    return NextResponse.json(updatedPedido)
  } catch (error) {
    console.error('Error updating pedido:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if ((session.user as any)?.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const pedidoId = parseInt(id)

    // Obtener numeroPedido antes de borrar para limpiar datos relacionados
    const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, pedidoId)).limit(1)
    if (pedido?.numeroPedido) {
      await db.delete(comentarios).where(eq(comentarios.numeroPedido, pedido.numeroPedido))
      await db.delete(incidencias).where(eq(incidencias.numeroPedido, pedido.numeroPedido))
      await db.delete(historial).where(eq(historial.numeroPedido, pedido.numeroPedido))
    }

    await db.delete(pedidos).where(eq(pedidos.id, pedidoId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pedido:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
