import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { usuarios } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      rol: usuarios.rol,
      activo: usuarios.activo,
      fechaCreacion: usuarios.fechaCreacion,
    })
    .from(usuarios)
    .orderBy(usuarios.nombre)

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { nombre, email, password, rol } = await req.json()

  if (!nombre || !email || !password) {
    return NextResponse.json({ error: 'Nombre, email y contraseña son obligatorios' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)

  try {
    const result = await db.insert(usuarios).values({
      nombre,
      email,
      password: hashed,
      rol: rol || 'USUARIO',
      activo: 1,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    }).returning({ id: usuarios.id, nombre: usuarios.nombre, email: usuarios.email, rol: usuarios.rol })

    return NextResponse.json(result[0], { status: 201 })
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
