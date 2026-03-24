/**
 * import-excel.ts
 * Importa los pedidos del archivo Excel (trazab.xlsx) a la base de datos Turso.
 *
 * ANTES DE EJECUTAR:
 *   1. Copia el archivo trazab.xlsx dentro de la carpeta "scripts" del proyecto
 *   2. Ejecuta: npx tsx scripts/import-excel.ts
 */
import { createClient } from '@libsql/client'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import * as XLSX from 'xlsx'

// ─── Cargar .env ─────────────────────────────────────────────────────────────
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

// ─── Conexión Turso ───────────────────────────────────────────────────────────
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// ─── Función: convertir fecha a YYYY-MM-DD ────────────────────────────────────
function toDateString(val: any): string | null {
  if (!val) return null
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null
    return val.toISOString().split('T')[0]
  }
  if (typeof val === 'string' && val.trim()) {
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val)
    if (!date) return null
    return `${date.y}-${String(date.m).padStart(2,'0')}-${String(date.d).padStart(2,'0')}`
  }
  return null
}

// ─── Función: calcular estado ─────────────────────────────────────────────────
function calcularEstado(row: any): string {
  if (row.EstadoPedido) return String(row.EstadoPedido).trim()
  if (row.FechaEntregaCliente) return 'ENTREGADO'
  if (row.FechaEnTarragona)    return 'EN ALMACÉN'
  if (row.FechaCargaCamion)    return 'EN CAMION'
  if (row.FechaTerminado)      return 'PARA CARGAR MURCIA'
  if (row.FechaPlanning)       return 'PLANNING'
  if (row.FechaSalida)         return 'EN PROCESO'
  return 'SIN PEDIDO DE COMPRA'
}

// ─── Función: calcular almacén ────────────────────────────────────────────────
function calcularAlmacen(row: any): string {
  if (row.FechaEnTarragona) return 'TARRAGONA'
  const prov = String(row.Proveedor || '').toUpperCase()
  if (prov.includes('VALENCIA')) return 'VALENCIA'
  return 'MURCIA'
}

// ─── Función: normalizar categoría ───────────────────────────────────────────
function normalizarCategoria(val: any): string {
  if (!val) return ''
  const cat = String(val).trim().toUpperCase()
  if (cat === 'CARPINTERIA') return 'CARPINTERÍA'
  if (cat === 'CARROCERIA')  return 'CARROCERÍA'
  return cat
}

// ─── Importación ─────────────────────────────────────────────────────────────
async function importar() {
  const posiblesPaths = [
    resolve(process.cwd(), 'scripts', 'trazab.xlsx'),
    resolve(process.cwd(), 'trazab.xlsx'),
  ]

  let excelPath = ''
  for (const p of posiblesPaths) {
    if (existsSync(p)) { excelPath = p; break }
  }

  if (!excelPath) {
    console.error('❌ No se encontró trazab.xlsx.')
    console.error('   Cópialo dentro de la carpeta "scripts" del proyecto y vuelve a ejecutar.')
    process.exit(1)
  }

  console.log('📂 Leyendo:', excelPath)
  const wb = XLSX.readFile(excelPath, { cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null })
  console.log(`📊 ${rows.length} filas encontradas\n`)

  let importados = 0, errores = 0, duplicados = 0

  for (const row of rows) {
    if (!row.NumeroPedido || !row.Cliente) { errores++; continue }

    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO pedidos (
          numero_pedido, tipo_salida, fecha_pedido,
          numero_cliente, codigo_comercial, cliente,
          categoria, referencia_producto, acabado, color,
          doc_salida, proveedor,
          fecha_salida, fecha_planning, fecha_terminado,
          fecha_carga_camion, fecha_en_tarragona, fecha_entrega_cliente,
          estado_pedido, incidencia_material, urgente, almacen, comentarios
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          String(row.NumeroPedido).trim(),
          row.TipoSalida ? String(row.TipoSalida).trim() : null,
          toDateString(row.FechaPedido),
          row.Title ? String(row.Title).trim() : null,
          row.CodigoComercial ? String(row.CodigoComercial).trim() : null,
          String(row.Cliente).trim(),
          normalizarCategoria(row.Categoria),
          row.ReferenciaProducto ? String(row.ReferenciaProducto).trim() : null,
          row.Acabado ? String(row.Acabado).trim() : null,
          row.Color   ? String(row.Color).trim()   : null,
          row.DocSalida ? String(row.DocSalida).trim() : null,
          row.Proveedor ? String(row.Proveedor).trim() : null,
          toDateString(row.FechaSalida),
          toDateString(row.FechaPlanning),
          toDateString(row.FechaTerminado),
          toDateString(row.FechaCargaCamion),
          toDateString(row.FechaEnTarragona),
          toDateString(row.FechaEntregaCliente),
          calcularEstado(row),
          row.IncidenciaMaterial ? String(row.IncidenciaMaterial).trim() : 'NO',
          '',
          calcularAlmacen(row),
          row.Comentarios ? String(row.Comentarios).trim() : null,
        ],
      })
      importados++
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) { duplicados++ }
      else { errores++; console.error(`\n❌ Error ${row.NumeroPedido}:`, err.message) }
    }
    process.stdout.write(`\r✅ ${importados} importados | ⚠️ ${duplicados} duplicados | ❌ ${errores} errores`)
  }

  console.log('\n\n' + '─'.repeat(45))
  console.log(`✅ Importados : ${importados}`)
  console.log(`⚠️  Duplicados : ${duplicados}`)
  console.log(`❌ Errores    : ${errores}`)
  console.log('─'.repeat(45))
  if (importados > 0) console.log(`\n🎉 ¡${importados} pedidos cargados en Turso!`)
  process.exit(0)
}

importar().catch(err => { console.error(err); process.exit(1) })
