import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { usuarios, historial } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { eq, desc, like } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// GET — info de todos los usuarios (sin exponer hashes completos)
export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await db.select().from(usuarios)

  const resultado = users.map(u => ({
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    activo: u.activo,
    fechaCreacion: u.fechaCreacion,
    fechaActualizacion: u.fechaActualizacion,
    tienePassword: !!u.password && u.password.startsWith('$2'),
    hashPreview: u.password ? u.password.substring(0, 7) + '...' : 'VACÍO',
  }))

  // Historial de cambios de contraseña
  const cambios = await db
    .select()
    .from(historial)
    .where(like(historial.numeroPedido, 'ADMIN:USUARIO:%'))
    .orderBy(desc(historial.fecha))
    .limit(20)

  return NextResponse.json({ usuarios: resultado, historialPasswords: cambios })
}

// POST — verificar credenciales de un usuario sin hacer login real
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 })
  }

  const result = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1)
  const user = result[0]

  if (!user) {
    return NextResponse.json({ ok: false, motivo: 'Usuario no encontrado en BD' })
  }

  if (!user.activo) {
    return NextResponse.json({ ok: false, motivo: 'Usuario INACTIVO — no puede iniciar sesión' })
  }

  if (!user.password || !user.password.startsWith('$2')) {
    return NextResponse.json({ ok: false, motivo: 'El hash de contraseña no es válido (no es bcrypt)' })
  }

  const valid = await bcrypt.compare(password, user.password)

  return NextResponse.json({
    ok: valid,
    motivo: valid
      ? `✅ Credenciales correctas — "${user.nombre}" puede iniciar sesión`
      : '❌ Contraseña incorrecta — el hash en BD no coincide',
    usuario: {
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
      activo: user.activo,
      fechaActualizacion: user.fechaActualizacion,
    },
  })
}
