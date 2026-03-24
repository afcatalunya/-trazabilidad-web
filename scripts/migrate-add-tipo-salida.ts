/**
 * migrate-add-tipo-salida.ts
 * Añade la columna tipo_salida a la tabla pedidos si no existe.
 * Usar: npx tsx scripts/migrate-add-tipo-salida.ts
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Cargar .env
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf-8')
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

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function migrate() {
  console.log('🔧 Añadiendo columna tipo_salida a la tabla pedidos...\n')

  try {
    await client.execute(`ALTER TABLE pedidos ADD COLUMN tipo_salida TEXT`)
    console.log('✅ Columna tipo_salida añadida correctamente')
  } catch (err: any) {
    if (err.message?.includes('duplicate column')) {
      console.log('ℹ️  La columna tipo_salida ya existe — no es necesario añadirla')
    } else {
      console.error('❌ Error:', err.message)
      process.exit(1)
    }
  }

  // Verificar columnas actuales de la tabla
  const result = await client.execute(`PRAGMA table_info(pedidos)`)
  console.log('\n📋 Columnas actuales de la tabla pedidos:')
  result.rows.forEach((row: any) => {
    console.log(`   ${String(row.cid).padStart(2, ' ')}. ${row.name} (${row.type})`)
  })

  console.log('\n✅ Migración completada. Ya puedes ejecutar el import.')
  process.exit(0)
}

migrate().catch(err => { console.error(err); process.exit(1) })
