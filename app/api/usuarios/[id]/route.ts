import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { usuarios, historial } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any)?.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { nombre, rol, activo, password } = await req.json()
  const { id: idStr } = await params
  const id = parseInt(idStr)
  const adminUser = (session.user as any)?.name || (session.user as any)?.email || 'ADMIN'

  const updates: any = {
    nombre,
    rol,
    activo: activo ? 1 : 0,
    fechaActualizacion: new Date().toISOString(),
  }

  if (password) {
    updates.password = await bcrypt.hash(password, 10)
    // Registrar cambio de contraseña en historial para auditoría
    await db.insert(historial).values({
      numeroPedido: `ADMIN:USUARIO:${id}`,   // prefijo para distinguir de pedidos
      accion:       'CAMBIO_CONTRASEÑA',
      detalle:      `Contraseña cambiada para "${nombre}" (ID ${id}) por ${adminUser}`,
      usuario:      adminUser,
    })
  }

  await db.update(usuarios).set(updates).where(eq(usuarios.id, id))

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any)?.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: idStr } = await params
  const id = parseInt(idStr)
  const currentUser = session.user as any

  // No permitir desactivarse a uno mismo
  if (String(currentUser.id) === String(id)) {
    return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 })
  }

  await db.update(usuarios)
    .set({ activo: 0, fechaActualizacion: new Date().toISOString() })
    .where(eq(usuarios.id, id))

  return NextResponse.json({ ok: true })
}
