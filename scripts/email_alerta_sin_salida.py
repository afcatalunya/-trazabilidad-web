#!/usr/bin/env python3
"""
email_alerta_sin_salida.py
Detecta pedidos sin FechaSalida registrada hace más de DIAS_LIMITE días y envía alerta.
Ejecutar: python3 scripts/email_alerta_sin_salida.py
"""
import os, json, urllib.request, smtplib, sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from datetime import date, datetime

DIAS_LIMITE = 3  # Días sin FechaSalida antes de enviar alerta

# ── Cargar .env.local ─────────────────────────────────────────────────────────
def load_env():
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

print(f'🔍 Consultando pedidos sin FechaSalida hace más de {DIAS_LIMITE} días...')
candidatos = turso_query(
    "SELECT numero_pedido, cliente, fecha_pedido, categoria, proveedor, urgente "
    "FROM pedidos "
    "WHERE fecha_salida IS NULL "
    "  AND fecha_pedido IS NOT NULL "
    "  AND estado_pedido NOT IN ('ANULADO', 'ENTREGADO')"
)

hoy = date.today()
pedidos_filtrados = []
for p in candidatos:
    if p.get('fecha_pedido'):
        try:
            fp = datetime.fromisoformat(p['fecha_pedido']).date()
            dias = (hoy - fp).days
        except Exception:
            dias = 0
        if dias > DIAS_LIMITE:
            p['dias_espera'] = dias
            pedidos_filtrados.append(p)

pedidos_filtrados.sort(key=lambda x: x['dias_espera'], reverse=True)
print(f'   → {len(pedidos_filtrados)} pedidos encontrados (de {len(candidatos)} candidatos)')

if not pedidos_filtrados:
    print(f'✅ Ningún pedido sin FechaSalida supera los {DIAS_LIMITE} días — no se envía email.')
    sys.exit(0)

# ── Construir HTML ────────────────────────────────────────────────────────────
def color_dias(d):
    if d > 7: return '#dc2626'
    if d > 5: return '#d97706'
    return '#b45309'

n = len(pedidos_filtrados)
filas = ''.join(f"""
  <tr>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-weight:bold;color:#1e3a5f;">
      {p['numero_pedido']}
      {'<span style="background:#dc2626;color:white;padding:1px 5px;border-radius:3px;font-size:10px;margin-left:4px;">URGENTE</span>' if p.get('urgente') == 'URGENTE' else ''}
    </td>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">{p.get('cliente') or '—'}</td>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">{p.get('fecha_pedido') or '—'}</td>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-weight:bold;color:{color_dias(p['dias_espera'])};">{p['dias_espera']} días</td>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">{p.get('categoria') or '—'}</td>
    <td style="padding:8px;border-bottom:1px solid #f1f5f9;">{p.get('proveedor') or '—'}</td>
  </tr>
""" for p in pedidos_filtrados)

html = f"""
<div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;">
  <div style="background:#b45309;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:18px;">⏰ Pedidos Sin Fecha de Salida — Más de {DIAS_LIMITE} días</h2>
    <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">
      {n} pedido{'s' if n>1 else ''} registrado{'s' if n>1 else ''} sin FechaSalida de material
    </p>
  </div>
  <div style="background:#fffbeb;padding:12px 16px;border-left:4px solid #eab308;font-size:13px;">
    📦 Estos pedidos llevan <strong>más de {DIAS_LIMITE} días sin recibir fecha de salida de material</strong> del proveedor.
    Verificar estado del pedido de compra.
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
      <tbody>{filas}</tbody>
    </table>
  </div>
</div>
"""

# ── Enviar email ──────────────────────────────────────────────────────────────
msg = MIMEMultipart('alternative')
msg['Subject'] = f"⏰ ALERTA: {n} pedido{'s' if n>1 else ''} sin FechaSalida hace más de {DIAS_LIMITE} días"
msg['From']    = EMAIL_FROM
msg['To']      = f"{EMAIL_DANI}, {EMAIL_JUANC}"
msg.attach(MIMEText(html, 'html', 'utf-8'))

print(f'📧 Enviando alerta a {EMAIL_DANI}, {EMAIL_JUANC}...')
try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as s:
        if EMAIL_USER and EMAIL_PASS and EMAIL_PASS != 'PONTU_CONTRASEÑA_AQUI':
            s.login(EMAIL_USER, EMAIL_PASS)
        s.sendmail(EMAIL_USER, [EMAIL_DANI, EMAIL_JUANC], msg.as_bytes())
    print(f'✅ Alerta enviada — {n} pedido{"s" if n>1 else ""} sin FechaSalida (>{DIAS_LIMITE} días)')
except Exception as e:
    print(f'❌ Error enviando email: {e}')
    sys.exit(1)
