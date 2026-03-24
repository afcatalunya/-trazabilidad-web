/**
 * Migración: añade columna pdf_adjunto a la tabla pedidos en Turso
 * Ejecutar una sola vez: npx tsx scripts/add-pdf-adjunto.ts
 */
import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'

// Cargar .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...rest] = trimmed.split('=')
    process.env[key.trim()] = rest.join('=').trim()
  }
}

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

async function migrate() {
  console.log('🔧 Añadiendo columna pdf_adjunto a la tabla pedidos...')
  try {
    await client.execute(`ALTER TABLE pedidos ADD COLUMN pdf_adjunto TEXT`)
    console.log('✅ Columna pdf_adjunto añadida correctamente')
  } catch (err: any) {
    if (err.message?.includes('duplicate column')) {
      console.log('ℹ️  La columna pdf_adjunto ya existe — no se requiere acción')
    } else {
      console.error('❌ Error en migración:', err.message)
      process.exit(1)
    }
  }
}

migrate()
