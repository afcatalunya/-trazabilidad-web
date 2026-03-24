/**
 * lib/email.ts
 * Módulo de envío de emails para las automatizaciones de trazabilidad.
 *
 * Configuración en .env.local:
 *   EMAIL_SMTP_HOST=mail.nominalia.com   (o el servidor de Nominalia)
 *   EMAIL_SMTP_PORT=465                  (465 SSL o 587 STARTTLS)
 *   EMAIL_SMTP_SECURE=true               (true para 465, false para 587)
 *   EMAIL_USER=tu@aluminiosfranco.es
 *   EMAIL_PASS=tu_contraseña
 *   EMAIL_FROM=Trazabilidad Pedidos <tu@aluminiosfranco.es>
 *   EMAIL_DANI=danielf@aluminiosfranco.es
 *   EMAIL_JUANC=juanc@aluminiosfranco.es
 */
import nodemailer from 'nodemailer'

// ─── URL de la app (producción o local) ──────────────────────────────────────
function getAppUrl(): string {
  // NEXTAUTH_URL se define en las variables de entorno de Vercel
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, '')
  // VERCEL_URL lo inyecta Vercel automáticamente (sin protocolo)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  // Fallback explícito al dominio de producción
  return 'https://trazabilidad-web.vercel.app'
}

// ─── Transporter ─────────────────────────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_SMTP_HOST,
    port:   Number(process.env.EMAIL_SMTP_PORT || 465),
    secure: process.env.EMAIL_SMTP_SECURE !== 'false', // true por defecto (SSL)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // El servidor usa certificado de securemail.pro con alias authsmtp.aluminiosfranco.es
    // El CN no coincide → desactivamos la validación estricta del certificado
    tls: { rejectUnauthorized: false },
  })
}

const DESTINATARIOS = [
  process.env.EMAIL_DANI  || 'danielf@aluminiosfranco.es',
  process.env.EMAIL_JUANC || 'juanc@aluminiosfranco.es',
].filter(Boolean).join(', ')

const FROM = process.env.EMAIL_FROM || `Trazabilidad Pedidos <${process.env.EMAIL_USER}>`

// ─── Helper: colores por estado ───────────────────────────────────────────────
function colorEstado(estado: string): string {
  const mapa: Record<string, string> = {
    'SIN PEDIDO DE COMPRA': '#fecaca',
    'EN PROCESO':           '#fed7aa',
    'PLANNING':             '#fef08a',
    'PARA CARGAR MURCIA':   '#fef08a',
    'EN CAMION':            '#bfdbfe',
    'EN ALMACÉN':           '#bbf7d0',
    'ENTREGADO':            '#16a34a',
    'ANULADO':              '#e5e7eb',
  }
  return mapa[estado] || '#e5e7eb'
}

// ─── AUTOMATIZACIÓN 1: Nuevo Pedido ──────────────────────────────────────────
export async function enviarEmailNuevoPedido(pedido: {
  numeroPedido: string
  cliente: string
  categoria?: string | null
  acabado?: string | null
  color?: string | null
  proveedor?: string | null
  urgente?: string | null
  almacen?: string | null
}) {
  if (!process.env.EMAIL_SMTP_HOST) return // Sin configuración, silencio

  const urgenteBadge = pedido.urgente === 'URGENTE'
    ? `<span style="background:#dc2626;color:white;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">🚨 URGENTE</span>`
    : ''

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1e3a5f;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">✅ Nuevo Pedido Registrado</h2>
        <p style="margin:4px 0 0;opacity:0.8;font-size:14px;">Aluminios Franco · Trazabilidad</p>
      </div>
      <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px;font-weight:bold;color:#64748b;width:40%;">Nº Pedido</td>
            <td style="padding:8px;font-size:18px;font-weight:bold;color:#1e3a5f;">${pedido.numeroPedido} ${urgenteBadge}</td>
          </tr>
          <tr style="background:white;">
            <td style="padding:8px;font-weight:bold;color:#64748b;">Cliente</td>
            <td style="padding:8px;">${pedido.cliente}</td>
          </tr>
          <tr>
            <td style="padding:8px;font-weight:bold;color:#64748b;">Categoría</td>
            <td style="padding:8px;">${pedido.categoria || '—'}</td>
          </tr>
          <tr style="background:white;">
            <td style="padding:8px;font-weight:bold;color:#64748b;">Acabado</td>
            <td style="padding:8px;">${pedido.acabado || '—'}${pedido.color ? ` · <strong>${pedido.color}</strong>` : ''}</td>
          </tr>
          <tr>
            <td style="padding:8px;font-weight:bold;color:#64748b;">Proveedor</td>
            <td style="padding:8px;">${pedido.proveedor || '—'}</td>
          </tr>
          <tr style="background:white;">
            <td style="padding:8px;font-weight:bold;color:#64748b;">Almacén</td>
            <td style="padding:8px;">${pedido.almacen || '—'}</td>
          </tr>
        </table>
        <div style="margin-top:16px;padding:12px;background:#eff6ff;border-radius:6px;font-size:13px;color:#1e40af;">
          📅 Registrado el ${new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>
    </div>
  `

  await getTransporter().sendMail({
    from:    FROM,
    to:      DESTINATARIOS,
    subject: `🆕 Pedido ${pedido.numeroPedido} — ${pedido.cliente}${pedido.urgente === 'URGENTE' ? ' 🚨 URGENTE' : ''}`,
    html,
  })
}

// ─── AUTOMATIZACIÓN 3: Informe semanal de pedidos en curso ───────────────────
export async function enviarInformeSemanal(pedidos: Array<{
  numeroPedido: string
  cliente: string
  estadoPedido: string
  categoria?: string | null
  proveedor?: string | null
  urgente?: string | null
}>) {
  if (!process.env.EMAIL_SMTP_HOST) return

  const appUrl = getAppUrl()
  const filas = pedidos.map(p => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;">
        <a href="${appUrl}/pedidos?search=${encodeURIComponent(p.numeroPedido)}" style="color:#1e3a5f;font-weight:bold;text-decoration:none;">${p.numeroPedido}</a>
        ${p.urgente === 'URGENTE' ? ' <span style="background:#dc2626;color:white;padding:1px 6px;border-radius:3px;font-size:11px;">URGENTE</span>' : ''}
      </td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.cliente}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;">
        <span style="background:${colorEstado(p.estadoPedido)};padding:2px 8px;border-radius:4px;font-size:12px;">${p.estadoPedido}</span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.categoria || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.proveedor || '—'}</td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">
      <div style="background:#1e3a5f;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">📋 Informe Semanal — Pedidos en Curso</h2>
        <p style="margin:4px 0 0;opacity:0.8;font-size:14px;">
          Semana del ${new Date().toLocaleDateString('es-ES')} · ${pedidos.length} pedidos activos
        </p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">PEDIDO</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">CLIENTE</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">ESTADO</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">CATEGORÍA</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">PROVEEDOR</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    </div>
  `

  const lunes = new Date()
  await getTransporter().sendMail({
    from:    FROM,
    to:      DESTINATARIOS,
    subject: `📋 Informe Semanal Trazabilidad — ${pedidos.length} pedidos activos (${lunes.toLocaleDateString('es-ES')})`,
    html,
  })
}

// ─── AUTOMATIZACIÓN 5: Pedidos sin FechaSalida hace más de 3 días ────────────
export async function enviarAlertaSinSalida(pedidos: Array<{
  numeroPedido: string
  cliente: string
  fechaPedido: string | null
  diasEspera: number
  categoria?: string | null
  proveedor?: string | null
  urgente?: string | null
}>) {
  if (!process.env.EMAIL_SMTP_HOST || pedidos.length === 0) return

  const appUrlAlerta = getAppUrl()
  const filas = pedidos.map(p => {
    const colorDias = p.diasEspera > 7 ? '#dc2626' : p.diasEspera > 5 ? '#d97706' : '#b45309'
    const urgenteTag = p.urgente === 'URGENTE'
      ? ' <span style="background:#dc2626;color:white;padding:1px 5px;border-radius:3px;font-size:10px;">URGENTE</span>'
      : ''
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-weight:bold;">
          <a href="${appUrlAlerta}/pedidos?search=${encodeURIComponent(p.numeroPedido)}" style="color:#1e3a5f;font-weight:bold;text-decoration:none;">${p.numeroPedido}</a>${urgenteTag}
        </td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.cliente}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.fechaPedido || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-weight:bold;color:${colorDias};">${p.diasEspera} días</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.categoria || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.proveedor || '—'}</td>
      </tr>
    `
  }).join('')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">
      <div style="background:#b45309;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">⏰ Pedidos Sin Fecha de Salida — Más de 3 días</h2>
        <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">
          ${pedidos.length} pedido${pedidos.length > 1 ? 's' : ''} registrado${pedidos.length > 1 ? 's' : ''} sin FechaSalida de material
        </p>
      </div>
      <div style="background:#fffbeb;padding:12px 16px;border-left:4px solid #eab308;margin:0;font-size:13px;">
        📦 Estos pedidos llevan <strong>más de 3 días sin recibir fecha de salida de material</strong> del proveedor. Verificar estado del pedido de compra.
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">PEDIDO</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">CLIENTE</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">F.PEDIDO</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">DÍAS SIN SALIDA</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">CATEGORÍA</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">PROVEEDOR</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    </div>
  `

  await getTransporter().sendMail({
    from:    FROM,
    to:      DESTINATARIOS,
    subject: `⏰ ALERTA: ${pedidos.length} pedido${pedidos.length > 1 ? 's' : ''} sin FechaSalida hace más de 3 días`,
    html,
  })
}

// ─── AUTOMATIZACIÓN 4: Pedidos terminados sin FechaEnTarragona ───────────────
export async function enviarAlertaTerminadosSinCamion(pedidos: Array<{
  numeroPedido: string
  cliente: string
  fechaTerminado: string | null
  categoria?: string | null
  proveedor?: string | null
  almacen?: string | null
}>) {
  if (!process.env.EMAIL_SMTP_HOST || pedidos.length === 0) return

  const appUrlTerminados = getAppUrl()
  const filas = pedidos.map(p => {
    const diasEspera = p.fechaTerminado
      ? Math.floor((Date.now() - new Date(p.fechaTerminado).getTime()) / 86400000)
      : 0
    const colorDias = diasEspera > 5 ? '#dc2626' : diasEspera > 2 ? '#d97706' : '#16a34a'

    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-weight:bold;">
          <a href="${appUrlTerminados}/pedidos?search=${encodeURIComponent(p.numeroPedido)}" style="color:#1e3a5f;font-weight:bold;text-decoration:none;">${p.numeroPedido}</a>
        </td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.cliente}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.fechaTerminado || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-weight:bold;color:${colorDias};">${diasEspera} días</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.categoria || '—'}</td>
        <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${p.proveedor || '—'}</td>
      </tr>
    `
  }).join('')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">
      <div style="background:#dc2626;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">⚠️ Pedidos Terminados Sin Llegar a Tarragona</h2>
        <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">
          ${pedidos.length} pedido${pedidos.length > 1 ? 's' : ''} con FechaTerminado pero sin FechaEnTarragona
        </p>
      </div>
      <div style="background:#fff7ed;padding:12px 16px;border-left:4px solid #f97316;margin:0;font-size:13px;">
        ⚡ Estos pedidos están <strong>terminados en Murcia pero no han llegado a Tarragona</strong>.
        Verificar si están en camión o pendientes de cargar.
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">PEDIDO</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">CLIENTE</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">TERMINADO</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">DÍAS ESPERA</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">CATEGORÍA</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;">PROVEEDOR</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    </div>
  `

  await getTransporter().sendMail({
    from:    FROM,
    to:      DESTINATARIOS,
    subject: `⚠️ ALERTA: ${pedidos.length} pedido${pedidos.length > 1 ? 's' : ''} terminado${pedidos.length > 1 ? 's' : ''} sin llegar a Tarragona`,
    html,
  })
}

// ─── CARGA CAMIÓN MURCIA ──────────────────────────────────────────────────────
export async function enviarEmailCargaMurcia(pedidos: Array<{
  numeroPedido: string
  categoria?: string | null
  referenciaProducto?: string | null
  proveedor?: string | null
  pdfAdjunto?: string | null
}>) {
  if (!process.env.EMAIL_SMTP_HOST) return

  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const appUrlMurcia = getAppUrl()
  const filas = pedidos.map((p, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:bold;white-space:nowrap;">
        <a href="${appUrlMurcia}/pedidos?search=${encodeURIComponent(p.numeroPedido)}" style="color:#c0392b;font-weight:bold;text-decoration:none;">${p.numeroPedido}</a>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#374151;">${p.categoria || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#374151;">${p.referenciaProducto || '—'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#374151;">${p.proveedor || '—'}</td>
    </tr>
  `).join('')

  const conPdf = pedidos.filter(p => p.pdfAdjunto)
  const sinPdf = pedidos.length - conPdf.length

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:750px;margin:0 auto;">
      <!-- Cabecera -->
      <div style="background:#c0392b;color:white;padding:18px 24px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:20px;letter-spacing:1px;">🚛 PEDIDOS TERMINADOS PARA CARGAR EN MURCIA</h1>
        <p style="margin:6px 0 0;opacity:0.9;font-size:14px;">
          Pedidos con fecha de terminado pendientes de llegar a Tarragona · ${fecha}
        </p>
      </div>

      <!-- Tabla -->
      <div style="border:1px solid #e5e7eb;border-top:none;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f87171;color:white;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;letter-spacing:0.5px;">NUMERO PEDIDO</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;letter-spacing:0.5px;">CATEGORÍA</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;letter-spacing:0.5px;">REFERENCIA PRODUCTO</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;letter-spacing:0.5px;">PROVEEDOR</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:14px 20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;font-size:13px;color:#6b7280;">
        <strong>${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''}</strong> terminado${pedidos.length !== 1 ? 's' : ''} pendiente${pedidos.length !== 1 ? 's' : ''} de carga.
        ${conPdf.length > 0 ? ` · <strong>${conPdf.length} PDF${conPdf.length !== 1 ? 's' : ''} adjunto${conPdf.length !== 1 ? 's' : ''}</strong>.` : ''}
        ${sinPdf > 0 ? ` · ${sinPdf} sin PDF.` : ''}
      </div>
    </div>
  `

  // Adjuntar PDFs en paralelo (Promise.all evita esperas en serie)
  const attachmentResults = await Promise.all(
    conPdf.map(async (p): Promise<nodemailer.Attachment | null> => {
      if (!p.pdfAdjunto) return null
      try {
        const resp = await fetch(p.pdfAdjunto)
        if (resp.ok) {
          const buffer = Buffer.from(await resp.arrayBuffer())
          return {
            filename:    `${p.numeroPedido}.pdf`,
            content:     buffer,
            contentType: 'application/pdf',
          }
        }
      } catch {
        console.warn(`No se pudo adjuntar PDF de ${p.numeroPedido}`)
      }
      return null
    })
  )
  const attachments = attachmentResults.filter((a): a is nodemailer.Attachment => a !== null)

  await getTransporter().sendMail({
    from:        FROM,
    to:          DESTINATARIOS,
    subject:     `🚛 CARGA CAMION MURCIA - ${fecha}`,
    html,
    attachments,
  })
}
