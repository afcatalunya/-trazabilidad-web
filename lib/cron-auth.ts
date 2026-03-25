import { NextRequest } from 'next/server'
import { auth } from './auth'

/**
 * Verifica que la petición viene de:
 *   a) Un admin con sesión activa (botón en el panel), o
 *   b) cron-job.org con el header Authorization: Bearer <CRON_SECRET>
 */
export async function isCronOrAdmin(req: NextRequest): Promise<boolean> {
  // ── Opción 1: token secreto (para cron-job.org) ──────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization') || ''
    if (authHeader === `Bearer ${cronSecret}`) {
      return true
    }
  }

  // ── Opción 2: sesión de admin (botón en el panel) ─────────────────
  const session = await auth()
  if (session && (session.user as any)?.rol === 'ADMIN') {
    return true
  }

  return false
}
