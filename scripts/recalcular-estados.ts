/**
 * recalcular-estados.ts
 * Recalcula el EstadoPedido de TODOS los pedidos según sus fechas.
 *
 * Ejecutar:  npx tsx scripts/recalcular-estados.ts
 */

import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(filename: string) {
  try {
    const envFile = readFileSync(resolve(process.cwd(), filename), 'utf-8')
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      if (key && !process.env[key]) process.env[key] = value
    }
  } catch {}
}
loadEnvFile('.env')
loadEnvFile('.env.local')

// ── Lógica de estados (misma que lib/utils.ts) ────────────────────────────────
function calcularEstado(p: any): string {
  if (p.estadoPedido === 'ANULADO') return 'ANULADO'
  if (p.fechaEntregaCliente) return 'ENTREGADO'
  if (p.fechaEnTarragona)   return 'EN ALMACÉN'
  if (p.fechaCargaCamion)   return 'EN CAMION'
  if (p.fechaTerminado)     return 'PARA CARGAR MURCIA'
  if (p.fechaPlanning)      return 'PLANNING'
  if (p.fechaSalida)        return 'EN PROCESO'
  return 'SIN PEDIDO DE COMPRA'
}

async function main() {
  const url   = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN

  if (!url || !token) {
    console.error('❌ Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en .env.local')
    process.exit(1)
  }

  const client = createClient({ url, authToken: token })

  console.log('🔍 Cargando todos los pedidos...')
  const result = await client.execute(`
    SELECT id, numeroPedido, estadoPedido,
           fechaSalida, fechaPlanning, fechaTerminado,
           fechaCargaCamion, fechaEnTarragona, fechaEntregaCliente
    FROM pedidos
  `)

  const rows = result.rows
  console.log(`   → ${rows.length} pedidos encontrados`)

  let actualizados = 0
  let sinCambio    = 0
  let errores      = 0

  for (const row of rows) {
    const estadoActual    = row.estadoPedido as string
    const estadoCalculado = calcularEstado(row)

    if (estadoActual === estadoCalculado) {
      sinCambio++
      continue
    }

    try {
      await client.execute({
        sql: `UPDATE pedidos SET estadoPedido = ?, updatedAt = ? WHERE id = ?`,
        args: [estadoCalculado, new Date().toISOString(), row.id],
      })
      console.log(`  ✅ ${row.numeroPedido}: "${estadoActual}" → "${estadoCalculado}"`)
      actualizados++
    } catch (err) {
      console.error(`  ❌ Error en pedido ${row.numeroPedido}:`, err)
      errores++
    }
  }

  console.log('\n─────────────────────────────────────')
  console.log(`✅ Actualizados: ${actualizados}`)
  console.log(`⏭  Sin cambio:   ${sinCambio}`)
  if (errores) console.log(`❌ Errores:      ${errores}`)
  console.log('─────────────────────────────────────')
}

main().catch(console.error)
