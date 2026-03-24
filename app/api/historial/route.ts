import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { historial } from '@/lib/schema'
import { desc, like, eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const numeroPedido = req.nextUrl.searchParams.get('numeroPedido')

    const result = await db
      .select()
      .from(historial)
      .where(numeroPedido ? eq(historial.numeroPedido, numeroPedido) : undefined)
      .orderBy(desc(historial.fechaMovimiento))
      .limit(500)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching historial:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
