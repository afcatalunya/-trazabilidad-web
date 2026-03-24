import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Cargar variables del archivo .env manualmente
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
  console.log('✅ Variables de entorno cargadas')
} catch (e) {
  console.error('No se pudo leer el archivo .env:', e)
}

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error('❌ TURSO_DATABASE_URL no encontrado en .env')
  process.exit(1)
}

console.log('🔌 Conectando a:', url)
const client = createClient({ url, authToken })

async function createTables() {
  console.log('\nCreando tablas en Turso...\n')

  const statements: { name: string; sql: string }[] = [

    // ─── USUARIOS ───────────────────────────────────────────────────────────
    {
      name: 'usuarios',
      sql: `CREATE TABLE IF NOT EXISTS usuarios (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre        TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password      TEXT NOT NULL,
        rol           TEXT DEFAULT 'USUARIO',  -- ADMIN | USUARIO
        activo        INTEGER DEFAULT 1,
        fecha_creacion      TEXT DEFAULT (datetime('now')),
        fecha_actualizacion TEXT DEFAULT (datetime('now'))
      )`,
    },

    // ─── CLIENTES ───────────────────────────────────────────────────────────
    {
      name: 'clientes',
      sql: `CREATE TABLE IF NOT EXISTS clientes (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_cliente   TEXT UNIQUE NOT NULL,  -- Código 4 dígitos: 0070, 8178
        nombre_cliente   TEXT NOT NULL,
        codigo_comercial TEXT,
        contacto         TEXT,
        telefono         TEXT,
        email            TEXT,
        activo           INTEGER DEFAULT 1,
        created_at       TEXT DEFAULT (datetime('now'))
      )`,
    },

    // ─── PEDIDOS ────────────────────────────────────────────────────────────
    // Un pedido puede tener varias LÍNEAS (filas) con diferente TipoSalida.
    // Por eso numero_pedido NO es UNIQUE — la clave primaria es el id autoincremental.
    // La combinación (numero_pedido + tipo_salida) identifica cada línea de forma única.
    {
      name: 'pedidos',
      sql: `CREATE TABLE IF NOT EXISTS pedidos (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,

        -- Identificación
        numero_pedido         TEXT NOT NULL,         -- Ej: V26-00042  (puede repetirse si hay varias líneas)
        tipo_salida           TEXT,                  -- FRIO | RPT | EXTRUSION | CHAPAS | PANEL | ACCESORIOS | OTROS
        fecha_pedido          TEXT,                  -- Fecha de entrada del pedido (YYYY-MM-DD)

        -- Cliente
        numero_cliente        TEXT,                  -- Código 4 dígitos: 0070
        codigo_comercial      TEXT,                  -- Código comercial: 30, 80
        cliente               TEXT NOT NULL,         -- Nombre del cliente

        -- Producto
        categoria             TEXT,                  -- CARPINTERIA | CHAPAS | NORMALIZADOS | INDUSTRIAL | ACCESORIOS | COMPOSITE | CARROCERÍA | DEPLOYE | TRAPEZOIDAL | OTROS
        referencia_producto   TEXT,                  -- Referencia técnica libre
        acabado               TEXT,                  -- LACADO | ANODIZADO | S/A
        color                 TEXT,                  -- Código de color: 6002, 9006, BRUTO...

        -- Material y proveedor
        doc_salida            TEXT,                  -- Documento de salida: C26-0312, STOCK MUR...
        proveedor             TEXT,                  -- Nombre del proveedor o almacén origen
        origen_material       TEXT,                  -- PROVEEDOR | STOCK MURCIA | STOCK VALENCIA

        -- Fechas del proceso (se van rellenando conforme avanza el pedido)
        fecha_salida          TEXT,                  -- Fecha salida del material
        fecha_planning        TEXT,                  -- Fecha planificada de producción
        fecha_terminado       TEXT,                  -- Fecha finalización producción
        fecha_carga_camion    TEXT,                  -- Fecha de carga en camión
        fecha_en_tarragona    TEXT,                  -- Fecha llegada a Tarragona
        fecha_entrega_cliente TEXT,                  -- Fecha de entrega al cliente

        -- Estado y control
        estado_pedido         TEXT DEFAULT 'SIN PEDIDO DE COMPRA',
          -- SIN PEDIDO DE COMPRA | EN PROCESO | PLANNING | PARA CARGAR MURCIA
          -- EN CAMION | EN ALMACÉN | ENTREGADO | ANULADO
        incidencia_material   TEXT DEFAULT 'NO',     -- SÍ | NO
        urgente               TEXT DEFAULT '',        -- Vacío = normal | URGENTE

        -- Almacén destino (calculado automáticamente)
        almacen               TEXT,                  -- MURCIA | TARRAGONA | VALENCIA

        -- Notas
        comentarios           TEXT,
        num_comentarios       INTEGER DEFAULT 0,

        -- Metadatos
        created_at            TEXT DEFAULT (datetime('now')),
        updated_at            TEXT DEFAULT (datetime('now')),

        UNIQUE(numero_pedido, tipo_salida)           -- Una línea por pedido+tipo
      )`,
    },

    // ─── COMENTARIOS ────────────────────────────────────────────────────────
    {
      name: 'comentarios',
      sql: `CREATE TABLE IF NOT EXISTS comentarios (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_pedido    TEXT NOT NULL,
        tipo_salida      TEXT,                        -- Para identificar la línea concreta si aplica
        texto            TEXT NOT NULL,
        tipo_nota        TEXT DEFAULT 'NOTA',         -- NOTA | URGENTE | INCIDENCIA | SEGUIMIENTO
        fecha_comentario TEXT DEFAULT (datetime('now')),
        usuario          TEXT
      )`,
    },

    // ─── INCIDENCIAS ────────────────────────────────────────────────────────
    {
      name: 'incidencias',
      sql: `CREATE TABLE IF NOT EXISTS incidencias (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_pedido      TEXT NOT NULL,
        tipo_salida        TEXT,
        fecha_incidencia   TEXT,
        tipo_incidencia    TEXT,
          -- MATERIAL DEFECTUOSO | FALTA MATERIAL | DAÑO TRANSPORTE
          -- ERROR PEDIDO | NO VIENE EN EL CAMION | MAL LACADO | OTRO
        descripcion        TEXT,
        estado_incidencia  TEXT DEFAULT 'ABIERTA',   -- ABIERTA | EN GESTION | RESUELTA | CERRADA
        fecha_resolucion   TEXT,
        comentarios        TEXT,
        created_at         TEXT DEFAULT (datetime('now')),
        updated_at         TEXT DEFAULT (datetime('now'))
      )`,
    },

    // ─── HISTORIAL ──────────────────────────────────────────────────────────
    {
      name: 'historial',
      sql: `CREATE TABLE IF NOT EXISTS historial (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_pedido    TEXT NOT NULL,
        tipo_salida      TEXT,
        fecha_movimiento TEXT DEFAULT (datetime('now')),
        usuario          TEXT,
        accion           TEXT,   -- CREACION | CAMBIO ESTADO | ACTUALIZACION | COMENTARIO | INCIDENCIA
        detalle          TEXT,
        estado_anterior  TEXT,
        estado_nuevo     TEXT
      )`,
    },
  ]

  let ok = 0
  let fail = 0

  for (const { name, sql } of statements) {
    try {
      await client.execute(sql)
      console.log(`✅ Tabla "${name}" creada`)
      ok++
    } catch (error: any) {
      console.error(`❌ Error en tabla "${name}": ${error.message}`)
      fail++
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Resultado: ${ok} tablas OK, ${fail} errores`)
  if (fail === 0) {
    console.log('🎉 ¡Base de datos lista en Turso!')
    console.log('\nTablas creadas:')
    console.log('  • usuarios    — usuarios del sistema')
    console.log('  • clientes    — clientes de Aluminios Franco')
    console.log('  • pedidos     — pedidos con líneas por TipoSalida')
    console.log('  • comentarios — notas de cada pedido')
    console.log('  • incidencias — incidencias de pedidos')
    console.log('  • historial   — registro de cambios')
  }
  process.exit(0)
}

createTables().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(1)
})
