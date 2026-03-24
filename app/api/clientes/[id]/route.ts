import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clientes } from '@/lib/schema'
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
    const clienteId = parseInt(id)

    const result = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, clienteId))
      .limit(1)

    const cliente = result[0] || null

    if (!cliente) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error fetching cliente:', error)
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
    const clienteId = parseInt(id)
    const body = await req.json()

    // Only allow valid columns
    const allowedFields: any = {}
    if (body.nombreCliente !== undefined)   allowedFields.nombreCliente   = body.nombreCliente
    if (body.codigoComercial !== undefined)  allowedFields.codigoComercial  = body.codigoComercial
    if (body.contacto !== undefined)         allowedFields.contacto         = body.contacto
    if (body.telefono !== undefined)         allowedFields.telefono         = body.telefono
    if (body.email !== undefined)            allowedFields.email            = body.email
    if (body.activo !== undefined)           allowedFields.activo           = body.activo

    const result = await db
      .update(clientes)
      .set(allowedFields)
      .where(eq(clientes.id, clienteId))
      .returning()

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating cliente:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
