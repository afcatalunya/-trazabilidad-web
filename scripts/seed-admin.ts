/**
 * seed-admin.ts
 * Crea el usuario administrador en la base de datos Turso.
 * Usar: npx tsx scripts/seed-admin.ts
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import bcrypt from 'bcryptjs'

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

async function seedAdmin() {
  console.log('Creando usuario administrador...\n')

  const email    = 'danielf@aluminiosfranco.es'
  const nombre   = 'Dani Fernández'
  const password = 'AluminiosFranco2024!'
  const rol      = 'ADMIN'

  const hash = await bcrypt.hash(password, 10)

  try {
    await client.execute({
      sql: `INSERT OR IGNORE INTO usuarios (nombre, email, password, rol, activo)
            VALUES (?, ?, ?, ?, 1)`,
      args: [nombre, email, hash, rol],
    })

    const result = await client.execute({
      sql: `SELECT id, nombre, email, rol FROM usuarios WHERE email = ?`,
      args: [email],
    })

    if (result.rows.length > 0) {
      const u = result.rows[0]
      console.log('✅ Usuario administrador listo:')
      console.log(`   Nombre   : ${u.nombre}`)
      console.log(`   Email    : ${u.email}`)
      console.log(`   Contraseña: ${password}`)
      console.log(`   Rol      : ${u.rol}`)
    }
  } catch (err: any) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }

  console.log('\n🎉 ¡Listo! Ya puedes iniciar sesión en la aplicación.')
  process.exit(0)
}

seedAdmin()
