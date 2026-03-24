import { readFileSync } from 'fs'
import { join } from 'path'

// Cargar .env.local ANTES de importar módulos que usan las variables de entorno
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eqIdx = trimmed.indexOf('=')
      const key = trimmed.substring(0, eqIdx).trim()
      const val = trimmed.substring(eqIdx + 1).trim()
      if (key && !process.env[key]) process.env[key] = val
    }
  }
} catch {}

async function seed() {
  // Imports dinámicos para que las variables de entorno estén cargadas antes
  const { db } = await import('../lib/db')
  const { usuarios } = await import('../lib/schema')
  const bcrypt = await import('bcryptjs')

  console.log('Iniciando seed de base de datos...')

  try {
    const hashedPassword = await bcrypt.default.hash('AluminiosFranco2024!', 10)

    const adminUser = await db
      .insert(usuarios)
      .values({
        nombre: 'Dani Fernández',
        email: 'danielf@aluminiosfranco.es',
        password: hashedPassword,
        rol: 'ADMIN',
        activo: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      })
      .onConflictDoNothing()
      .returning()

    if (adminUser.length > 0) {
      console.log('Usuario administrador creado:')
      console.log(`  Email: danielf@aluminiosfranco.es`)
      console.log(`  Contraseña: AluminiosFranco2024!`)
      console.log(`  Rol: ADMIN`)
    } else {
      console.log('Usuario administrador ya existe')
    }

    console.log('Seed completado exitosamente')
  } catch (error) {
    console.error('Error durante el seed:', error)
    process.exit(1)
  }
}

seed()
