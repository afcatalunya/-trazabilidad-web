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
 * necesitaba una vía de confianza.
 *
 * Las claves se leen SOLO de variables de entorno (NO hay secreto en el repo):
 *  - CRM_INTERNAL_KEY        → clave vigente.
 *  - CRM_INTERNAL_KEY_LEGACY → clave anterior, aceptada temporalmente durante la rotación
 *                              para que los CRM de escritorio sin actualizar sigan funcionando.
 *                              Eliminar esta env cuando todos los equipos usen la clave nueva.
 * Si no hay ninguna env definida, solo se permite el acceso con sesión web válida.
 */
const CLAVES_INTERNAS = [
  process.env.CRM_INTERNAL_KEY,
  process.env.CRM_INTERNAL_KEY_LEGACY,
].filter((k): k is string => typeof k === 'string' && k.length > 0)

export async function autorizadoCrmOWeb(req: Request): Promise<boolean> {
  const key = req.headers.get('x-crm-key')
  if (key && CLAVES_INTERNAS.includes(key)) return true
  return !!(await auth())
}
