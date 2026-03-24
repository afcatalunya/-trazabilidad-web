import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clientes } from '@/lib/schema'
import { like } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const search = req.nextUrl.searchParams.get('search') || ''

    let result
    if (search) {
      result = await db
        .select()
        .from(clientes)
        .where(like(clientes.nombreCliente, `%${search}%`))
    } else {
      result = await db.select().from(clientes)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching clientes:', error)
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
      .insert(clientes)
      .values({
        numeroCliente:   body.numeroCliente || body.numero_cliente || '',
        nombreCliente:   body.nombreCliente || body.nombre || '',
        codigoComercial: body.codigoComercial || null,
        contacto:        body.contacto || null,
        telefono:        body.telefono || null,
        email:           body.email || null,
        activo:          1,
      })
      .returning()

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating cliente:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
