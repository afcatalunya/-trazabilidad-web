import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { incidencias } from '@/lib/schema'
import { ne } from 'drizzle-orm'
import { isCronOrAdmin } from '@/lib/cron-auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const DIAS_SIN_CAMBIO = 5
const EMAIL_JUAN = 'juanc@aluminiosfranco.es'

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  if (!(await isCronOrAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Obtener todas las incidencias no cerradas
    const abiertas = await db
      .select()
      .from(incidencias)
      .where(ne(incidencias.estadoIncidencia, 'CERRADA'))

    const ahora = new Date()
    const limite = DIAS_SIN_CAMBIO * 24 * 60 * 60 * 1000

    // Filtrar las que llevan +5 días sin cambio de estado
    const paradas = abiertas.filter(inc => {
      const referencia = inc.ultimoCambioEstado || inc.createdAt
      if (!referencia) return false
      const fecha = new Date(referencia)
      return (ahora.getTime() - fecha.getTime()) > limite
    })

    if (paradas.length === 0) {
      return NextResponse.json({ ok: true, mensaje: 'No hay incidencias paradas', enviado: false })
    }

    // Construir tabla HTML
    const filas = paradas.map(inc => {
      const referencia = inc.ultimoCambioEstado || inc.createdAt || ''
      const fecha = referencia ? new Date(referencia).toLocaleDateString('es-ES') : '—'
      const dias = referencia
        ? Math.floor((ahora.getTime() - new Date(referencia).getTime()) / (1000 * 60 * 60 * 24))
        : '?'
      return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 12px;font-weight:600;color:#1a5c35;">${inc.numeroPedido}</td>
          <td style="padding:8px 12px;color:#4b5563;">${inc.tipoIncidencia || '—'}</td>
          <td style="padding:8px 12px;color:#4b5563;">${inc.descripcion || '—'}</td>
          <td style="padding:8px 12px;">
            <span style="background:#fff3e0;color:#c2410c;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">
              ${inc.estadoIncidencia}
            </span>
          </td>
          <td style="padding:8px 12px;color:#dc2626;font-weight:600;">${dias} días</td>
          <td style="padding:8px 12px;color:#6b7280;font-size:12px;">${fecha}</td>
        </tr>`
    }).join('')

    await resend.emails.send({
      from:    'Trazabilidad <no-reply@aluminiosfranco.es>',
      to:      EMAIL_JUAN,
      subject: `⚠️ ${paradas.length} incidencia${paradas.length > 1 ? 's' : ''} sin gestión hace +${DIAS_SIN_CAMBIO} días`,
      html: `
        <div style="font-family:sans-serif;max-width:700px;margin:0 auto;">
          <div style="background:#1a5c35;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:18px;">⚠️ Alerta de Incidencias Paradas</h1>
            <p style="color:#a7f3d0;margin:4px 0 0;font-size:13px;">Aluminios Franco · ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          <div style="background:#fffbeb;border:1px solid #fde68a;padding:16px 24px;">
            <p style="margin:0;color:#92400e;font-size:14px;">
              Las siguientes <strong>${paradas.length} incidencia${paradas.length > 1 ? 's' : ''}</strong> llevan más de <strong>${DIAS_SIN_CAMBIO} días</strong> sin cambio de estado.
            </p>
          </div>
          <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #e5e7eb;border-top:none;">
            <thead style="background:#f9fafb;">
              <tr>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Pedido</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Tipo</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Descripción</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Estado</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Sin cambio</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Último cambio</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
          <div style="padding:16px 24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Email automático generado por el sistema de trazabilidad.</p>
          </div>
        </div>`,
    })

    return NextResponse.json({ ok: true, incidencias: paradas.length, enviado: true })
  } catch (error) {
    console.error('Error alerta incidencias:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
