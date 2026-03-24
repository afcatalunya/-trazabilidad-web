import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const config = {
    host:   process.env.EMAIL_SMTP_HOST   || '(no configurado)',
    port:   process.env.EMAIL_SMTP_PORT   || '(no configurado)',
    secure: process.env.EMAIL_SMTP_SECURE || '(no configurado)',
    user:   process.env.EMAIL_USER        || '(no configurado)',
    pass:   process.env.EMAIL_PASS        ? `****${process.env.EMAIL_PASS.slice(-4)}` : '(no configurado)',
    from:   process.env.EMAIL_FROM        || '(no configurado)',
    dani:   process.env.EMAIL_DANI        || '(no configurado)',
    juanc:  process.env.EMAIL_JUANC       || '(no configurado)',
  }

  // Verificar conexión SMTP
  let smtpStatus: 'ok' | 'error' = 'error'
  let smtpError = ''
  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_SMTP_HOST,
      port:   Number(process.env.EMAIL_SMTP_PORT || 587),
      secure: process.env.EMAIL_SMTP_SECURE !== 'false',
      tls:    { rejectUnauthorized: false },
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
    await transporter.verify()
    smtpStatus = 'ok'
  } catch (err: any) {
    smtpError = err?.message || 'Error desconocido'
  }

  return NextResponse.json({ config, smtpStatus, smtpError })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.EMAIL_SMTP_HOST || !process.env.EMAIL_PASS) {
    return NextResponse.json({ error: 'Email no configurado' }, { status: 400 })
  }

  try {
    const transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_SMTP_HOST,
      port:   Number(process.env.EMAIL_SMTP_PORT || 587),
      secure: process.env.EMAIL_SMTP_SECURE !== 'false',
      tls:    { rejectUnauthorized: false },
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to:      process.env.EMAIL_DANI || process.env.EMAIL_USER,
      subject: '✅ Test Email — Trazabilidad Aluminios Franco',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="color:#1a5c35;">✅ Conexión SMTP funcionando</h2>
          <p>Este es un email de prueba del sistema de trazabilidad.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr><td style="padding:6px;color:#6b7280;font-size:13px;">Host</td><td style="padding:6px;font-size:13px;">${process.env.EMAIL_SMTP_HOST}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:6px;color:#6b7280;font-size:13px;">Puerto</td><td style="padding:6px;font-size:13px;">${process.env.EMAIL_SMTP_PORT}</td></tr>
            <tr><td style="padding:6px;color:#6b7280;font-size:13px;">Usuario</td><td style="padding:6px;font-size:13px;">${process.env.EMAIL_USER}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:6px;color:#6b7280;font-size:13px;">Enviado</td><td style="padding:6px;font-size:13px;">${new Date().toLocaleString('es-ES')}</td></tr>
          </table>
        </div>
      `,
    })

    return NextResponse.json({ ok: true, mensaje: 'Email de prueba enviado correctamente' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Error al enviar' }, { status: 500 })
  }
}
