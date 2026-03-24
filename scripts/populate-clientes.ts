/**
 * populate-clientes.ts
 * Extrae clientes únicos de la tabla pedidos y los inserta en la tabla clientes.
 * Ejecución: npx tsx scripts/populate-clientes.ts
 */
import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

// Leer .env.local
const envPath = path.join(process.cwd(), '.env.local')
const env = fs.readFileSync(envPath, 'utf-8')
const get = (key: string) => {
  const m = env.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : undefined
}

const url   = get('TURSO_DATABASE_URL')!
const token = get('TURSO_AUTH_TOKEN')!

const db = createClient({ url, authToken: token })

async function main() {
  console.log('🔍 Extrayendo clientes únicos de pedidos...')

  // Obtener clientes únicos de pedidos (por numero_cliente)
  const { rows } = await db.execute(`
    SELECT DISTINCT
      numero_cliente,
      cliente AS nombre_cliente,
      codigo_comercial
    FROM pedidos
    WHERE cliente IS NOT NULL AND cliente != ''
    ORDER BY numero_cliente
  `)

  console.log(`📋 Encontrados ${rows.length} clientes únicos`)

  let insertados = 0
  let omitidos   = 0

  for (const row of rows) {
    const numeroCliente   = (row.numero_cliente   as string) || ''
    const nombreCliente   = (row.nombre_cliente   as string) || ''
    const codigoComercial = (row.codigo_comercial as string) || null

    if (!nombreCliente) continue

    try {
      await db.execute({
        sql: `
          INSERT OR IGNORE INTO clientes
            (numero_cliente, nombre_cliente, codigo_comercial, activo, created_at)
          VALUES (?, ?, ?, 1, datetime('now'))
        `,
        args: [numeroCliente, nombreCliente, codigoComercial],
      })
      insertados++
      console.log(`  ✅ ${numeroCliente || '(sin nº)'} — ${nombreCliente}`)
    } catch (err) {
      console.log(`  ⚠️  Omitido: ${nombreCliente}`)
      omitidos++
    }
  }

  console.log(`\n✅ Completado: ${insertados} insertados, ${omitidos} omitidos`)
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
