#!/usr/bin/env python3
"""
email_semanal.py
Envía el resumen semanal de pedidos activos a los destinatarios configurados.
Ejecutar: python3 scripts/email_semanal.py
"""
import os, json, urllib.request, smtplib, sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

# ── Cargar .env.local ─────────────────────────────────────────────────────────
def load_env():
    # Buscar .env.local relativo a este script
    here = Path(__file__).parent.parent
    env = {}
    for fname in ['.env.local', '.env']:
        p = here / fname
        if p.exists():
            for line in p.read_text(encoding='utf-8').splitlines():
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
    return env

env = load_env()

TURSO_URL   = env.get('TURSO_DATABASE_URL', '').replace('libsql://', 'https://')
TURSO_TOKEN = env.get('TURSO_AUTH_TOKEN', '')
SMTP_HOST   = env.get('EMAIL_SMTP_HOST', '')
SMTP_PORT   = int(env.get('EMAIL_SMTP_PORT', '25'))
EMAIL_USER  = env.get('EMAIL_USER', '')
EMAIL_PASS  = env.get('EMAIL_PASS', '')
EMAIL_FROM  = env.get('EMAIL_FROM', EMAIL_USER)
EMAIL_DANI  = env.get('EMAIL_DANI', 'danielf@aluminiosfranco.es')
EMAIL_JUANC = env.get('EMAIL_JUANC', 'juanc@aluminiosfranco.es')
DESTINATARIOS = f"{EMAIL_DANI}, {EMAIL_JUANC}"

if not TURSO_URL or not TURSO_TOKEN:
    print('❌ Faltan TURSO_DATABASE_URL / TURSO_AUTH_TOKEN en .env.local')
    sys.exit(1)
if not SMTP_HOST:
    print('❌ Falta EMAIL_SMTP_HOST en .env.local')
    sys.exit(1)

# ── Consultar Turso ───────────────────────────────────────────────────────────
def turso_query(sql):
    payload = json.dumps({
        "baton": None,
        "requests": [
            {"type": "execute", "stmt": {"sql": sql, "args": []}},
            {"type": "close"}
        ]
    }).encode()
    req = urllib.request.Request(
        f'{TURSO_URL}/v2/pipeline',
        data=payload,
        headers={'Authorization': f'Bearer {TURSO_TOKEN}', 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    result = data['results'][0]['response']['result']
    cols   = [c['name'] for c in result['cols']]
    rows   = []
    for row in result['rows']:
        r = {}
        for i, c in enumerate(cols):
            cell = row[i]
            r[c] = cell.get('value') if cell.get('type') != 'null' else None
        rows.append(r)
    return rows

print('🔍 Consultando pedidos activos...')
pedidos = turso_query(
    "SELECT numero_pedido, cliente, estado_pedido, categoria, proveedor, urgente "
    "FROM pedidos "
    "WHERE estado_pedido NOT IN ('ENTREGADO', 'ANULADO') "
    "ORDER BY created_at"
)
print(f'   → {len(pedidos)} pedidos activos encontrados')

if not pedidos:
    print('ℹ️  No hay pedidos activos — no se envía email.')
    sys.exit(0)

# ── Construir HTML ────────────────────────────────────────────────────────────
ESTADO_BG = {
    'SIN PEDIDO DE COMPRA': '#fecaca',
    'EN PROCESO':           '#fed7aa',
    'PLANNING':             '#fef08a',
    'PARA CARGAR MURCIA':   '#fef08a',
    'EN CAMION':            '#bfdbfe',
    'EN ALMACÉN':           '#bbf7d0',
}

def estado_bg(e): return ESTADO_BG.get(e or '', '#e5e7eb')

filas = ''.join(f"""
  <tr>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-weight:bold;color:#1e3a5f;">{p['numero_pedido']}
      {'<span style="background:#dc2626;color:white;padding:1px 5px;border-radius:3px;font-size:10px;margin-left:4px;">URGENTE</span>' if p.get('urgente') == 'URGENTE' else ''}
    </td>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">{p.get('cliente') or '—'}</td>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">
      <span style="background:{estado_bg(p.get('estado_pedido'))};padding:2px 8px;border-radius:4px;font-size:12px;">{p.get('estado_pedido') or '—'}</span>
    </td>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">{p.get('categoria') or '—'}</td>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">{p.get('proveedor') or '—'}</td>
  </tr>
""" for p in pedidos)

from datetime import date
hoy_str = date.today().strftime('%d/%m/%Y')

html = f"""
<div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">
  <div style="background:#1a5c35;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:18px;">📋 Informe Semanal — Pedidos en Curso</h2>
    <p style="margin:4px 0 0;opacity:0.8;font-size:14px;">Semana del {hoy_str} · {len(pedidos)} pedidos activos</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f0faf4;">
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:#1a5c35;">PEDIDO</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:#1a5c35;">CLIENTE</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:#1a5c35;">ESTADO</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:#1a5c35;">CATEGORÍA</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:#1a5c35;">PROVEEDOR</th>
        </tr>
      </thead>
      <tbody>{filas}</tbody>
    </table>
  </div>
</div>
"""

# ── Enviar email ──────────────────────────────────────────────────────────────
msg = MIMEMultipart('alternative')
msg['Subject'] = f'📋 Informe Semanal Trazabilidad — {len(pedidos)} pedidos activos ({hoy_str})'
msg['From']    = EMAIL_FROM
msg['To']      = DESTINATARIOS
msg.attach(MIMEText(html, 'html', 'utf-8'))

print(f'📧 Enviando email a {DESTINATARIOS}...')
try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as s:
        if EMAIL_USER and EMAIL_PASS and EMAIL_PASS != 'PONTU_CONTRASEÑA_AQUI':
            s.login(EMAIL_USER, EMAIL_PASS)
        s.sendmail(EMAIL_USER, [EMAIL_DANI, EMAIL_JUANC], msg.as_bytes())
    print(f'✅ Informe semanal enviado — {len(pedidos)} pedidos activos')
except Exception as e:
    print(f'❌ Error enviando email: {e}')
    sys.exit(1)
