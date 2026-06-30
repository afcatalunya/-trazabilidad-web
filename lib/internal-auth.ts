import { auth } from '@/lib/auth'

/**
 * Autorización para endpoints que también dispara el CRM de escritorio (sin sesión web).
 *
 * Acepta la petición si:
 *  - viene de un navegador con sesión NextAuth válida (uso web normal), O
 *  - trae la cabecera `x-crm-key` con la clave interna (el CRM de escritorio la envía).
 *
 * Contexto: el fix C1 (auditoría) añadió `await auth()` a estas rutas para que no fueran
 * invocables sin sesión. Pero el CRM de escritorio las llama por HTTP sin sesión, así que
 * necesitaba una vía de confianza. La clave interna es server-side (no se expone al navegador).
 * Puede sobreescribirse con la env CRM_INTERNAL_KEY sin tocar código.
 */
const CRM_INTERNAL_KEY =
  process.env.CRM_INTERNAL_KEY || 'afcat-crm-internal-K7n2Q9mZ4vX8pL3rT6wB1yD5sH0jC2gE'

export async function autorizadoCrmOWeb(req: Request): Promise<boolean> {
  const key = req.headers.get('x-crm-key')
  if (key && key === CRM_INTERNAL_KEY) return true
  return !!(await auth())
}
